import { useState, useEffect, useCallback, useRef, useId } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchAlerts, updateAlertStatus } from "@/services/alertService";
import type { Alert } from "@/types/alert";
import { toast } from "sonner";

function removeChannelByTopic(topic: string) {
  const existing = supabase.getChannels().find((c) => c.topic === topic);
  if (existing) {
    void supabase.removeChannel(existing);
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const isLive = useRef(false);
  const instanceId = useId().replace(/:/g, "");

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchAlerts();
      setAlerts(rows);
      isLive.current = true;
    } catch (e) {
      console.error(e);
      toast.error("Could not load alerts.");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) load();
      else {
        setAlerts([]);
        setLoading(false);
        isLive.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const topic = `alerts-realtime-${user.id}-${instanceId}`;
      removeChannelByTopic(topic);

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alerts",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            try {
              const rows = await fetchAlerts();
              setAlerts(rows);
            } catch {
              /* ignore refresh errors */
            }
          },
        );

      if (cancelled) {
        void supabase.removeChannel(channel);
        channel = null;
        return;
      }

      channel.subscribe();
    };

    void setup();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [instanceId]);

  const changeStatus = useCallback(
    async (id: string, status: Alert["status"]) => {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (isLive.current) {
        try {
          await updateAlertStatus(id, status);
        } catch {
          toast.error("Failed to update alert status.");
          await load();
          return;
        }
      }
      toast.success(`Alert marked as ${status}`);
    },
    [load],
  );

  return { alerts, setAlerts, loading, changeStatus, reload: load };
}

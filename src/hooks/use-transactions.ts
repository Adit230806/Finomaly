import { useState, useEffect, useCallback, useId } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTransactions,
  createTransaction,
  reviewTransaction as reviewTransactionInDb,
} from "@/services/transactionService";
import type { CreateTransactionInput, Transaction } from "@/types/transaction";
import { mapTransactionRow } from "@/lib/transaction-mapper";
import { toast } from "sonner";
import { formatINR } from "@/lib/currency";

function removeChannelByTopic(topic: string) {
  const existing = supabase.getChannels().find((c) => c.topic === topic);
  if (existing) {
    void supabase.removeChannel(existing);
  }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const instanceId = useId().replace(/:/g, "");

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchTransactions();
      setTransactions(rows);
    } catch (e) {
      console.error(e);
      toast.error("Could not load transactions.");
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
        setTransactions([]);
        setLoading(false);
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

      const topic = `transactions-realtime-${user.id}-${instanceId}`;
      removeChannelByTopic(topic);

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const tx = mapTransactionRow(payload.new as Record<string, unknown>);
            setTransactions((prev) => {
              if (prev.some((t) => t.id === tx.id)) return prev;
              return [tx, ...prev];
            });
            if (tx.isAnomaly) {
              toast.error(`Anomaly: ${tx.merchant} — ${formatINR(tx.amount)}`);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const tx = mapTransactionRow(payload.new as Record<string, unknown>);
            setTransactions((prev) =>
              prev.map((t) => (t.id === tx.id ? tx : t)),
            );
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

  const reviewTransaction = async (
    id: string,
    isAnomaly: boolean,
  ): Promise<Transaction> => {
    const updated = await reviewTransactionInDb(id, isAnomaly);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const addTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const saved = await createTransaction(input);
    setTransactions((prev) => {
      if (prev.some((t) => t.id === saved.id)) return prev;
      return [saved, ...prev];
    });
    return saved;
  };

  return { transactions, loading, addTransaction, reviewTransaction, reload: load };
}

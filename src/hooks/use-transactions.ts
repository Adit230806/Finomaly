import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTransactions,
  createTransaction,
} from "@/services/transactionService";
import type { CreateTransactionInput, Transaction } from "@/types/transaction";
import { mapTransactionRow } from "@/lib/transaction-mapper";
import { toast } from "sonner";
import { formatINR } from "@/lib/currency";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`transactions-realtime-${user.id}`)
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
        .subscribe();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

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

  return { transactions, loading, addTransaction, reload: load };
}

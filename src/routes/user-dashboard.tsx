import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TransactionSimulator } from "@/components/dashboard/TransactionSimulator";
import { RecentSimulations } from "@/components/dashboard/RecentSimulations";
import { useTransactions } from "@/hooks/use-transactions";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/user-dashboard")({ component: UserDashboardPage });

function UserDashboardPage() {
  const { transactions, loading } = useTransactions();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#00C853]" />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F9EF] text-[#00A844]">
                Fraud Simulator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A0A0A]">Submit Transaction</h1>
            <p className="text-[#6B6B6B] text-sm mt-2 max-w-md mx-auto">
              Run a transaction through the AI fraud engine and get an instant prediction
            </p>
          </motion.div>

          <TransactionSimulator />
          <RecentSimulations transactions={transactions} loading={loading} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

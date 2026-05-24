import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-[#0A0A0A] mb-2">{title}</h3>
            <p className="text-sm text-[#6B6B6B] mb-6">{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-[#E8E6E0] text-sm font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? "bg-[#FF3B30] hover:bg-[#CC2200]" : "bg-[#00C853] hover:bg-[#00A844]"}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useEffect } from "react";

const variants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const icons = {
    success: <CheckCircle className="text-emerald-400" size={20} />,
    error: <AlertCircle className="text-red-400" size={20} />,
    warning: <AlertTriangle className="text-amber-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />,
};

const bgColors = {
    success: "bg-emerald-500/10 border-emerald-500/20",
    error: "bg-red-500/10 border-red-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
};

function ToastItem({ id, type, message, duration, onDismiss }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onDismiss(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onDismiss]);

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative flex items-center gap-3 w-full max-w-sm p-4 rounded-xl border backdrop-blur-md shadow-xl ${bgColors[type]} pointer-events-auto overflow-hidden`}
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="flex-1 text-sm font-medium text-slate-200">{message}</p>
            <button
                onClick={() => onDismiss(id)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>

            {/* Progress bar for auto-dismissing toasts */}
            {duration > 0 && (
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20"
                />
            )}
        </motion.div>
    );
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} {...toast} onDismiss={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
}

import { createContext, useContext, useState, useCallback } from "react";
import ToastContainer from "../components/ui/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = {
        toasts,
        removeToast,
        success: (msg, duration) => addToast("success", msg, duration),
        error: (msg, duration) => addToast("error", msg, duration),
        warning: (msg, duration) => addToast("warning", msg, duration),
        info: (msg, duration) => addToast("info", msg, duration),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

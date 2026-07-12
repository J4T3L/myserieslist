"use client";

import React from "react";
import { useApp } from "../context/AppContext";

export default function ToastContainer() {
    const { toasts, removeToast } = useApp();

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast-item toast-${t.type}`}>
                    <span className="toast-icon">
                        {t.type === "success" ? "✓" : t.type === "warning" ? "⚠" : "ℹ"}
                    </span>
                    <span className="toast-message">{t.message}</span>
                    <button className="toast-close" onClick={() => removeToast(t.id)}>
                        ✕
                    </button>
                    <div className="toast-progress"></div>
                </div>
            ))}
        </div>
    );
}

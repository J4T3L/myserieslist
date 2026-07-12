"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function AuthModal() {
    const {
        isAuthModalOpen,
        setIsAuthModalOpen,
        authTab,
        setAuthTab,
        handleAuthSubmit,
    } = useApp();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Clear inputs when modal opens/closes or tab changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setUsername("");
            setPassword("");
            setError("");
        }, 0);
        return () => clearTimeout(timer);
    }, [isAuthModalOpen, authTab]);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Username dan password tidak boleh kosong.");
            return;
        }

        setLoading(true);
        try {
            const success = await handleAuthSubmit(username, password, authTab);
            if (!success) {
                if (authTab === "login") {
                    setError("Username atau password salah.");
                } else {
                    setError("Username sudah terdaftar.");
                }
            }
        } catch {
            setError("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
            <div
                className="auth-card modal-container"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "440px", padding: "40px 30px" }}
            >
                <button
                    className="modal-close-btn"
                    onClick={() => setIsAuthModalOpen(false)}
                    title="Close"
                >
                    ✕
                </button>
                <div className="auth-header" style={{ marginBottom: "20px" }}>
                    <h1
                        className="auth-logo"
                        style={{
                            fontSize: "28px",
                            color: "var(--netflix-red)",
                            fontWeight: "900",
                            letterSpacing: "-1.5px",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                        }}
                    >
                        My<span>CineList</span>
                    </h1>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        Masuk atau daftar untuk menyusun daftar tontonan!
                    </p>
                </div>

                <div
                    className="auth-switch-tabs"
                    style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "20px",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        paddingBottom: "10px",
                    }}
                >
                    <button
                        className={`tab-btn ${authTab === "login" ? "active" : ""}`}
                        style={{
                            padding: "8px 16px",
                            background: "transparent",
                            border: "none",
                            color: authTab === "login" ? "#export" : "var(--text-muted)",
                            fontWeight: "700",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setAuthTab("login");
                            setError("");
                        }}
                    >
                        MASUK
                    </button>
                    <button
                        className={`tab-btn ${authTab === "signup" ? "active" : ""}`}
                        style={{
                            padding: "8px 16px",
                            background: "transparent",
                            border: "none",
                            color: authTab === "signup" ? "#export" : "var(--text-muted)",
                            fontWeight: "700",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setAuthTab("signup");
                            setError("");
                        }}
                    >
                        DAFTAR
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            color: "#ef4444",
                            fontSize: "11px",
                            background: "rgba(239, 68, 68, 0.1)",
                            padding: "10px",
                            borderRadius: "4px",
                            marginBottom: "16px",
                            textAlign: "center",
                            fontWeight: "600",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="auth-form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Username</label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Username Anda..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                background: "#333",
                                border: "none",
                                borderRadius: "4px",
                                color: "#fff",
                                outline: "none",
                            }}
                            required
                        />
                    </div>

                    <div className="auth-form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Password</label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Password Anda..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                background: "#333",
                                border: "none",
                                borderRadius: "4px",
                                color: "#fff",
                                outline: "none",
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-auth-submit"
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "var(--netflix-red)",
                            border: "none",
                            borderRadius: "4px",
                            color: "#fff",
                            fontWeight: "700",
                            cursor: "pointer",
                            marginTop: "10px",
                        }}
                        disabled={loading}
                    >
                        {loading
                            ? "Memproses..."
                            : authTab === "login"
                                ? "Masuk ke Akun"
                                : "Daftar & Masuk"}
                    </button>

                    <div style={{ textAlign: "center", margin: "10px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                        — ATAU —
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            // Impor secara dinamis jika dibutuhkan, atau pastikan di atas file ada: import { signIn } from "next-auth/react";
                            import("next-auth/react").then((mod) => mod.signIn("google"));
                        }}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            color: "#000",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Login with Google
                    </button>
                </form>
            </div>
        </div>
    );
}

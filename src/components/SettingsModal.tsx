"use client";

import React, { useRef } from "react";
import { useApp } from "../context/AppContext";

export default function SettingsModal() {
    const {
        settingsOpen,
        setSettingsOpen,
        currentUser,
        handleExportData,
        handleImportData,
        handleResetData,
    } = useApp();

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!settingsOpen) return null;

    return (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "500px", padding: "30px" }}
            >
                <button className="modal-close-btn" onClick={() => setSettingsOpen(false)}>
                    ✕
                </button>
                <h2
                    style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        marginBottom: "16px",
                        background: "var(--accent-gradient)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Pengaturan List & Backup
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.6" }}>
                    Kelola list tontonan akun <strong>{currentUser}</strong>. Ekspor data watchlist lokal ke file JSON, atau pulihkan list dari file JSON backup.
                </p>

                <div className="backup-section">
                    <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Backup / Ekspor</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Simpan salinan data tontonan lokal Anda dalam format .json.</p>
                    <button
                        className="hero-btn"
                        style={{ margin: 0, width: "100%", background: "var(--accent-gradient)", border: "none" }}
                        onClick={handleExportData}
                    >
                        Ekspor Watchlist (JSON)
                    </button>
                </div>

                <div className="backup-section">
                    <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Pulihkan / Impor</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Pilih file .json cadangan Anda untuk memulihkan atau menggabungkan data watchlist.</p>
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleImportData}
                    />
                    <button
                        className="btn-secondary"
                        style={{ width: "100%", padding: "10px" }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Pilih File Cadangan...
                    </button>
                </div>

                <div className="backup-section" style={{ border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#ef4444" }}>Zona Bahaya</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Ini akan menghapus seluruh daftar tontonan akun Anda.</p>
                    <button className="btn-danger" style={{ width: "100%" }} onClick={handleResetData}>
                        Kosongkan Watchlist Saya
                    </button>
                </div>
            </div>
        </div>
    );
}

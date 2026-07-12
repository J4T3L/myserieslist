"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function SuperSUPage() {
    const { currentUser, currentRole, showToast } = useApp();
    const [usersList, setUsersList] = useState<any[]>([]);
    const [inspectedUser, setInspectedUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAllUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsersList(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllUsers();
    }, []);

    // Security Check: Deny access if not supersu
    if (!currentUser || currentRole !== "supersu") {
        return (
            <div className="tab-content-enter" style={{ padding: "100px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>⛔</div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#9333ea", marginBottom: "12px" }}>
                    Akses Superuser Ditolak
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
                    Halaman ini membutuhkan privilege tinggi dan hanya dapat diakses oleh akun Superuser (SuperSU). Silakan kembali ke beranda.
                </p>
                <Link href="/" className="hero-btn" style={{ float: "none", margin: "0 auto", textDecoration: "none", background: "#9333ea" }}>
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading supersu data...</div>;

    // --- PLATFORM ANALYTICS ---
    const totalUsers = usersList.length;
    const totalAdmins = usersList.filter(u => u.role === "admin").length;
    const totalSuperSUs = usersList.filter(u => u.role === "supersu").length;
    const totalTrackedShows = usersList.reduce((sum, u) => sum + (u.watchlistCount || 0), 0);

    // --- ACTIONS ---
    const changeUserRole = async (email: string, newRole: "user" | "admin" | "supersu") => {
        if (email.toLowerCase() === currentUser.toLowerCase()) {
            showToast("Anda tidak dapat mengubah peran Anda sendiri!", "warning");
            return;
        }

        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetEmail: email, newRole })
            });

            if (res.ok) {
                showToast(`Berhasil mengubah peran ${email} menjadi ${newRole}.`, "success");
                loadAllUsers();
                if (inspectedUser && inspectedUser.email === email) {
                    setInspectedUser({ ...inspectedUser, role: newRole });
                }
            } else {
                const data = await res.json();
                showToast(data.error || "Gagal mengubah peran", "warning");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteUserAccount = async (email: string) => {
        if (email.toLowerCase() === currentUser.toLowerCase()) {
            showToast("Anda tidak dapat menghapus akun Anda sendiri!", "warning");
            return;
        }

        if (window.confirm(`Peringatan SuperSU: Apakah Anda yakin ingin menghapus akun "${email}"? Semua daftar watchlist mereka akan hilang secara permanen.`)) {
            try {
                const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
                    method: "DELETE"
                });
                if (res.ok) {
                    showToast(`Akun user "${email}" berhasil dihapus dari sistem.`, "info");
                    loadAllUsers();
                    if (inspectedUser && inspectedUser.email === email) {
                        setInspectedUser(null);
                    }
                } else {
                    const data = await res.json();
                    showToast(data.error || "Gagal menghapus akun", "warning");
                }
            } catch(err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="tab-content-enter">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <h2
                    className="section-title"
                    style={{
                        fontSize: "24px",
                        fontWeight: "850",
                        background: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        margin: 0,
                    }}
                >
                    SuperSU Management Dashboard
                </h2>
                <span style={{ fontSize: "12px", background: "rgba(147, 51, 234, 0.15)", color: "#c084fc", padding: "4px 10px", borderRadius: "12px", fontWeight: "750" }}>
                    Role: Superuser (Root)
                </span>
            </div>

            {/* SUPERSU ANALYTICS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "30px" }}>
                <div className="stats-card" style={{ borderTop: "2px solid #9333ea" }}>
                    <span className="stats-value">{totalUsers}</span>
                    <span className="stats-label">Total Akun Terdaftar</span>
                </div>
                <div className="stats-card" style={{ borderTop: "2px solid #3b82f6" }}>
                    <span className="stats-value">{totalTrackedShows}</span>
                    <span className="stats-label">Total Serial Dilacak (Global)</span>
                </div>
                <div className="stats-card" style={{ borderTop: "2px solid #ef4444" }}>
                    <span className="stats-value">{totalAdmins}</span>
                    <span className="stats-label">Administrator Aktif</span>
                </div>
                <div className="stats-card" style={{ borderTop: "2px solid #c084fc" }}>
                    <span className="stats-value">{totalSuperSUs}</span>
                    <span className="stats-label">Superuser (SuperSU)</span>
                </div>
            </div>

            {/* USERS TABLE */}
            <div className="admin-panel" style={{ marginBottom: "30px", padding: "0" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#fff", margin: 0 }}>Sistem Manajemen Pengguna</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                        Klik pada username untuk menginspeksi daftar tontonan (watchlist) mereka.
                    </p>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left", color: "var(--text-secondary)" }}>
                                <th style={{ padding: "12px 20px", fontWeight: "600" }}>Username/Email</th>
                                <th style={{ padding: "12px 20px", fontWeight: "600" }}>Total Watchlist</th>
                                <th style={{ padding: "12px 20px", fontWeight: "600" }}>Role Access</th>
                                <th style={{ padding: "12px 20px", fontWeight: "600", textAlign: "right" }}>Aksi Berbahaya</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u, idx) => (
                                <tr
                                    key={idx}
                                    style={{
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        background: inspectedUser?.email === u.email ? "rgba(147, 51, 234, 0.05)" : "transparent",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <td style={{ padding: "12px 20px" }}>
                                        <button
                                            onClick={() => setInspectedUser(u)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: inspectedUser?.email === u.email ? "#c084fc" : "#fff",
                                                fontWeight: "800",
                                                fontSize: "14px",
                                                cursor: "pointer",
                                                padding: 0
                                            }}
                                            title="Inspeksi Watchlist"
                                        >
                                            {u.name || u.email} {u.email === currentUser && "(Anda)"}
                                        </button>
                                    </td>
                                    <td style={{ padding: "12px 20px", color: "var(--text-secondary)" }}>
                                        <span style={{ fontWeight: "700", color: "#fff" }}>{u.watchlistCount || 0}</span> Serial
                                    </td>
                                    <td style={{ padding: "12px 20px" }}>
                                        <select
                                            value={u.role}
                                            onChange={(e) => changeUserRole(u.email, e.target.value as any)}
                                            disabled={u.email === currentUser}
                                            style={{
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                color: u.role === "supersu" ? "#c084fc" : u.role === "admin" ? "var(--netflix-red)" : "#fff",
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                cursor: u.email === currentUser ? "not-allowed" : "pointer",
                                                opacity: u.email === currentUser ? 0.5 : 1,
                                            }}
                                        >
                                            <option value="user" style={{ color: "#000" }}>User Standard</option>
                                            <option value="admin" style={{ color: "#000" }}>Administrator</option>
                                            <option value="supersu" style={{ color: "#000" }}>SuperSU</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: "12px 20px", textAlign: "right" }}>
                                        <button
                                            onClick={() => deleteUserAccount(u.email)}
                                            disabled={u.email === currentUser}
                                            style={{
                                                background: "rgba(239, 68, 68, 0.1)",
                                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                                color: "#ef4444",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                cursor: u.email === currentUser ? "not-allowed" : "pointer",
                                                opacity: u.email === currentUser ? 0.3 : 1
                                            }}
                                        >
                                            Hapus Akun
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* WATCHLIST INSPECTOR */}
            {inspectedUser && (
                <div className="admin-panel tab-content-enter" style={{ borderLeft: "4px solid #9333ea" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#fff", margin: 0 }}>
                                Inspeksi Watchlist: <span style={{ color: "#c084fc" }}>{inspectedUser.name || inspectedUser.email}</span>
                            </h3>
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                                Total {inspectedUser.watchlistCount || 0} serial disimpan
                            </p>
                        </div>
                        <button
                            onClick={() => setInspectedUser(null)}
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "none",
                                color: "#fff",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer"
                            }}
                        >
                            Tutup Inspektur
                        </button>
                    </div>

                    {!inspectedUser.watchlist || inspectedUser.watchlist.length === 0 ? (
                        <div style={{ padding: "30px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                            <span style={{ fontSize: "24px" }}>📭</span>
                            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>User ini belum memiliki data watchlist.</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                            {inspectedUser.watchlist.map((item: any) => (
                                <a
                                    key={item.show.id}
                                    href={`/shows/${item.show.id}`}
                                    className="ranking-item"
                                    style={{
                                        textDecoration: "none",
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                        padding: "10px",
                                        borderRadius: "8px",
                                        display: "flex",
                                        gap: "12px"
                                    }}
                                >
                                    <img
                                        src={item.show.image?.medium || ""}
                                        alt={item.show.name}
                                        style={{ width: "45px", height: "65px", objectFit: "cover", borderRadius: "4px" }}
                                    />
                                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: "750", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {item.show.name}
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", marginTop: "6px", alignItems: "center" }}>
                                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: "700" }}>
                                                {item.trackerStatus.toUpperCase()}
                                            </span>
                                            {item.personalRating && item.personalRating > 0 && (
                                                <span style={{ fontSize: "11px", color: "var(--gold-color)", fontWeight: "700" }}>
                                                    ★ {item.personalRating}/10
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

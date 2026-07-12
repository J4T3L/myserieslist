"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function AdminPage() {
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

    // Security Check: Deny access if not admin
    if (!currentUser || currentRole !== "admin") {
        return (
            <div className="tab-content-enter" style={{ padding: "100px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>🚨</div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", marginBottom: "12px" }}>
                    Akses Ditolak
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
                    Halaman ini hanya dapat diakses oleh administrator dengan hak akses khusus. Silakan kembali ke beranda.
                </p>
                <Link href="/" className="hero-btn" style={{ float: "none", margin: "0 auto", textDecoration: "none" }}>
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading admin data...</div>;

    // --- PLATFORM ANALYTICS ---
    const totalUsers = usersList.length;
    const totalTrackedShows = usersList.reduce((sum, u) => sum + (u.watchlistCount || 0), 0);

    // Find most popular show
    const showCounts: { [key: string]: { count: number; name: string; poster: string } } = {};
    usersList.forEach((u) => {
        if (u.watchlist) {
            u.watchlist.forEach((wi: any) => {
                const id = wi.show?.id;
                if (!id) return;
                if (!showCounts[id]) {
                    showCounts[id] = {
                        count: 0,
                        name: wi.show.name,
                        poster: wi.show.image?.medium || "",
                    };
                }
                showCounts[id].count += 1;
            });
        }
    });

    const popularShowsList = Object.entries(showCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 1);

    const mostPopularShow = popularShowsList.length > 0 ? popularShowsList[0][1] : null;

    // --- ACTIONS ---
    const toggleUserRole = async (email: string, currentPeran: string) => {
        if (email.toLowerCase() === currentUser.toLowerCase()) {
            showToast("Anda tidak dapat mengubah peran Anda sendiri!", "warning");
            return;
        }

        const newPeran = currentPeran === "admin" ? "user" : "admin";
        
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetEmail: email, newRole: newPeran })
            });

            if (res.ok) {
                showToast(`Berhasil mengubah peran ${email} menjadi ${newPeran}.`, "success");
                loadAllUsers();
                if (inspectedUser && inspectedUser.email === email) {
                    setInspectedUser({ ...inspectedUser, role: newPeran });
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

        if (window.confirm(`Apakah Anda yakin ingin menghapus akun user "${email}"? Semua daftar watchlist mereka akan hilang.`)) {
            try {
                const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
                    method: "DELETE"
                });
                if (res.ok) {
                    showToast(`Akun user "${email}" berhasil dihapus.`, "info");
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2
                    className="section-title"
                    style={{
                        fontSize: "24px",
                        fontWeight: "850",
                        background: "var(--accent-gradient)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        margin: 0,
                    }}
                >
                    Admin Management Dashboard
                </h2>
                <span style={{ fontSize: "12px", background: "rgba(229, 9, 20, 0.15)", color: "var(--netflix-red)", padding: "4px 10px", borderRadius: "12px", fontWeight: "750" }}>
                    Role: System Administrator
                </span>
            </div>

            {/* ADMIN ANALYTICS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "30px" }}>
                <div className="stats-card">
                    <span className="stats-value">{totalUsers}</span>
                    <span className="stats-label">Total Pengguna Terdaftar</span>
                </div>
                <div className="stats-card">
                    <span className="stats-value">{totalTrackedShows}</span>
                    <span className="stats-label">Show Dilacak (Semua Pengguna)</span>
                </div>
                {mostPopularShow && (
                    <div className="stats-card" style={{ display: "flex", flexDirection: "row", gap: "12px", alignItems: "center", textAlign: "left" }}>
                        <img src={mostPopularShow.poster} alt={mostPopularShow.name} style={{ width: "40px", height: "55px", objectFit: "cover", borderRadius: "4px" }} />
                        <div style={{ minWidth: 0 }}>
                            <div
                                className="stats-value"
                                style={{ fontSize: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                                {mostPopularShow.name}
                            </div>
                            <span className="stats-label">Serial Terpopuler ({mostPopularShow.count} User)</span>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: inspectedUser ? "1.2fr 1fr" : "1fr", gap: "24px", transition: "all 0.3s" }}>

                {/* USERS LIST TABLE */}
                <div className="table-wrapper" style={{ margin: 0, background: "var(--surface-color)", padding: "20px", borderRadius: "10px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px" }}>Daftar Pengguna Platform</h3>
                    <table className="mal-table">
                        <thead>
                            <tr>
                                <th>Username/Email</th>
                                <th style={{ width: "100px", textAlign: "center" }}>Role</th>
                                <th style={{ width: "100px", textAlign: "center" }}>Watchlist</th>
                                <th style={{ width: "120px", textAlign: "center" }}>Ubah Role</th>
                                <th style={{ width: "140px", textAlign: "center" }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((user) => (
                                <tr key={user.email} style={{ background: inspectedUser?.email === user.email ? "rgba(255,255,255,0.03)" : "transparent" }}>
                                    <td style={{ fontWeight: "700" }}>
                                        {user.name || user.email} {user.email === currentUser && <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>(Anda)</span>}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                padding: "2px 8px",
                                                borderRadius: "10px",
                                                fontWeight: "bold",
                                                background: user.role === "admin" ? "var(--netflix-red)" : "rgba(255,255,255,0.1)",
                                                color: "#fff",
                                            }}
                                        >
                                            {user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: "600" }}>
                                        {user.watchlistCount || 0} items
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            onClick={() => toggleUserRole(user.email, user.role)}
                                            disabled={user.email === currentUser || user.role === "supersu"}
                                            style={{
                                                padding: "4px 8px",
                                                fontSize: "11px",
                                                cursor: (user.email === currentUser || user.role === "supersu") ? "not-allowed" : "pointer",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "4px",
                                                opacity: (user.email === currentUser || user.role === "supersu") ? 0.3 : 1,
                                                color: "#fff",
                                            }}
                                        >
                                            Ubah ke {user.role === "admin" ? "USER" : "ADMIN"}
                                        </button>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <button
                                                onClick={() => setInspectedUser(user)}
                                                style={{
                                                    padding: "4px 10px",
                                                    fontSize: "11px",
                                                    cursor: "pointer",
                                                    background: "var(--accent-gradient)",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    color: "#fff",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Inspeksi
                                            </button>
                                            <button
                                                onClick={() => deleteUserAccount(user.email)}
                                                disabled={user.email === currentUser || user.role === "supersu"}
                                                style={{
                                                    padding: "4px 8px",
                                                    fontSize: "11px",
                                                    cursor: (user.email === currentUser || user.role === "supersu") ? "not-allowed" : "pointer",
                                                    background: "rgba(239, 68, 68, 0.15)",
                                                    color: "#f87171",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    opacity: (user.email === currentUser || user.role === "supersu") ? 0.3 : 1,
                                                }}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* INSPECT WATCHLIST PANEL */}
                {inspectedUser && (
                    <div
                        className="stats-block-card tab-content-enter"
                        style={{
                            background: "var(--surface-color)",
                            padding: "20px",
                            borderRadius: "10px",
                            border: "1px solid var(--surface-border)",
                            maxHeight: "600px",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "800" }}>
                                Inspeksi Watchlist: <span style={{ color: "var(--netflix-red)" }}>{inspectedUser.name || inspectedUser.email}</span>
                            </h3>
                            <button
                                onClick={() => setInspectedUser(null)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {!inspectedUser.watchlist || inspectedUser.watchlist.length === 0 ? (
                                <div style={{ color: "var(--text-secondary)", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
                                    Watchlist user ini kosong.
                                </div>
                            ) : (
                                inspectedUser.watchlist.map((item: any) => (
                                    <div
                                        key={item.show.id}
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            background: "rgba(255,255,255,0.02)",
                                            padding: "10px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(255,255,255,0.03)",
                                            fontSize: "12px",
                                        }}
                                    >
                                        <img
                                            src={item.show.image?.medium || ""}
                                            alt={item.show.name}
                                            style={{ width: "36px", height: "50px", borderRadius: "3px", objectFit: "cover" }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                {item.show.name}
                                            </div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "2px" }}>
                                                Status: <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{item.trackerStatus}</span>
                                            </div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "10px", marginTop: "2px" }}>
                                                Progress: {item.watchedEpisodeIds?.length || 0} / {item.totalEpisodes || "?"} Ep
                                            </div>
                                        </div>
                                        {item.personalRating && (
                                            <div style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", padding: "2px 6px", height: "fit-content", borderRadius: "4px", fontWeight: "700", fontSize: "10px" }}>
                                                ★ {item.personalRating}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

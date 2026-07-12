"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export default function StatsPage() {
    const {
        currentUser,
        watchlist,
        setIsAuthModalOpen,
        setAuthTab,
        handleIncrementEpisodeCount,
        showToast
    } = useApp();

    if (!currentUser) {
        return (
            <div className="tab-content-enter" style={{ padding: "80px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>📊</div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px" }}>
                    Dashboard Menonton Anda
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
                    Masuk atau daftarkan akun untuk melihat analisis riwayat menonton, jam menonton, genre favorit, dan mengelola progres tontonan harian Anda.
                </p>
                <button
                    className="hero-btn"
                    style={{ float: "none", margin: "0 auto", background: "var(--netflix-red)", border: "none" }}
                    onClick={() => {
                        setAuthTab("login");
                        setIsAuthModalOpen(true);
                    }}
                >
                    Masuk Sekarang
                </button>
            </div>
        );
    }

    // --- CONTINUING WATCHING ---
    const watchingShows = watchlist.filter((item) => item.trackerStatus === "watching");

    // --- STATS CALCULATIONS ---
    const totalTitles = watchlist.length;

    const totalEpisodes = watchlist.reduce((sum, item) => sum + item.watchedEpisodeIds.length, 0);

    const totalMinutes = watchlist.reduce((sum, item) => {
        const runtime = item.show.runtime || 45; // Default 45m
        return sum + item.watchedEpisodeIds.length * runtime;
    }, 0);

    const daysWatched = (totalMinutes / 1440).toFixed(1);
    const hoursWatched = (totalMinutes / 60).toFixed(0);

    const ratedItems = watchlist.filter((item) => item.personalRating !== null);
    const avgRating = ratedItems.length
        ? (ratedItems.reduce((sum, item) => sum + (item.personalRating || 0), 0) / ratedItems.length).toFixed(1)
        : "N/A";

    const completedCount = watchlist.filter((item) => item.trackerStatus === "completed").length;
    const planToWatchCount = watchlist.filter((item) => item.trackerStatus === "plantowatch").length;
    const onHoldCount = watchlist.filter((item) => item.trackerStatus === "onhold").length;
    const droppedCount = watchlist.filter((item) => item.trackerStatus === "dropped").length;

    // --- GENRE ANALYTICS ---
    const genreCounts: { [key: string]: number } = {};
    watchlist.forEach((item) => {
        item.show.genres.forEach((g) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
    });

    const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxGenreCount = sortedGenres.length > 0 ? sortedGenres[0][1] : 1;

    // --- RECENT ACTIVITY LOGS ---
    const recentActivity = [...watchlist]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

    const getStatusLabelText = (status: string) => {
        if (status === "watching") return "Menonton";
        if (status === "completed") return "Selesai";
        if (status === "onhold") return "Ditunda";
        if (status === "dropped") return "Dihentikan";
        return "Rencana";
    };

    return (
        <div className="tab-content-enter">
            {/* WELCOME DASHBOARD HEADER */}
            <div
                style={{
                    background: "linear-gradient(135deg, rgba(255,30,39,0.1) 0%, rgba(8,8,10,0.5) 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "16px",
                    padding: "30px 4%",
                    marginBottom: "30px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "20px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
                }}
            >
                <div>
                    <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#fff", marginBottom: "8px" }}>
                        Selamat Datang Kembali, {currentUser}! 👋
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "600px", lineHeight: "1.5" }}>
                        Pantau progres tontonan Anda secara langsung, lihat analisis genre favorit, dan perbarui progres nonton serial TV Anda dengan cepat di pusat kendali personal Anda.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <a href="/watchlist" className="hero-btn" style={{ marginTop: 0, textDecoration: "none" }}>
                        Buka Watchlist Saya 📋
                    </a>
                </div>
            </div>

            {/* CONTINUE WATCHING SECTION */}
            <div className="stats-block-card" style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    🍿 Lanjutkan Menonton
                </h3>
                {watchingShows.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.08)" }}>
                        Belum ada serial yang sedang Anda tonton saat ini. Silakan kunjungi halaman Discover untuk mencari serial TV favorit Anda!
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {watchingShows.map((item) => (
                            <div
                                key={item.show.id}
                                style={{
                                    display: "flex",
                                    gap: "14px",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "10px",
                                    padding: "12px",
                                    position: "relative",
                                    transition: "var(--transition-premium)",
                                }}
                                className="dashboard-watching-card"
                            >
                                <img
                                    src={item.show.image?.medium || ""}
                                    alt={item.show.name}
                                    style={{
                                        width: "60px",
                                        height: "85px",
                                        objectFit: "cover",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => window.location.href = `/shows/${item.show.id}`}
                                />
                                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div style={{ paddingRight: "45px" }}>
                                        <div
                                            style={{ fontWeight: "700", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                                            onClick={() => window.location.href = `/shows/${item.show.id}`}
                                            title={item.show.name}
                                        >
                                            {item.show.name}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            {item.show.genres.slice(0, 2).join(", ")}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginBottom: "4px" }}>
                                            <span>Ep <strong>{item.watchedEpisodeIds.length}</strong> / {item.totalEpisodes > 0 ? item.totalEpisodes : "?"}</span>
                                            {item.totalEpisodes > 0 && (
                                                <span>{Math.round((item.watchedEpisodeIds.length / item.totalEpisodes) * 100)}%</span>
                                            )}
                                        </div>
                                        {item.totalEpisodes > 0 && (
                                            <div className="card-progress-bar-container" style={{ margin: 0 }}>
                                                <div
                                                    className="card-progress-bar"
                                                    style={{ width: `${(item.watchedEpisodeIds.length / item.totalEpisodes) * 100}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <button
                                    onClick={(e) => {
                                        handleIncrementEpisodeCount(item.show.id, e);
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: "12px",
                                        right: "12px",
                                        background: "var(--netflix-red)",
                                        border: "none",
                                        borderRadius: "6px",
                                        color: "#fff",
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        fontWeight: "750",
                                        cursor: "pointer",
                                        transition: "var(--transition-premium)",
                                    }}
                                    className="btn-quick-plus"
                                    title="Tonton 1 Episode Lagi"
                                >
                                    +1 Ep
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* STATS OVERVIEW CARDS */}
            <div className="stats-grid">
                <div className="stats-card">
                    <span className="stats-value">{totalTitles}</span>
                    <span className="stats-label">Total Judul Lacak</span>
                </div>
                <div className="stats-card">
                    <span className="stats-value">{totalEpisodes}</span>
                    <span className="stats-label">Episode Ditonton</span>
                </div>
                <div className="stats-card">
                    <span className="stats-value" title={`${hoursWatched} Jam`}>
                        {daysWatched} Hari
                    </span>
                    <span className="stats-label">Estimasi Waktu Nonton</span>
                </div>
                <div className="stats-card">
                    <span className="stats-value">
                        {avgRating} <span style={{ fontSize: "14px", color: "var(--gold-color)" }}>★</span>
                    </span>
                    <span className="stats-label">Rata-rata Rating Anda</span>
                </div>
            </div>

            <div className="stats-details-row">
                {/* Left Column: Genre charts */}
                <div className="stats-block-card" style={{ height: "100%" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>Genre Favorit Anda</h3>
                    {sortedGenres.length === 0 ? (
                        <div style={{ color: "var(--text-secondary)", fontSize: "13px", padding: "10px 0" }}>
                            Belum ada data genre. Tambahkan serial tontonan untuk melihat data.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {sortedGenres.map(([genre, count]) => {
                                const percentage = (count / maxGenreCount) * 100;
                                return (
                                    <div key={genre}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                                            <span style={{ fontWeight: "700" }}>{genre}</span>
                                            <span style={{ color: "var(--text-secondary)" }}>{count} Serial</span>
                                        </div>
                                        <div
                                            style={{
                                                height: "10px",
                                                background: "rgba(255,255,255,0.05)",
                                                borderRadius: "5px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${percentage}%`,
                                                    background: "var(--accent-gradient)",
                                                    borderRadius: "5px",
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Status breakdown & recent updates */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Status Progress breakdown */}
                    <div className="stats-block-card">
                        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Distribusi Status</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                                <span>Sedang Ditonton (Watching)</span>
                                <strong style={{ color: "#60a5fa" }}>{watchingShows.length}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                                <span>Selesai Ditonton (Completed)</span>
                                <strong style={{ color: "#34d399" }}>{completedCount}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                                <span>Daftar Rencana (Plan to Watch)</span>
                                <strong style={{ color: "#cbd5e1" }}>{planToWatchCount}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                                <span>Ditunda (On Hold)</span>
                                <strong style={{ color: "#fbbf24" }}>{onHoldCount}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                                <span>Dihentikan (Dropped)</span>
                                <strong style={{ color: "#f87171" }}>{droppedCount}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className="stats-block-card">
                        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Aktivitas Terbaru</h3>
                        {recentActivity.length === 0 ? (
                            <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Tidak ada aktivitas terbaru.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {recentActivity.map((item) => (
                                    <div
                                        key={item.show.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                                            paddingBottom: "8px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        <img
                                            src={item.show.image?.medium || ""}
                                            alt={item.show.name}
                                            style={{ width: "24px", height: "36px", borderRadius: "2px", objectFit: "cover" }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                {item.show.name}
                                            </div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                                                Status: {getStatusLabelText(item.trackerStatus)} • {item.watchedEpisodeIds.length} Ep
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                            {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

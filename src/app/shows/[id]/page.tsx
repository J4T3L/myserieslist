"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import {
    useApp,
    Show,
    WatchlistItem,
    Episode,
    CastMember,
} from "@/context/AppContext";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ShowDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const showId = parseInt(resolvedParams.id);

    const {
        currentUser,
        handleAddToWatchlist,
        handleRemoveFromWatchlist,
        handleUpdatePersonalRating,
        handleToggleEpisode,
        handleSetEpisodesManual,
        handleSaveNotes,
        getWatchlistItem,
        showToast,
    } = useApp();

    const [show, setShow] = useState<Show | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [cast, setCast] = useState<CastMember[]>([]);
    const [recommendations, setRecommendations] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeTab, setActiveTab] = useState<"details" | "episodes" | "cast">("details");
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [personalNotes, setPersonalNotes] = useState("");
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    const watchlistItem = getWatchlistItem(showId);

    // --- SYNC NOTES STATE WHEN ITEM LOADS ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (watchlistItem) {
                setPersonalNotes(watchlistItem.notes || "");
            } else {
                setPersonalNotes("");
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [watchlistItem]);

    // --- FETCH DATA FOR SHOW ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                // Fetch Show Info
                const showRes = await fetch(`https://api.tvmaze.com/shows/${showId}`);
                if (!showRes.ok) throw new Error("Serial tidak ditemukan.");
                const showData: Show = await showRes.json();
                setShow(showData);

                // Fetch Episodes
                const epRes = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
                if (epRes.ok) {
                    const epData: Episode[] = await epRes.json();
                    setEpisodes(epData);

                    // Set season selector to first available season
                    if (epData.length > 0) {
                        setSelectedSeason(epData[0].season);
                    }

                    // If the item is in watchlist, update totalEpisodes count dynamically!
                    if (watchlistItem && watchlistItem.totalEpisodes !== epData.length) {
                        handleSetEpisodesManual(showId, watchlistItem.watchedEpisodeIds.length);
                        // This sync is handled gracefully.
                    }
                }

                // Fetch Cast
                const castRes = await fetch(`https://api.tvmaze.com/shows/${showId}/cast`);
                if (castRes.ok) {
                    const castData: CastMember[] = await castRes.json();
                    setCast(castData);
                }

                // Fetch Recommendations (similar shows)
                const allRes = await fetch("https://api.tvmaze.com/shows");
                if (allRes.ok) {
                    const allShows: Show[] = await allRes.json();
                    // Filter matching genres
                    const matches = allShows
                        .filter(
                            (s) =>
                                s.id !== showId &&
                                s.genres.some((g) => showData.genres.includes(g)) &&
                                s.image?.medium
                        )
                        .slice(0, 4);
                    setRecommendations(matches);
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Gagal memuat serial.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showId]);

    if (loading) {
        return (
            <div className="tab-content-enter" style={{ padding: "80px 20px", textAlign: "center" }}>
                <div className="shimmer" style={{ width: "80px", height: "80px", borderRadius: "50%", margin: "0 auto 20px auto" }}></div>
                <div className="shimmer" style={{ width: "200px", height: "24px", borderRadius: "4px", margin: "0 auto 10px auto" }}></div>
                <div className="shimmer" style={{ width: "300px", height: "14px", borderRadius: "4px", margin: "0 auto" }}></div>
            </div>
        );
    }

    if (error || !show) {
        return (
            <div className="tab-content-enter" style={{ padding: "80px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>⚠️</div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", marginBottom: "12px" }}>
                    Gagal Memuat Detail Serial
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{error || "Serial TV tidak ditemukan."}</p>
                <Link href="/" className="hero-btn" style={{ float: "none", margin: "0 auto", textDecoration: "none" }}>
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    // --- SEASONS CALCULATION ---
    const seasons = Array.from(new Set(episodes.map((ep) => ep.season))).sort((a, b) => a - b);
    const currentSeasonEpisodes = episodes.filter((ep) => ep.season === selectedSeason);

    // Bulk actions for current season
    const handleMarkSeason = (watched: boolean) => {
        if (!currentUser) return;
        const seasonEpIds = currentSeasonEpisodes.map((ep) => ep.id);
        let updatedWatchedList = watchlistItem ? [...watchlistItem.watchedEpisodeIds] : [];

        if (watched) {
            // Add all season eps
            seasonEpIds.forEach((id) => {
                if (!updatedWatchedList.includes(id)) updatedWatchedList.push(id);
            });
        } else {
            // Remove all season eps
            updatedWatchedList = updatedWatchedList.filter((id) => !seasonEpIds.includes(id));
        }

        // Call context to sync
        // Set manual watched count
        const totalEps = episodes.length;
        let newStatus: WatchlistItem["trackerStatus"] = watchlistItem ? watchlistItem.trackerStatus : "watching";
        if (totalEps > 0 && updatedWatchedList.length === totalEps) {
            newStatus = "completed";
        }

        // Since AppContext handles detailed lists via handleToggleEpisode on item,
        // we can custom edit watchlist item inside our component context updates
        const localUsers = localStorage.getItem("cinelist_users");
        if (localUsers && currentUser) {
            const usersData = JSON.parse(localUsers);
            const lowerUser = currentUser.toLowerCase();
            if (usersData[lowerUser]) {
                const userWatchlist = usersData[lowerUser].watchlist as WatchlistItem[];
                const idx = userWatchlist.findIndex((item) => item.show.id === showId);
                if (idx !== -1) {
                    userWatchlist[idx].watchedEpisodeIds = updatedWatchedList;
                    userWatchlist[idx].trackerStatus = newStatus;
                    userWatchlist[idx].updatedAt = new Date().toISOString();
                    userWatchlist[idx].totalEpisodes = totalEps; // Ensure set

                    // Save and trigger state reload in AppContext
                    localStorage.setItem("cinelist_users", JSON.stringify(usersData));
                    window.location.reload(); // Quick state refresh
                }
            }
        }
    };

    return (
        <div className="tab-content-enter">
            {/* GUEST WARNING BAR */}
            {!currentUser && (
                <div
                    style={{
                        background: "rgba(251, 191, 36, 0.1)",
                        border: "1px solid rgba(251, 191, 36, 0.2)",
                        borderRadius: "6px",
                        padding: "12px 16px",
                        marginBottom: "24px",
                        fontSize: "13px",
                        color: "#fbbf24",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span>Anda mengakses sebagai Tamu. Silakan masuk akun untuk melacak episode serial ini.</span>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: "#fbbf24",
                            color: "#000",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontWeight: "700",
                            cursor: "pointer",
                        }}
                    >
                        Login / Daftar
                    </button>
                </div>
            )}

            {/* BACK NAVIGATION */}
            <div style={{ marginBottom: "20px" }}>
                <Link
                    href="/"
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    ← Kembali ke Discover
                </Link>
            </div>

            {/* DETAIL PAGE ROOT GRID */}
            <div className="modal-body details-grid">
                {/* Left Column: Poster & Personal Tracking Panel */}
                <div className="details-sidebar">
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <img
                            src={show.image?.original || "/placeholder.jpg"}
                            alt={show.name}
                            style={{
                                width: "100%",
                                borderRadius: "8px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                                display: "block",
                            }}
                        />
                        <button
                            onClick={() => setIsTrailerOpen(true)}
                            style={{
                                background: "var(--accent-gradient)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                padding: "12px",
                                fontSize: "14px",
                                fontWeight: "800",
                                cursor: "pointer",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                boxShadow: "0 4px 15px rgba(255,30,39,0.3)",
                                transition: "var(--transition-premium)",
                            }}
                            className="btn-play-trailer"
                        >
                            <span style={{ fontSize: "12px" }}>▶</span> Play Trailer
                        </button>
                    </div>

                    {/* Tracking Panel */}
                    {currentUser && (
                        <div
                            style={{
                                background: "var(--surface-color)",
                                padding: "20px",
                                borderRadius: "8px",
                                border: "1px solid var(--surface-border)",
                            }}
                        >
                            <h3 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "14px", color: "var(--text-secondary)" }}>
                                Lacak Serial Ini
                            </h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                                        Status Tontonan
                                    </label>
                                    <select
                                        value={watchlistItem ? watchlistItem.trackerStatus : ""}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleAddToWatchlist(show, e.target.value as WatchlistItem["trackerStatus"]);
                                                showToast(`Status ${show.name} berhasil diubah.`);
                                            }
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            background: "#333",
                                            border: "none",
                                            borderRadius: "4px",
                                            color: "#fff",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <option value="">+ Tambah ke Daftar...</option>
                                        <option value="watching">🍿 Watching</option>
                                        <option value="completed">✓ Completed</option>
                                        <option value="onhold">⏸ On Hold</option>
                                        <option value="dropped">🛑 Dropped</option>
                                        <option value="plantowatch">⏱ Plan to Watch</option>
                                    </select>
                                </div>

                                {watchlistItem && (
                                    <>
                                        <div>
                                            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                                                Rating Personal Anda
                                            </label>
                                            <select
                                                value={watchlistItem.personalRating || ""}
                                                onChange={(e) =>
                                                    handleUpdatePersonalRating(showId, e.target.value ? parseInt(e.target.value) : null)
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "8px 12px",
                                                    background: "#333",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    color: "#fff",
                                                    fontSize: "13px",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <option value="">Pilih Rating...</option>
                                                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                                                    <option key={r} value={r}>
                                                        ★ {r} / 10
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                                                Progres Episode ({watchlistItem.watchedEpisodeIds.length} / {episodes.length} ditonton)
                                            </label>
                                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={episodes.length}
                                                    value={watchlistItem.watchedEpisodeIds.length}
                                                    onChange={(e) => handleSetEpisodesManual(showId, parseInt(e.target.value))}
                                                    style={{ flex: 1, accentColor: "var(--netflix-red)" }}
                                                />
                                                <span style={{ fontSize: "12px", fontWeight: "700" }}>
                                                    {watchlistItem.watchedEpisodeIds.length}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            className="btn-danger"
                                            onClick={() => handleRemoveFromWatchlist(showId, show.name)}
                                            style={{
                                                padding: "8px",
                                                fontSize: "12px",
                                                marginTop: "10px",
                                                width: "100%",
                                            }}
                                        >
                                            Hapus dari Watchlist
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Title, Quick Meta, Tabs Content */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h1 style={{ fontSize: "36px", fontWeight: "900", lineHeight: "1.2", marginBottom: "8px" }}>
                            {show.name}
                        </h1>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                            <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px", color: "#fff", fontWeight: "bold" }}>
                                ★ {show.rating.average || "N/A"}
                            </span>
                            <span>•</span>
                            <span>{show.genres.join(", ")}</span>
                            <span>•</span>
                            <span>{show.status}</span>
                            <span>•</span>
                            <span>{show.runtime ? `${show.runtime} Menit` : "N/A"}</span>
                            <span>•</span>
                            <span>Rilis: {show.premiered || "N/A"}</span>
                        </div>
                    </div>

                    {/* Tab buttons */}
                    <div
                        className="auth-switch-tabs"
                        style={{
                            display: "flex",
                            gap: "20px",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            marginBottom: "24px",
                        }}
                    >
                        {["details", "episodes", "cast"].map((tab) => (
                            <button
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: "10px 0",
                                    fontSize: "14px",
                                    fontWeight: "755",
                                    textTransform: "uppercase",
                                    color: activeTab === tab ? "#fff" : "var(--text-muted)",
                                    borderBottom: activeTab === tab ? "3px solid var(--netflix-red)" : "3px solid transparent",
                                    cursor: "pointer",
                                }}
                                onClick={() => setActiveTab(tab as "details" | "episodes" | "cast")}
                            >
                                {tab === "details" ? "Details & Review" : tab === "episodes" ? `Episodes (${episodes.length})` : "Cast"}
                            </button>
                        ))}
                    </div>

                    {/* TAB CONTENTS */}
                    <div style={{ flex: 1 }}>

                        {/* DETAILS TAB */}
                        {activeTab === "details" && (
                            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div>
                                    <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "10px" }}>Sinopsis</h3>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: show.summary || "<p>Tidak ada sinopsis.</p>" }}
                                        style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)" }}
                                    ></div>
                                </div>

                                {/* NETWORK / CHANNEL DETAILS */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", background: "var(--surface-color)", padding: "16px", borderRadius: "8px", border: "1px solid var(--surface-border)", fontSize: "13px" }}>
                                    <div>
                                        <span style={{ color: "var(--text-muted)" }}>Ditayangkan di:</span>
                                        <strong style={{ display: "block", color: "#fff", marginTop: "4px" }}>
                                            {show.network?.name || show.webChannel?.name || "N/A"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)" }}>Negara:</span>
                                        <strong style={{ display: "block", color: "#fff", marginTop: "4px" }}>
                                            {show.network?.country?.name || "N/A"}
                                        </strong>
                                    </div>
                                </div>

                                {/* PERSONAL REVIEW & NOTES */}
                                {currentUser && watchlistItem && (
                                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <h3 style={{ fontSize: "15px", fontWeight: "800", marginBottom: "10px" }}>Catatan & Review Anda</h3>
                                        <textarea
                                            value={personalNotes}
                                            onChange={(e) => setPersonalNotes(e.target.value)}
                                            placeholder="Tulis opini, catatan nonton, atau review pribadi Anda di sini..."
                                            style={{
                                                width: "100%",
                                                height: "100px",
                                                background: "#222",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: "#fff",
                                                padding: "10px",
                                                resize: "none",
                                                outline: "none",
                                                fontSize: "13px",
                                                lineHeight: "1.5",
                                                marginBottom: "12px",
                                            }}
                                        ></textarea>
                                        <button
                                            className="hero-btn"
                                            style={{ margin: 0, padding: "8px 16px", fontSize: "12px" }}
                                            onClick={() => handleSaveNotes(showId, personalNotes)}
                                        >
                                            Simpan Review
                                        </button>
                                    </div>
                                )}

                                {/* SIMILAR SHOW RECOMMENDATIONS */}
                                {recommendations.length > 0 && (
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px" }}>Rekomendasi Serial Serupa</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
                                            {recommendations.map((rec) => (
                                                <div
                                                    key={rec.id}
                                                    className="recommendation-card"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => (window.location.href = `/shows/${rec.id}`)}
                                                >
                                                    <img
                                                        src={rec.image?.medium || ""}
                                                        alt={rec.name}
                                                        style={{ width: "100%", borderRadius: "4px", aspectRatio: "2/3", objectFit: "cover" }}
                                                    />
                                                    <div style={{ fontWeight: "700", fontSize: "12px", marginTop: "6px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                        {rec.name}
                                                    </div>
                                                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                        ★ {rec.rating.average || "N/A"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* EPISODES TAB */}
                        {activeTab === "episodes" && (
                            <div className="tab-content-enter">
                                {/* Season selector & bulk actions */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Pilih Musim:</span>
                                        <select
                                            value={selectedSeason}
                                            onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                                            style={{
                                                padding: "6px 12px",
                                                background: "#333",
                                                border: "none",
                                                borderRadius: "4px",
                                                color: "#fff",
                                                fontSize: "13px",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {seasons.map((s) => (
                                                <option key={s} value={s}>
                                                    Season {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {currentUser && watchlistItem && (
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => handleMarkSeason(true)}
                                                style={{
                                                    padding: "6px 12px",
                                                    fontSize: "11px",
                                                    background: "rgba(255,255,255,0.05)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "4px",
                                                    color: "#fff",
                                                    fontWeight: "700",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ✓ Tonton Semua Season {selectedSeason}
                                            </button>
                                            <button
                                                onClick={() => handleMarkSeason(false)}
                                                style={{
                                                    padding: "6px 12px",
                                                    fontSize: "11px",
                                                    background: "rgba(239, 68, 68, 0.1)",
                                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                                    borderRadius: "4px",
                                                    color: "#f87171",
                                                    fontWeight: "700",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ✕ Hapus Progres Season {selectedSeason}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Episode List */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "500px", overflowY: "auto", paddingRight: "6px" }}>
                                    {currentSeasonEpisodes.map((ep) => {
                                        const isWatched = watchlistItem?.watchedEpisodeIds.includes(ep.id) || false;
                                        return (
                                            <div
                                                key={ep.id}
                                                style={{
                                                    display: "flex",
                                                    gap: "14px",
                                                    background: isWatched ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                                                    border: isWatched ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
                                                    padding: "12px 16px",
                                                    borderRadius: "6px",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                {currentUser && watchlistItem && (
                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isWatched}
                                                            onChange={() => handleToggleEpisode(showId, ep.id)}
                                                            style={{
                                                                width: "16px",
                                                                height: "16px",
                                                                cursor: "pointer",
                                                                accentColor: "var(--netflix-red)",
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                                                        <strong style={{ fontSize: "14px", color: isWatched ? "var(--text-muted)" : "#fff" }}>
                                                            Ep {ep.number}: {ep.name}
                                                        </strong>
                                                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                                            {ep.airdate ? new Date(ep.airdate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""}
                                                        </span>
                                                    </div>
                                                    {ep.summary && (
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: ep.summary }}
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "var(--text-secondary)",
                                                                marginTop: "6px",
                                                                lineHeight: "1.4",
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: "vertical",
                                                                overflow: "hidden",
                                                            }}
                                                        ></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CAST TAB */}
                        {activeTab === "cast" && (
                            <div className="tab-content-enter">
                                {cast.length === 0 ? (
                                    <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>
                                        Informasi pemeran tidak tersedia.
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px", maxHeight: "500px", overflowY: "auto", paddingRight: "6px" }}>
                                        {cast.map((item) => (
                                            <div
                                                key={`${item.person.id}-${item.character.id}`}
                                                style={{
                                                    background: "var(--surface-color)",
                                                    padding: "10px",
                                                    borderRadius: "6px",
                                                    border: "1px solid var(--surface-border)",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <img
                                                    src={item.person.image?.medium || "/placeholder.jpg"}
                                                    alt={item.person.name}
                                                    style={{
                                                        width: "70px",
                                                        height: "70px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        margin: "0 auto 8px auto",
                                                        display: "block",
                                                    }}
                                                />
                                                <div style={{ fontWeight: "700", fontSize: "12px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={item.person.name}>
                                                    {item.person.name}
                                                </div>
                                                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={item.character.name}>
                                                    sebagai {item.character.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cinematic Trailer Simulator Modal */}
            {isTrailerOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setIsTrailerOpen(false)}
                >
                    <div
                        className="modal-container"
                        style={{
                            maxWidth: "800px",
                            background: "#08080a",
                            border: "1px solid rgba(255, 30, 39, 0.3)",
                            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 30, 39, 0.15)",
                            borderRadius: "16px",
                            padding: 0,
                            overflow: "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#fff", margin: 0 }}>
                                Official Trailer - {show.name}
                            </h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => setIsTrailerOpen(false)}
                                style={{ position: "static" }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Simulator Player Viewport */}
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "16/9",
                                position: "relative",
                                background: "#000",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            {/* Ambient Video Simulation Backdrops */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundImage: `url(${show.image?.original || ""})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    filter: "brightness(0.35) blur(10px)",
                                    opacity: 0.9,
                                }}
                            />
                            
                            {/* Fake Player Overlay Controls */}
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    textAlign: "center",
                                    color: "#fff",
                                    padding: "20px",
                                }}
                            >
                                <div style={{ fontSize: "48px", marginBottom: "12px", color: "var(--netflix-red)", filter: "drop-shadow(0 0 10px rgba(255,30,39,0.5))" }}>
                                    🎬
                                </div>
                                <h4 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "8px" }}>
                                    Memutar Trailer...
                                </h4>
                                <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto 20px auto" }}>
                                    Simulasi Cinematic Trailer Player untuk {show.name}. Melacak waktu tayang dari API TVMaze secara aman.
                                </p>
                            </div>
                            
                            {/* Premium Video Player Control Bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0, left: 0, right: 0,
                                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)",
                                    padding: "20px",
                                    zIndex: 10,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                {/* Progress Slider bar */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>01:24</span>
                                    <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", position: "relative", cursor: "pointer" }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "45%", background: "var(--netflix-red)", borderRadius: "2px" }} />
                                        <div style={{ position: "absolute", top: "-4px", left: "45%", width: "12px", height: "12px", borderRadius: "50%", background: "#fff", boxShadow: "0 0 6px rgba(0,0,0,0.5)" }} />
                                    </div>
                                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>03:02</span>
                                </div>
                                
                                {/* Bottom Action buttons */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <button style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }}>
                                            ⏸
                                        </button>
                                        
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "14px" }}>🔊</span>
                                            <div style={{ width: "60px", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", position: "relative" }}>
                                                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "80%", background: "#fff" }} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>
                                        <span style={{ border: "1px solid rgba(255,255,255,0.3)", padding: "2px 6px", borderRadius: "4px", color: "#fff" }}>
                                            1080p HD
                                        </span>
                                        <span style={{ cursor: "pointer" }} title="Fullscreen">
                                            [⛶]
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

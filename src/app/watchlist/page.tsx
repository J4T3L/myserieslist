"use client";

import { useState } from "react";
import { useApp, WatchlistItem } from "@/context/AppContext";
import WatchlistCard from "@/components/WatchlistCard";

export default function WatchlistPage() {
    const {
        currentUser,
        watchlist,
        setIsAuthModalOpen,
        setAuthTab,
        handleRemoveFromWatchlist,
        handleUpdatePersonalRating,
        handleAddToWatchlist,
        handleIncrementEpisodeCount,
        handleSetEpisodesManual,
    } = useApp();

    const [watchlistTab, setWatchlistTab] = useState<string>("all");
    const [watchlistSearch, setWatchlistSearch] = useState("");
    const [watchlistSort, setWatchlistSort] = useState("updated-desc");
    const [isGridView, setIsGridView] = useState(true);

    if (!currentUser) {
        return (
            <div className="tab-content-enter" style={{ padding: "80px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "20px" }}>🍿</div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px" }}>
                    Daftar Tontonan Anda Kosong
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
                    Silakan masuk atau daftarkan akun baru Anda untuk mulai melacak progres nonton episode dan memberikan rating serial TV favorit.
                </p>
                <button
                    className="hero-btn"
                    style={{ float: "none", margin: "0 auto", background: "var(--netflix-red)", border: "none" }}
                    onClick={() => {
                        setAuthTab("login");
                        setIsAuthModalOpen(true);
                    }}
                >
                    Masuk ke Akun Sekarang
                </button>
            </div>
        );
    }

    // --- FILTER & SORT WATCHLIST ---
    const getFilteredWatchlist = () => {
        let list = [...watchlist];

        // Status Filter
        if (watchlistTab !== "all") {
            list = list.filter((item) => item.trackerStatus === watchlistTab);
        }

        // Search filter
        if (watchlistSearch.trim()) {
            const q = watchlistSearch.toLowerCase();
            list = list.filter(
                (item) =>
                    item.show.name.toLowerCase().includes(q) ||
                    item.show.genres.some((g) => g.toLowerCase().includes(q))
            );
        }

        // Apply Sorting
        return list.sort((a, b) => {
            if (watchlistSort === "updated-desc") {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            if (watchlistSort === "added-desc") {
                return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            }
            if (watchlistSort === "name-asc") {
                return a.show.name.localeCompare(b.show.name);
            }
            if (watchlistSort === "score-desc") {
                return (b.personalRating || 0) - (a.personalRating || 0);
            }
            if (watchlistSort === "progress-desc") {
                const progA = a.totalEpisodes > 0 ? a.watchedEpisodeIds.length / a.totalEpisodes : 0;
                const progB = b.totalEpisodes > 0 ? b.watchedEpisodeIds.length / b.totalEpisodes : 0;
                return progB - progA;
            }
            return 0;
        });
    };

    const filteredItems = getFilteredWatchlist();

    // --- FILTER & SORT WATCHLIST ---

    return (
        <div className="tab-content-enter">
            {/* FILTER BUTTONS & STATE SWITCH */}
            <div
                className="controls-bar"
                style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["all", "watching", "completed", "onhold", "dropped", "plantowatch"].map((st) => (
                        <button
                            key={st}
                            className={`genre-tag ${watchlistTab === st ? "active" : ""}`}
                            style={{
                                fontSize: "12px",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                textTransform: "capitalize",
                            }}
                            onClick={() => setWatchlistTab(st)}
                        >
                            {st === "plantowatch" ? "Plan to Watch" : st}
                        </button>
                    ))}
                </div>

                {/* Layout view toggle */}
                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        className={`btn-icon ${isGridView ? "active" : ""}`}
                        style={{
                            padding: "8px",
                            background: isGridView ? "rgba(255,255,255,0.15)" : "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                        onClick={() => setIsGridView(true)}
                        title="Grid View"
                    >
                        田
                    </button>
                    <button
                        className={`btn-icon ${!isGridView ? "active" : ""}`}
                        style={{
                            padding: "8px",
                            background: !isGridView ? "rgba(255,255,255,0.15)" : "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                        onClick={() => setIsGridView(false)}
                        title="Table View (List)"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {/* SEARCH AND SORT BAR */}
            <div
                className="controls-bar"
                style={{
                    background: "var(--surface-color)",
                    padding: "16px",
                    borderRadius: "8px",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "24px",
                }}
            >
                <div className="search-box" style={{ maxWidth: "320px", flex: 1, height: "40px" }}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Cari di watchlist Anda..."
                        value={watchlistSearch}
                        onChange={(e) => setWatchlistSearch(e.target.value)}
                        style={{ paddingLeft: "32px" }}
                    />
                </div>

                <div className="sort-select-wrapper" style={{ height: "40px" }}>
                    <select value={watchlistSort} onChange={(e) => setWatchlistSort(e.target.value)}>
                        <option value="updated-desc">Terakhir Diperbarui</option>
                        <option value="added-desc">Baru Ditambahkan</option>
                        <option value="name-asc">Nama (A-Z)</option>
                        <option value="score-desc">Rating Personal Tertinggi</option>
                        <option value="progress-desc">Progres Tertinggi</option>
                    </select>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div
                    style={{
                        padding: "80px 20px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "12px",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                        border: "1px dashed rgba(255,255,255,0.05)",
                    }}
                >
                    {watchlistSearch ? "Hasil pencarian tidak ditemukan." : "Tidak ada serial TV di kategori ini."}
                </div>
            ) : isGridView ? (
                /* GRID VIEW */
                <div className="shows-grid">
                    {filteredItems.map((item) => (
                        <WatchlistCard key={item.show.id} item={item} />
                    ))}
                </div>
            ) : (
                /* MAL TABLE VIEW */
                <div className="table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="mal-table">
                        <thead>
                            <tr>
                                <th style={{ width: "40px", textAlign: "center" }}>#</th>
                                <th style={{ width: "60px" }}>Poster</th>
                                <th>Show Title</th>
                                <th style={{ width: "120px", textAlign: "center" }}>Status</th>
                                <th style={{ width: "135px", textAlign: "center" }}>Progress</th>
                                <th style={{ width: "120px", textAlign: "center" }}>My Rating</th>
                                <th style={{ width: "140px", textAlign: "center" }}>Last Updated</th>
                                <th style={{ width: "60px", textAlign: "center" }}>Edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, idx) => (
                                <tr key={item.show.id}>
                                    <td style={{ textAlign: "center", fontWeight: "700", color: "var(--text-muted)" }}>
                                        {idx + 1}
                                    </td>
                                    <td>
                                        <img
                                            src={item.show.image?.medium || ""}
                                            alt={item.show.name}
                                            style={{
                                                width: "42px",
                                                height: "58px",
                                                objectFit: "cover",
                                                borderRadius: "2px",
                                                display: "block",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => (window.location.href = `/shows/${item.show.id}`)}
                                        />
                                    </td>
                                    <td>
                                        <div
                                            style={{ fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
                                            onClick={() => (window.location.href = `/shows/${item.show.id}`)}
                                        >
                                            {item.show.name}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                            {item.show.genres.join(", ")}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <select
                                            value={item.trackerStatus}
                                            onChange={(e) => handleAddToWatchlist(item.show, e.target.value as WatchlistItem["trackerStatus"])}
                                            style={{
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "4px",
                                                color: "#fff",
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                width: "110px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <option value="watching">🍿 Watching</option>
                                            <option value="completed">✓ Completed</option>
                                            <option value="onhold">⏸ On Hold</option>
                                            <option value="dropped">🛑 Dropped</option>
                                            <option value="plantowatch">⏱ Plan to Watch</option>
                                        </select>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.totalEpisodes > 0 ? item.totalEpisodes : undefined}
                                                value={item.watchedEpisodeIds.length}
                                                onChange={(e) => handleSetEpisodesManual(item.show.id, parseInt(e.target.value) || 0)}
                                                style={{
                                                    width: "48px",
                                                    textAlign: "center",
                                                    padding: "2px 4px",
                                                    background: "#333",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    color: "#fff",
                                                    fontSize: "12px",
                                                }}
                                            />
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                / {item.totalEpisodes > 0 ? item.totalEpisodes : "?"}
                                            </span>
                                            {item.trackerStatus !== "completed" && (
                                                <button
                                                    onClick={(e) => handleIncrementEpisodeCount(item.show.id, e)}
                                                    style={{
                                                        padding: "2px 6px",
                                                        background: "var(--netflix-red)",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        color: "#fff",
                                                        fontWeight: "bold",
                                                        fontSize: "10px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    +1
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <select
                                            value={item.personalRating || ""}
                                            onChange={(e) =>
                                                handleUpdatePersonalRating(
                                                    item.show.id,
                                                    e.target.value ? parseInt(e.target.value) : null
                                                )
                                            }
                                            style={{
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "4px",
                                                color: "#fff",
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <option value="">Rate...</option>
                                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                                                <option key={r} value={r}>
                                                    ★ {r}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ textAlign: "center", fontSize: "11px", color: "var(--text-secondary)" }}>
                                        {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            className="table-action-btn"
                                            onClick={() => handleRemoveFromWatchlist(item.show.id, item.show.name)}
                                            title="Hapus dari daftar"
                                            style={{
                                                background: "rgba(239, 68, 68, 0.15)",
                                                color: "#f87171",
                                                border: "none",
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

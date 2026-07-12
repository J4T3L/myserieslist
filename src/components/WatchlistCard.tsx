"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp, WatchlistItem } from "../context/AppContext";

interface WatchlistCardProps {
    item: WatchlistItem;
}

export default function WatchlistCard({ item }: WatchlistCardProps) {
    const { handleIncrementEpisodeCount } = useApp();
    const router = useRouter();
    const { show, trackerStatus, personalRating, watchedEpisodeIds, totalEpisodes } = item;

    const handleCardClick = () => {
        router.push(`/shows/${show.id}`);
    };

    const getStatusLabelText = (status: string) => {
        if (status === "plantowatch") return "Plan";
        if (status === "onhold") return "On Hold";
        return status.toUpperCase();
    };

    return (
        <div className="show-card" onClick={handleCardClick}>
            <div className="card-poster-wrapper">
                <img
                    className="card-poster"
                    src={show.image?.medium || "/placeholder.jpg"}
                    alt={show.name}
                    loading="lazy"
                />
                <div className="card-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="card-rating-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {show.rating.average || "N/A"}
                    </div>
                    <div className="card-quick-actions">
                        <div className={`card-watchlist-indicator indicator-${trackerStatus}`}>
                            {getStatusLabelText(trackerStatus)}
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title">{show.name}</h3>

                {/* Progress tracking */}
                <div className="card-progress-text" onClick={(e) => e.stopPropagation()}>
                    <span>
                        Ep: <strong>{watchedEpisodeIds.length}</strong> / {totalEpisodes > 0 ? totalEpisodes : "?"}
                    </span>
                    {trackerStatus !== "completed" && (
                        <button
                            className="btn-small-plus"
                            title="Tonton 1 Episode Lagi"
                            onClick={(e) => handleIncrementEpisodeCount(show.id, e)}
                        >
                            +1
                        </button>
                    )}
                </div>
                {totalEpisodes > 0 && (
                    <div className="card-progress-bar-container">
                        <div
                            className="card-progress-bar"
                            style={{ width: `${(watchedEpisodeIds.length / totalEpisodes) * 100}%` }}
                        ></div>
                    </div>
                )}

                <div className="card-meta">
                    <span>{show.premiered ? show.premiered.split("-")[0] : "N/A"}</span>
                    {personalRating && (
                        <span style={{ color: "var(--gold-color)", fontWeight: "700" }}>
                            ★ {personalRating}/10
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

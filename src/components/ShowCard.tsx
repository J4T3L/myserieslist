"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp, Show } from "../context/AppContext";

interface ShowCardProps {
    show: Show;
    style?: React.CSSProperties;
}

export default function ShowCard({ show, style }: ShowCardProps) {
    const { getTrackingStatus, handleAddToWatchlist } = useApp();
    const router = useRouter();

    const trackStatus = getTrackingStatus(show.id);

    const handleCardClick = () => {
        router.push(`/shows/${show.id}`);
    };

    const getStatusLabelText = (status: string) => {
        if (status === "plantowatch") return "Plan";
        return status.toUpperCase();
    };

    return (
        <div
            className={`show-card ${trackStatus ? `card-status-${trackStatus}` : ""}`}
            onClick={handleCardClick}
            style={{ minWidth: "160px", flexShrink: 0, ...style }}
        >
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
                        {trackStatus ? (
                            <div className={`card-watchlist-indicator indicator-${trackStatus}`} style={{ fontSize: "9px" }}>
                                {getStatusLabelText(trackStatus)}
                            </div>
                        ) : (
                            <button
                                className="card-add-btn"
                                title="Add to Watchlist"
                                onClick={() => handleAddToWatchlist(show, "plantowatch")}
                            >
                                +
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title" style={{ fontSize: "14px", height: "36px" }}>
                    {show.name}
                </h3>
                <div className="card-meta">
                    <span>{show.premiered ? show.premiered.split("-")[0] : "N/A"}</span>
                    <span style={{ fontSize: "10px" }}>
                        {show.network?.name || show.webChannel?.name || "N/A"}
                    </span>
                </div>
            </div>
        </div>
    );
}

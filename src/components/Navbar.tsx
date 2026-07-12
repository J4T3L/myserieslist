"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";

export default function Navbar() {
    const {
        currentUser,
        currentUserImage,
        currentRole,
        watchlist,
        searchQuery,
        setSearchQuery,
        handleLogout,
        setIsAuthModalOpen,
        setAuthTab,
        setSettingsOpen,
    } = useApp();

    const pathname = usePathname();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    
    // Autocomplete & Mobile states
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- SCROLL EFFECT NAVBAR ---
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // --- DEBOUNCED SEARCH SUGGESTIONS ---
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            setLoadingSuggestions(false);
            return;
        }

        setLoadingSuggestions(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.slice(0, 5).map((item: any) => ({
                        id: item.show.id,
                        name: item.show.name,
                        rating: item.show.rating?.average || null,
                        genres: item.show.genres || [],
                        image: item.show.image?.medium || "",
                    }));
                    setSuggestions(formatted);
                }
            } catch (err) {
                console.error("Gagal memuat saran pencarian:", err);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".search-box-container")) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        setShowDropdown(true);
        if (pathname !== "/" && val.trim() !== "") {
            router.push("/");
        }
    };

    return (
        <header className={`header ${isScrolled ? "scrolled" : ""}`}>
            <Link href="/" className="logo">
                My<span>CineList</span>
            </Link>

            <div className="nav-controls">
                {/* Tabs / Links */}
                <div className={`tabs ${mobileMenuOpen ? "mobile-open" : ""}`}>
                    <Link
                        href="/"
                        className={`tab-btn ${pathname === "/" ? "active" : ""}`}
                        onClick={() => {
                            setSearchQuery("");
                            setMobileMenuOpen(false);
                        }}
                    >
                        Discover
                    </Link>
                    <Link
                        href="/watchlist"
                        className={`tab-btn ${pathname === "/watchlist" ? "active" : ""}`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        My List ({watchlist.length})
                    </Link>
                    <Link
                        href="/stats"
                        className={`tab-btn ${pathname === "/stats" ? "active" : ""}`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Dashboard
                    </Link>
                    {currentUser && currentRole === "admin" && (
                        <Link
                            href="/admin"
                            className={`tab-btn ${pathname === "/admin" ? "active" : ""}`}
                            style={{
                                color: pathname === "/admin" ? "var(--netflix-red)" : "rgba(229, 9, 20, 0.7)",
                                fontWeight: "800",
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Admin Dashboard
                        </Link>
                    )}
                    {currentUser && currentRole === "supersu" && (
                        <Link
                            href="/supersu"
                            className={`tab-btn ${pathname === "/supersu" ? "active" : ""}`}
                            style={{
                                color: pathname === "/supersu" ? "#9333ea" : "rgba(147, 51, 234, 0.7)",
                                fontWeight: "800",
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            SuperSU Dashboard
                        </Link>
                    )}
                </div>

                {/* Search Box with Autocomplete Dropdown */}
                <div className="search-box-container" style={{ position: "relative" }}>
                    <div className="search-box">
                        <span className="search-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Cari serial TV..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => setShowDropdown(true)}
                        />
                    </div>
                    
                    {/* Autocomplete suggestions dropdown */}
                    {showDropdown && searchQuery.trim() !== "" && (
                        <div className="search-suggestions-dropdown">
                            {loadingSuggestions ? (
                                <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                                    Mencari...
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                                    Tidak ada hasil.
                                </div>
                            ) : (
                                <>
                                    {suggestions.map((item) => (
                                        <div
                                            key={item.id}
                                            className="suggestion-item"
                                            onClick={() => {
                                                setShowDropdown(false);
                                                setSearchQuery("");
                                                router.push(`/shows/${item.id}`);
                                            }}
                                        >
                                            <img
                                                src={item.image || "/placeholder.jpg"}
                                                alt={item.name}
                                                className="suggestion-poster"
                                            />
                                            <div className="suggestion-info">
                                                <div className="suggestion-name">{item.name}</div>
                                                <div className="suggestion-meta">
                                                    {item.rating ? `★ ${item.rating}` : "★ N/A"} • {item.genres.slice(0, 2).join(", ")}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div
                                        className="suggestion-footer"
                                        onClick={() => {
                                            setShowDropdown(false);
                                            if (pathname !== "/") router.push("/");
                                        }}
                                    >
                                        Lihat semua hasil untuk "{searchQuery}"
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* User Account Widget */}
                {currentUser ? (
                    <div className="user-widget" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <Link href="/profile" style={{ textDecoration: "none" }}>
                            {currentUserImage ? (
                                <img
                                    src={currentUserImage}
                                    alt={currentUser}
                                    title={`Buka Profil ${currentUser} (${currentRole})`}
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: currentRole === "admin" || currentRole === "supersu" ? "2px solid var(--netflix-red)" : "2px solid transparent",
                                        cursor: "pointer",
                                    }}
                                />
                            ) : (
                                <div
                                    className="user-avatar-mini"
                                    title={`Buka Profil ${currentUser} (${currentRole})`}
                                    style={{
                                        border: currentRole === "admin" || currentRole === "supersu" ? "2px solid var(--netflix-red)" : "none",
                                        background: currentRole === "admin" ? "var(--netflix-red)" : "rgba(255,255,255,0.1)",
                                        color: "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    {currentUser.slice(0, 2).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <button 
                            className="btn-logout" 
                            onClick={handleLogout}
                            title="Keluar"
                            style={{
                                background: "rgba(255,255,255,0.1)",
                                border: "none",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "#fff",
                                transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "var(--netflix-red)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        className="hero-btn"
                        onClick={() => {
                            setAuthTab("login");
                            setIsAuthModalOpen(true);
                        }}
                        style={{
                            marginTop: 0,
                            padding: "8px 16px",
                            background: "var(--netflix-red)",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: "700",
                            borderRadius: "4px",
                        }}
                    >
                        Sign In
                    </button>
                )}

                {/* Backup & Settings button */}
                {currentUser && (
                    <button
                        className="settings-btn"
                        onClick={() => setSettingsOpen(true)}
                        title="Data Backup & Settings"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1-1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </button>
                )}

                {/* Mobile hamburger menu toggle */}
                <button
                    className="mobile-toggle-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        padding: "6px",
                        display: "none",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {mobileMenuOpen ? (
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                        ) : (
                            <>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </>
                        )}
                    </svg>
                </button>
            </div>
        </header>
    );
}

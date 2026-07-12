"use client";

import { useState, useEffect } from "react";
import { useApp, Show } from "@/context/AppContext";
import ShowCard from "@/components/ShowCard";

export default function Home() {
  const {
    currentUser,
    searchQuery,
    getWatchlistItem,
    handleAddToWatchlist,
    showToast,
    watchlist,
    setIsAuthModalOpen,
    setAuthTab
  } = useApp();

  const [discoverShows, setDiscoverShows] = useState<Show[]>([]);
  const [searchResults, setSearchResults] = useState<Show[]>([]);
  const [featuredShows, setFeaturedShows] = useState<Show[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [sidebarRankings, setSidebarRankings] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [randomShow, setRandomShow] = useState<Show | null>(null);

  // Filters & Sorting States
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [discoverSort, setDiscoverSort] = useState("rating-desc");

  const GENRES = [
    "All", "Action", "Adventure", "Comedy", "Crime", "Drama",
    "Fantasy", "Horror", "Mystery", "Romance", "Science-Fiction", "Thriller"
  ];

  const GENRE_EMOJIS: { [key: string]: string } = {
    "All": "🍿 All",
    "Action": "💥 Action",
    "Adventure": "🧭 Adventure",
    "Comedy": "😂 Comedy",
    "Crime": "🕵️‍♂️ Crime",
    "Drama": "🎭 Drama",
    "Fantasy": "🧙‍♂️ Fantasy",
    "Horror": "👻 Horror",
    "Mystery": "🔍 Mystery",
    "Romance": "💖 Romance",
    "Science-Fiction": "🚀 Sci-Fi",
    "Thriller": "⚡ Thriller"
  };

  // --- FETCH DISCOVER SHOWS & RANKINGS ---
  useEffect(() => {
    const fetchDiscover = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://api.tvmaze.com/shows");
        if (!res.ok) throw new Error("Gagal mengambil data dari server.");
        const data: Show[] = await res.json();

        // Filter out shows without images
        const filtered = data.filter((show) => show.image?.medium);
        setDiscoverShows(filtered);

        // Top 5 Ranking for Sidebar
        const topRated = [...filtered]
          .sort((a, b) => (b.rating.average || 0) - (a.rating.average || 0))
          .slice(0, 5);
        setSidebarRankings(topRated);

        // Featured Shows (top 5 rated)
        if (topRated.length > 0) {
          setFeaturedShows(topRated);
        }

        // Surprise Me random show initial selection
        if (filtered.length > 0) {
          const randomIndex = Math.floor(Math.random() * filtered.length);
          setRandomShow(filtered[randomIndex]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        showToast("Gagal memuat data serial.", "warning");
      } finally {
        setLoading(false);
      }
    };
    fetchDiscover();
  }, [showToast]);

  // --- AUTO SLIDE INTERVAL FOR HERO CAROUSEL ---
  useEffect(() => {
    if (featuredShows.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredShows.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredShows.length]);

  // --- LIVE SEARCH LOGIC ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Pencarian gagal.");
        const data: { show: Show }[] = await res.json();

        const filtered = data
          .map((item) => item.show)
          .filter((show) => show.image?.medium);

        setSearchResults(filtered);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handlePickRandomShow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (discoverShows.length > 0) {
      const randomIndex = Math.floor(Math.random() * discoverShows.length);
      setRandomShow(discoverShows[randomIndex]);
    }
  };

  const stripHtml = (htmlString: string) => {
    if (!htmlString) return "Deskripsi tidak tersedia.";
    return htmlString.replace(/<[^>]*>/g, "");
  };

  const getFilteredDiscoverShows = () => {
    const list = searchQuery ? searchResults : discoverShows;

    // Genre Filter
    let filtered = list;
    if (selectedGenre !== "All") {
      filtered = list.filter((show) => show.genres.includes(selectedGenre));
    }

    // Sort Discover Shows
    return [...filtered].sort((a, b) => {
      const ratingA = a.rating.average || 0;
      const ratingB = b.rating.average || 0;
      const dateA = a.premiered ? new Date(a.premiered).getTime() : 0;
      const dateB = b.premiered ? new Date(b.premiered).getTime() : 0;

      if (discoverSort === "rating-desc") return ratingB - ratingA;
      if (discoverSort === "rating-asc") return ratingA - ratingB;
      if (discoverSort === "name-asc") return a.name.localeCompare(b.name);
      if (discoverSort === "premiered-desc") return dateB - dateA;
      if (discoverSort === "premiered-asc") return dateA - dateB;
      return 0;
    });
  };

  const renderShimmerRow = () => {
    return (
      <div className="row-scroll" style={{ overflow: "hidden" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="show-card" style={{ minWidth: "160px", flexShrink: 0 }}>
            <div className="card-poster-wrapper shimmer" style={{ aspectRatio: "2/3" }}></div>
            <div className="card-info">
              <div className="shimmer" style={{ height: "14px", borderRadius: "4px", width: "80%", marginBottom: "6px" }}></div>
              <div className="shimmer" style={{ height: "10px", borderRadius: "4px", width: "50%" }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderShimmerGrid = () => {
    return (
      <div className="shows-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="show-card">
            <div className="card-poster-wrapper shimmer" style={{ aspectRatio: "2/3" }}></div>
            <div className="card-info">
              <div className="shimmer" style={{ height: "14px", borderRadius: "4px", width: "80%", marginBottom: "6px" }}></div>
              <div className="shimmer" style={{ height: "10px", borderRadius: "4px", width: "50%" }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tab-content-enter">
      {/* ERROR MESSAGE */}
      {error && <div style={{ color: "#ef4444", marginBottom: "20px", textAlign: "center", fontWeight: "600" }}>{error}</div>}

      {/* HERO BANNER SECTION */}
      {!searchQuery && featuredShows.length > 0 && (
        <div className="hero-section">
          {featuredShows.map((show, index) => (
            <div
              key={show.id}
              className={`hero-slide ${index === currentFeaturedIndex ? "active" : ""}`}
              style={{ backgroundImage: `url(${show.image?.original || ""})` }}
            >
              <div className="hero-overlay"></div>
              <div className="hero-content">
                <span className="hero-tag">Top Ranked Series</span>
                <h1 className="hero-title">{show.name}</h1>
                <div className="hero-meta">
                  <span className="hero-rating">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "2px" }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    {show.rating.average || "N/A"}
                  </span>
                  <span>|</span>
                  <span>{show.genres.join(", ")}</span>
                  <span>|</span>
                  <span>{show.premiered ? show.premiered.split("-")[0] : ""}</span>
                </div>
                <div className="hero-summary">{stripHtml(show.summary || "")}</div>
                <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
                  <a href={`/shows/${show.id}`} className="hero-btn" style={{ marginTop: 0 }}>
                    View Details
                  </a>
                  {currentUser && (() => {
                    const watchlistItem = getWatchlistItem(show.id);
                    return watchlistItem ? (
                      <span
                        className={`card-watchlist-indicator indicator-${watchlistItem.trackerStatus}`}
                        style={{
                          padding: "12px 20px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "750",
                          alignSelf: "stretch",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255, 255, 255, 0.02)"
                        }}
                      >
                        {watchlistItem.trackerStatus === "plantowatch" ? "PLAN TO WATCH" : watchlistItem.trackerStatus.toUpperCase()}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          handleAddToWatchlist(show, "plantowatch");
                          showToast(`Berhasil menambahkan ${show.name} ke Plan to Watch.`);
                        }}
                        className="hero-btn"
                        style={{
                          marginTop: 0,
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#fff",
                        }}
                      >
                        + Add to List
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}

          {/* Dots Navigation */}
          {featuredShows.length > 1 && (
            <div className="hero-dots">
              {featuredShows.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-dot ${idx === currentFeaturedIndex ? "active" : ""}`}
                  onClick={() => setCurrentFeaturedIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* GENRE EXPLORATION BAR */}
      <div className="genre-container">
        <div className="genre-scroll">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`genre-tag ${selectedGenre === g ? "active" : ""}`}
              onClick={() => setSelectedGenre(g)}
            >
              {GENRE_EMOJIS[g] || g}
            </button>
          ))}
        </div>
      </div>

      {/* SPLIT LAYOUT: MAIN GRID VS TOP RANKINGS SIDEBAR */}
      <div className="discover-layout">
        {/* Left Column: Grid */}
        <div style={{ overflow: "hidden" }}>
          {searchQuery || selectedGenre !== "All" ? (
            /* GRID VIEW (For search or genre filtering) */
            <>
              <div className="controls-bar" style={{ flexWrap: "wrap", gap: "10px" }}>
                <h2 className="section-title">
                  {searchQuery ? `Hasil Pencarian untuk "${searchQuery}"` : `${selectedGenre} Series`}
                </h2>

                <div className="sort-select-wrapper">
                  <select value={discoverSort} onChange={(e) => setDiscoverSort(e.target.value)}>
                    <option value="rating-desc">Rating: High to Low</option>
                    <option value="rating-asc">Rating: Low to High</option>
                    <option value="name-asc">Name: A-Z</option>
                    <option value="premiered-desc">Premiered: Newest</option>
                    <option value="premiered-asc">Premiered: Oldest</option>
                  </select>
                </div>
              </div>

              {loading ? (
                renderShimmerGrid()
              ) : getFilteredDiscoverShows().length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                  Tidak ada serial TV ditemukan.
                </div>
              ) : (
                <div className="shows-grid">
                  {getFilteredDiscoverShows().map((show) => (
                    <ShowCard key={show.id} show={show} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* NETFLIX ROW SCROLLERS (Default Browse) */
            <>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="netflix-row"><h3 className="row-title">Loading trending...</h3>{renderShimmerRow()}</div>
                  <div className="netflix-row"><h3 className="row-title">Loading genres...</h3>{renderShimmerRow()}</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Row 1: Trending Now */}
                  <div className="netflix-row">
                    <h3 className="row-title">Trending Now</h3>
                    <div className="row-scroll">
                      {discoverShows.slice(0, 15).map((show) => (
                        <ShowCard key={show.id} show={show} />
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Action & Adventure */}
                  {discoverShows.filter((s) => s.genres.includes("Action") || s.genres.includes("Adventure")).length > 0 && (
                    <div className="netflix-row">
                      <h3 className="row-title">Action & Adventure</h3>
                      <div className="row-scroll">
                        {discoverShows
                          .filter((s) => s.genres.includes("Action") || s.genres.includes("Adventure"))
                          .slice(0, 15)
                          .map((show) => (
                            <ShowCard key={show.id} show={show} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Row 3: Comedy Classics */}
                  {discoverShows.filter((s) => s.genres.includes("Comedy")).length > 0 && (
                    <div className="netflix-row">
                      <h3 className="row-title">Comedy Classics</h3>
                      <div className="row-scroll">
                        {discoverShows
                          .filter((s) => s.genres.includes("Comedy"))
                          .slice(0, 15)
                          .map((show) => (
                            <ShowCard key={show.id} show={show} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Sci-Fi & Fantasy */}
                  {discoverShows.filter((s) => s.genres.includes("Science-Fiction") || s.genres.includes("Fantasy")).length > 0 && (
                    <div className="netflix-row">
                      <h3 className="row-title">Sci-Fi & Fantasy</h3>
                      <div className="row-scroll">
                        {discoverShows
                          .filter((s) => s.genres.includes("Science-Fiction") || s.genres.includes("Fantasy"))
                          .slice(0, 15)
                          .map((show) => (
                            <ShowCard key={show.id} show={show} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Row 5: Crime & Mystery */}
                  {discoverShows.filter((s) => s.genres.includes("Crime") || s.genres.includes("Mystery") || s.genres.includes("Thriller")).length > 0 && (
                    <div className="netflix-row">
                      <h3 className="row-title">Crime & Mystery</h3>
                      <div className="row-scroll">
                        {discoverShows
                          .filter((s) => s.genres.includes("Crime") || s.genres.includes("Mystery") || s.genres.includes("Thriller"))
                          .slice(0, 15)
                          .map((show) => (
                            <ShowCard key={show.id} show={show} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Top rankings sidebar */}
        <div className="ranking-sidebar">
          <h3 className="section-title" style={{ paddingLeft: "12px", fontSize: "18px" }}>Top Rankings</h3>
          <div className="ranking-list">
            {sidebarRankings.map((show, idx) => (
              <a
                key={show.id}
                href={`/shows/${show.id}`}
                className={`ranking-item rank-${idx + 1}`}
                style={{ textDecoration: "none" }}
              >
                <div className="ranking-num-badge">{idx + 1}</div>
                <img
                  src={show.image?.medium || ""}
                  alt={show.name}
                  className="ranking-poster"
                />
                <div className="ranking-info">
                  <div className="ranking-name" title={show.name}>
                    {show.name}
                  </div>
                  <div className="ranking-score">
                    ★ {show.rating.average || "N/A"}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* CTA / Watchlist Stats Widget */}
          {currentUser ? (
            <div className="sidebar-widget stats-widget" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "12px" }}>Statistik Watchlist Anda</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#fff" }}>{watchlist.length}</div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Total Serial</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--netflix-red)" }}>
                    {watchlist.filter((i) => i.trackerStatus === "watching").length}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Ditonton</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#10b981" }}>
                    {watchlist.filter((i) => i.trackerStatus === "completed").length}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Selesai</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#fbbf24" }}>
                    {watchlist.filter((i) => i.trackerStatus === "plantowatch").length}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Plan to Watch</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="sidebar-widget cta-widget" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>Mulai Melacak Serial</h4>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "12px" }}>
                Simpan serial TV, catat progres episode, dan buat ulasan personal Anda.
              </p>
              <button
                onClick={() => {
                  setAuthTab("login");
                  setIsAuthModalOpen(true);
                }}
                className="hero-btn"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "12px",
                  justifyContent: "center",
                  background: "var(--netflix-red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px"
                }}
              >
                Masuk / Daftar Akun
              </button>
            </div>
          )}

          {/* Surprise Me Widget */}
          {randomShow && (
            <div className="sidebar-widget surprise-widget" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#fff" }}>Surprise Me! 🎲</h4>
                <button
                  onClick={handlePickRandomShow}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Acak serial lain"
                >
                  Acak 🔄
                </button>
              </div>
              <a
                href={`/shows/${randomShow.id}`}
                style={{
                  display: "flex",
                  gap: "12px",
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "8px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  border: "1px solid transparent",
                  transition: "var(--transition-premium)"
                }}
                className="ranking-item"
              >
                <img
                  src={randomShow.image?.medium || ""}
                  alt={randomShow.name}
                  style={{ width: "40px", height: "55px", objectFit: "cover", borderRadius: "4px" }}
                />
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {randomShow.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--gold-color)", marginTop: "4px" }}>
                    ★ {randomShow.rating.average || "N/A"}
                  </div>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

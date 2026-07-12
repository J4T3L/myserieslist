"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-main">
                {/* Column 1: Brand details */}
                <div className="footer-col">
                    <Link href="/" className="footer-brand">
                        My<span>CineList</span>
                    </Link>
                    <p className="footer-desc">
                        Platform pelacak dan penemu serial TV terkemuka. Kelola watchlist pribadi, catat episode, and analisis riwayat tontonan Anda dengan mudah.
                    </p>
                </div>

                {/* Column 2: Navigation Links */}
                <div className="footer-col">
                    <h4 className="footer-title">Navigasi</h4>
                    <ul className="footer-links">
                        <li><Link href="/">Discover</Link></li>
                        <li><Link href="/watchlist">My List</Link></li>
                        <li><Link href="/stats">Dashboard</Link></li>
                    </ul>
                </div>

                {/* Column 3: Data Source & Status */}
                <div className="footer-col" style={{ alignItems: "flex-start" }}>
                    <h4 className="footer-title">Sistem</h4>
                    <div className="footer-status">
                        <span className="airing-pulse" style={{ margin: 0 }}></span>
                        <span>Sistem Online</span>
                    </div>
                    <p className="footer-desc" style={{ fontSize: "12px", opacity: 0.8 }}>
                        Data disediakan secara dinamis oleh platform publik <strong>TVMaze API</strong>.
                    </p>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="footer-bottom">
                <span>
                    © {new Date().getFullYear()} <strong>MyCineList</strong>. All Rights Reserved.
                </span>
                <span style={{ display: "flex", gap: "16px" }}>
                    <span>Built with Next.js & TypeScript</span>
                </span>
            </div>
        </footer>
    );
}


"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-main-clean">
                <div className="footer-left">
                    <Link href="/" className="footer-brand">
                        My<span>CineList</span>
                    </Link>
                    <p className="footer-tagline">
                        Platform pelacak dan penemu serial TV terkemuka secara modern.
                    </p>
                </div>
                <div className="footer-right">
                    <div className="footer-nav-links">
                        <Link href="/">Discover</Link>
                        <span className="dot-divider">•</span>
                        <Link href="/watchlist">My List</Link>
                        <span className="dot-divider">•</span>
                        <Link href="/stats">Dashboard</Link>
                    </div>
                    <div className="footer-status-pill">
                        <span className="airing-pulse" style={{ margin: 0 }}></span>
                        <span>Sistem Online</span>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom-clean">
                <span>
                    © {new Date().getFullYear()} <strong>MyCineList</strong>. Data provided dynamically by TVMaze API.
                </span>
                <span>
                    Built with Next.js & TypeScript
                </span>
            </div>
        </footer>
    );
}

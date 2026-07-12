"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/context/AppContext";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const { showToast } = useApp();

    const [loadingData, setLoadingData] = useState(true);
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
        hasPassword: false
    });

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [image, setImage] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setProfile(data);
                        setName(data.name || "");
                        setPhone(data.phone || "");
                        setImage(data.image || "");
                    }
                })
                .catch(() => showToast("Gagal mengambil data profil", "warning"))
                .finally(() => setLoadingData(false));
        } else if (status === "unauthenticated") {
            setLoadingData(false);
        }
    }, [status, showToast]);

    if (status === "loading" || loadingData) {
        return (
            <div className="container" style={{ padding: "100px 20px", color: "var(--text-muted)", textAlign: "center" }}>
                Memuat Profil...
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="container" style={{ padding: "100px 20px", color: "var(--text-primary)", textAlign: "center" }}>
                <h2>Akses Ditolak</h2>
                <p>Silakan masuk (login) terlebih dahulu untuk melihat dasbor profil.</p>
            </div>
        );
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, image })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message, "success");
            } else {
                showToast(data.error || "Gagal memperbarui profil.", "warning");
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan.", "warning");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/user/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setImage(data.imagePath);
                showToast("Foto profil berhasil diunggah!", "success");
            } else {
                showToast(data.error || "Gagal mengunggah gambar.", "warning");
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan saat mengunggah.", "warning");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("Konfirmasi sandi baru tidak cocok!", "warning");
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await fetch("/api/user/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message, "success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                showToast(data.error || "Gagal mengganti sandi.", "warning");
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan.", "warning");
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="container" style={{ padding: "100px 20px", minHeight: "80vh" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Profil Pengguna</h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: "40px" }}>
                    Kelola informasi pribadi, kontak, dan keamanan akun Anda di sini.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
                    
                    {/* LEFT PANEL: PROFILE DATA */}
                    <div className="auth-card" style={{ padding: "30px", background: "rgba(30, 30, 30, 0.6)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            Informasi Dasar
                        </h2>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "25px" }}>
                            <div 
                                style={{ position: "relative", cursor: isUploadingImage ? "wait" : "pointer" }}
                                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                            >
                                <img 
                                    src={image || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (name || "User")} 
                                    alt="Profile Avatar" 
                                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--netflix-red)", background: "rgba(255,255,255,0.1)", opacity: isUploadingImage ? 0.5 : 1 }}
                                />
                                <div style={{ position: "absolute", bottom: "-5px", right: "-5px", background: "var(--netflix-red)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1e1e1e" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                style={{ display: "none" }} 
                                onChange={handleImageUpload}
                            />
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Foto Profil</h3>
                                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                    {isUploadingImage ? "Mengunggah..." : "Klik foto untuk mengganti"}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Alamat Email</label>
                                <input 
                                    type="email" 
                                    value={profile.email} 
                                    disabled
                                    className="auth-input"
                                    style={{ background: "rgba(0,0,0,0.4)", color: "var(--text-muted)", cursor: "not-allowed", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "6px" }}
                                />
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Email utama bersifat permanen dan tidak dapat diubah.</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="auth-input"
                                    placeholder="Masukkan nama Anda"
                                    style={{ background: "#222", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "6px" }}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Nomor Handphone</label>
                                <input 
                                    type="tel" 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="auth-input"
                                    placeholder="Contoh: 08123456789"
                                    style={{ background: "#222", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "6px" }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSavingProfile}
                                className="hero-btn" 
                                style={{ marginTop: "10px", padding: "12px", width: "100%", background: "#fff", color: "#000", fontWeight: "700", border: "none", borderRadius: "6px" }}
                            >
                                {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT PANEL: PASSWORD / SECURITY */}
                    <div className="auth-card" style={{ padding: "30px", background: "rgba(30, 30, 30, 0.6)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            Keamanan & Sandi
                        </h2>
                        
                        {!profile.hasPassword ? (
                            <div style={{ padding: "20px", background: "rgba(66, 133, 244, 0.1)", border: "1px solid rgba(66, 133, 244, 0.3)", borderRadius: "8px", textAlign: "center" }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "12px" }}>
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <h3>Terhubung dengan Google</h3>
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
                                    Akun Anda didaftarkan menggunakan integrasi Google. Anda tidak memiliki sandi lokal untuk diubah. Keamanan Anda sepenuhnya diurus oleh Google.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSavePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Kata Sandi Lama</label>
                                    <input 
                                        type="password" 
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="auth-input"
                                        placeholder="••••••••"
                                        required
                                        style={{ background: "#222", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "6px" }}
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Kata Sandi Baru</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="auth-input"
                                        placeholder="••••••••"
                                        required
                                        style={{ background: "#222", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "6px" }}
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Ulangi Sandi Baru</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="auth-input"
                                        placeholder="••••••••"
                                        required
                                        style={{ background: "#222", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "6px" }}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSavingPassword}
                                    className="hero-btn" 
                                    style={{ marginTop: "10px", padding: "12px", width: "100%", background: "var(--netflix-red)", color: "#fff", fontWeight: "700", border: "none", borderRadius: "6px" }}
                                >
                                    {isSavingPassword ? "Memproses..." : "Perbarui Sandi"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

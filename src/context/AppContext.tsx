"use client";

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

// --- TYPES ---
export interface Show {
    id: number;
    name: string;
    genres: string[];
    status: string;
    runtime: number | null;
    premiered: string | null;
    rating: { average: number | null };
    network: { name: string; country?: { name: string } } | null;
    webChannel: { name: string; country?: { name: string } } | null;
    image: { medium: string; original: string } | null;
    summary: string | null;
}

export interface Episode {
    id: number;
    name: string;
    season: number;
    number: number;
    airdate: string;
    image: { medium: string; original: string } | null;
    summary: string | null;
}

export interface CastMember {
    person: {
        id: number;
        name: string;
        image: { medium: string; original: string } | null;
    };
    character: {
        id?: number;
        name: string;
    };
}

export interface WatchlistItem {
    show: Show;
    trackerStatus: "watching" | "completed" | "plantowatch" | "onhold" | "dropped";
    personalRating: number | null;
    addedAt: string;
    updatedAt: string;
    watchedEpisodeIds: number[];
    totalEpisodes: number;
    notes: string;
}

export interface Toast {
    id: number;
    message: string;
    type: "success" | "info" | "warning";
}

interface AppContextType {
    currentUser: string | null;
    currentUserImage: string | null;
    currentRole: "user" | "admin" | "supersu" | null;
    watchlist: WatchlistItem[];
    toasts: Toast[];
    isAuthModalOpen: boolean;
    authTab: "login" | "signup";
    settingsOpen: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setIsAuthModalOpen: (open: boolean) => void;
    setAuthTab: (tab: "login" | "signup") => void;
    setSettingsOpen: (open: boolean) => void;
    showToast: (message: string, type?: "success" | "info" | "warning") => void;
    removeToast: (id: number) => void;
    handleAuthSubmit: (username: string, password: string, mode: "login" | "signup") => Promise<boolean>;
    handleLogout: () => void;
    handleAddToWatchlist: (show: Show, status?: WatchlistItem["trackerStatus"]) => void;
    handleRemoveFromWatchlist: (showId: number, showName: string) => void;
    handleUpdatePersonalRating: (showId: number, rating: number | null) => void;
    handleToggleEpisode: (showId: number, episodeId: number) => void;
    handleIncrementEpisodeCount: (showId: number, e?: React.MouseEvent) => void;
    handleSetEpisodesManual: (showId: number, count: number) => void;
    handleSaveNotes: (showId: number, notes: string) => void;
    handleMarkAllEpisodes: (showId: number, completed: boolean) => void;
    handleExportData: () => void;
    handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleResetData: () => void;
    getTrackingStatus: (showId: number) => WatchlistItem["trackerStatus"] | null;
    getPersonalRating: (showId: number) => number | null;
    getWatchlistItem: (showId: number) => WatchlistItem | null;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { data: session, status } = useSession();
    
    const currentUser = session?.user?.name || (session?.user as any)?.email || null;
    const currentUserImage = (session?.user as any)?.image || null;
    const currentRole = (session?.user as any)?.role || null;

    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authTab, setAuthTab] = useState<"login" | "signup">("login");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const showToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // --- INITIALIZATION FROM DB ---
    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/watchlist")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setWatchlist(data);
                    }
                })
                .catch(err => console.error("Failed to fetch watchlist", err));
        } else if (status === "unauthenticated") {
            setWatchlist([]);
        }
    }, [status]);

    const syncItemToBackend = async (item: WatchlistItem) => {
        if (!currentUser) return;
        try {
            await fetch("/api/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    showId: item.show.id,
                    showName: item.show.name,
                    showImage: item.show.image?.medium || null,
                    showRating: item.show.rating?.average || null,
                    showGenres: item.show.genres || [],
                    trackerStatus: item.trackerStatus,
                    personalRating: item.personalRating,
                    notes: item.notes,
                    watchedEpisodeIds: item.watchedEpisodeIds,
                    totalEpisodes: item.totalEpisodes
                })
            });
        } catch (err) {
            console.error("Failed to sync item to backend", err);
        }
    };

    const removeItemFromBackend = async (showId: number) => {
        if (!currentUser) return;
        try {
            await fetch(`/api/watchlist?showId=${showId}`, { method: "DELETE" });
        } catch (err) {
            console.error("Failed to delete item", err);
        }
    };

    const currentSaveWatchlist = (newList: WatchlistItem[], changedItem?: WatchlistItem) => {
        setWatchlist(newList);
        if (changedItem) {
            syncItemToBackend(changedItem);
        }
    };

    const handleAuthSubmit = async (username: string, password: string, mode: "login" | "signup"): Promise<boolean> => {
        if (mode === "signup") {
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await res.json();
                if (!res.ok) {
                    showToast(data.error || "Gagal mendaftar.", "warning");
                    return false;
                }
                showToast("Pendaftaran berhasil! Sedang masuk...", "success");
            } catch (err) {
                showToast("Terjadi kesalahan jaringan.", "warning");
                return false;
            }
        }
        
        const { signIn } = await import("next-auth/react");
        const result = await signIn("credentials", {
            redirect: false,
            username,
            password
        });
        
        if (result?.error) {
            showToast("Username/email tidak ditemukan atau password salah.", "warning");
            return false;
        }
        
        setIsAuthModalOpen(false);
        showToast("Berhasil masuk!", "success");
        return true;
    };

    const handleLogout = () => {
        signOut();
        showToast("Anda telah keluar dari akun.", "info");
    };

    const handleAddToWatchlist = (show: Show, trackerStatus: WatchlistItem["trackerStatus"] = "plantowatch") => {
        if (!currentUser) {
            setAuthTab("login");
            setIsAuthModalOpen(true);
            showToast("Silakan masuk/login terlebih dahulu untuk melacak serial!", "warning");
            return;
        }
        const exists = watchlist.find((item) => item.show.id === show.id);

        if (exists) {
            const updated = watchlist.map((item) => {
                if (item.show.id === show.id) {
                    let episodesWatchedList = [...item.watchedEpisodeIds];
                    if (trackerStatus === "completed" && item.totalEpisodes > 0 && episodesWatchedList.length < item.totalEpisodes) {
                        episodesWatchedList = Array.from({ length: item.totalEpisodes }, (_, i) => i + 1);
                    }
                    return {
                        ...item,
                        trackerStatus: trackerStatus,
                        watchedEpisodeIds: episodesWatchedList,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return item;
            });
            currentSaveWatchlist(updated, updated.find(i => i.show.id === show.id));
            showToast(`Status ${show.name} diubah menjadi ${getStatusLabel(trackerStatus)}`);
        } else {
            const newItem: WatchlistItem = {
                show,
                trackerStatus: trackerStatus,
                personalRating: null,
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                watchedEpisodeIds: [],
                totalEpisodes: 0,
                notes: "",
            };
            currentSaveWatchlist([...watchlist, newItem], newItem);
            showToast(`Berhasil menambahkan ${show.name} ke Daftar Tontonan!`);
        }
    };

    const handleRemoveFromWatchlist = (showId: number, showName: string) => {
        if (!currentUser) return;
        const updated = watchlist.filter((item) => item.show.id !== showId);
        currentSaveWatchlist(updated);
        removeItemFromBackend(showId);
        showToast(`Menghapus ${showName} dari Daftar Tontonan`, "warning");
    };

    const handleUpdatePersonalRating = (showId: number, rating: number | null) => {
        if (!currentUser) return;
        const updated = watchlist.map((item) =>
            item.show.id === showId ? { ...item, personalRating: rating, updatedAt: new Date().toISOString() } : item
        );
        currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));
        showToast("Rating personal berhasil diperbarui!");
    };

    const handleToggleEpisode = (showId: number, episodeId: number) => {
        if (!currentUser) return;
        const updated = watchlist.map((item) => {
            if (item.show.id === showId) {
                const isWatched = item.watchedEpisodeIds.includes(episodeId);
                let newWatchedList: number[];

                if (isWatched) {
                    newWatchedList = item.watchedEpisodeIds.filter((id) => id !== episodeId);
                } else {
                    newWatchedList = [...item.watchedEpisodeIds, episodeId];
                }

                let newStatus: WatchlistItem["trackerStatus"] = item.trackerStatus;
                if (item.totalEpisodes > 0 && newWatchedList.length === item.totalEpisodes) {
                    newStatus = "completed";
                    showToast(`Semua episode ${item.show.name} telah selesai ditonton!`, "success");
                } else if (newWatchedList.length > 0 && item.trackerStatus === "plantowatch") {
                    newStatus = "watching";
                }

                return {
                    ...item,
                    watchedEpisodeIds: newWatchedList,
                    trackerStatus: newStatus,
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        });
        currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));
    };

    const handleIncrementEpisodeCount = (showId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!currentUser) return;

        const updated = watchlist.map((item) => {
            if (item.show.id === showId) {
                const nextMockId = Date.now() + Math.random();
                const newWatchedList = [...item.watchedEpisodeIds, Math.floor(nextMockId)];
                const reachedEnd = item.totalEpisodes > 0 && newWatchedList.length >= item.totalEpisodes;

                return {
                    ...item,
                    watchedEpisodeIds: reachedEnd && item.totalEpisodes > 0
                        ? Array.from({ length: item.totalEpisodes }, (_, i) => i + 1)
                        : newWatchedList,
                    trackerStatus: reachedEnd ? ("completed" as const) : ("watching" as const),
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        });
        currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));
        const item = watchlist.find((i) => i.show.id === showId);
        if (item) {
            showToast(`Episode ${item.show.name} bertambah: ${item.watchedEpisodeIds.length + 1} ditonton.`);
        }
    };

    const handleSetEpisodesManual = (showId: number, count: number) => {
        if (!currentUser) return;
        const updated = watchlist.map((item) => {
            if (item.show.id === showId) {
                const target = Math.max(0, count);
                let list: number[] = [];

                if (item.totalEpisodes > 0 && target >= item.totalEpisodes) {
                    list = Array.from({ length: item.totalEpisodes }, (_, i) => i + 1);
                } else {
                    list = Array.from({ length: target }, (_, i) => i + 1);
                }

                const reachedEnd = item.totalEpisodes > 0 && list.length >= item.totalEpisodes;

                return {
                    ...item,
                    watchedEpisodeIds: list,
                    trackerStatus: reachedEnd ? ("completed" as const) : list.length > 0 ? ("watching" as const) : item.trackerStatus,
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        });
        currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));
    };

    const handleSaveNotes = (showId: number, notes: string) => {
        const updated = watchlist.map((item) =>
            item.show.id === showId ? { ...item, notes, updatedAt: new Date().toISOString() } : item
        );
        currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));
        showToast("Review dan catatan berhasil disimpan!");
    };

    const handleMarkAllEpisodes = (showId: number, completed: boolean) => {
        const updated = watchlist.map((item) => {
            if (item.show.id === showId) {
                return {
                    ...item,
                    watchedEpisodeIds: completed && item.totalEpisodes > 0
                        ? Array.from({ length: item.totalEpisodes }, (_, i) => i + 1)
                        : completed
                            ? Array.from({ length: 12 }, (_, i) => i + 1)
                            : [],
                    trackerStatus: completed ? ("completed" as const) : ("plantowatch" as const),
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        });
        currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));
        showToast(completed ? "Semua episode ditandai telah ditonton!" : "Reset progres tontonan.");
    };

    // Helper getters
    const getTrackingStatus = (showId: number) => {
        const found = watchlist.find((item) => item.show.id === showId);
        return found ? found.trackerStatus : null;
    };

    const getPersonalRating = (showId: number) => {
        const found = watchlist.find((item) => item.show.id === showId);
        return found ? found.personalRating : null;
    };

    const getWatchlistItem = (showId: number) => {
        return watchlist.find((item) => item.show.id === showId) || null;
    };

    const getStatusLabel = (status: WatchlistItem["trackerStatus"]) => {
        if (status === "watching") return "Sedang Ditonton";
        if (status === "completed") return "Selesai";
        if (status === "onhold") return "Ditunda";
        if (status === "dropped") return "Dihentikan";
        return "Plan to Watch";
    };

    const handleExportData = () => {
        const dataStr = JSON.stringify(watchlist, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cinelist_backup_${currentUser || "guest"}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Ekspor data berhasil!", "success");
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!Array.isArray(json)) throw new Error("Format cadangan tidak valid (harus array).");
                const validated: WatchlistItem[] = json.map((item: Record<string, unknown>, index: number) => {
                    const show = item.show as Show | undefined;
                    if (!show || !show.id || !show.name) {
                        throw new Error(`Item ke-${index + 1} tidak memiliki objek serial TV yang valid.`);
                    }
                    return {
                        show,
                        trackerStatus: (item.trackerStatus as WatchlistItem["trackerStatus"]) || "plantowatch",
                        personalRating: (item.personalRating as number | null) ?? null,
                        addedAt: (item.addedAt as string) || new Date().toISOString(),
                        updatedAt: (item.updatedAt as string) || new Date().toISOString(),
                        watchedEpisodeIds: (item.watchedEpisodeIds as number[]) || [],
                        totalEpisodes: (item.totalEpisodes as number) ?? 0,
                        notes: (item.notes as string) ?? "",
                    };
                });

                const existingIds = new Set(watchlist.map((item) => item.show.id));
                const merged = [...watchlist];

                validated.forEach((importedItem) => {
                    if (existingIds.has(importedItem.show.id)) {
                        const idx = merged.findIndex((m) => m.show.id === importedItem.show.id);
                        merged[idx] = importedItem;
                        syncItemToBackend(importedItem);
                    } else {
                        merged.push(importedItem);
                        syncItemToBackend(importedItem);
                    }
                });

                currentSaveWatchlist(merged);
                showToast(`Impor berhasil! Memproses ${validated.length} serial.`, "success");
                setSettingsOpen(false);
            } catch (err) {
                showToast(err instanceof Error ? err.message : "Gagal mengimpor file backup.", "warning");
            }
        };
        reader.readAsText(file);
    };

    const handleResetData = () => {
        if (window.confirm("Apakah Anda yakin ingin menghapus semua data watchlist Anda? Ini tidak dapat dibatalkan.")) {
            watchlist.forEach(i => removeItemFromBackend(i.show.id));
            currentSaveWatchlist([]);
            showToast("Data watchlist dibersihkan.", "info");
            setSettingsOpen(false);
        }
    };

    return (
        <AppContext.Provider
            value={{
                currentUser,
                currentUserImage,
                currentRole,
                watchlist,
                toasts,
                isAuthModalOpen,
                authTab,
                settingsOpen,
                searchQuery,
                setSearchQuery,
                setIsAuthModalOpen,
                setAuthTab,
                setSettingsOpen,
                showToast,
                removeToast,
                handleAuthSubmit,
                handleLogout,
                handleAddToWatchlist,
                handleRemoveFromWatchlist,
                handleUpdatePersonalRating,
                handleToggleEpisode,
                handleIncrementEpisodeCount,
                handleSetEpisodesManual,
                handleSaveNotes,
                handleMarkAllEpisodes,
                handleExportData,
                handleImportData,
                handleResetData,
                getTrackingStatus,
                getPersonalRating,
                getWatchlistItem,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
};

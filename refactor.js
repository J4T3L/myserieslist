const fs = require('fs');

let content = fs.readFileSync('./src/context/AppContext.tsx', 'utf8');

// Replace Auth
const oldAuth = `    const handleAuthSubmit = async (username: string, password: string, mode: "login" | "signup"): Promise<boolean> => {
        const localUsers = localStorage.getItem("cinelist_users");
        const usersData = localUsers ? JSON.parse(localUsers) : {};
        const lowerUsername = username.toLowerCase().trim();

        if (mode === "login") {
            const account = usersData[lowerUsername] as UserAccount | undefined;
            if (account && account.passwordHash === password) {
                sessionStorage.setItem("cinelist_user", account.username);
                sessionStorage.setItem("cinelist_role", account.role);

                setCurrentUser(account.username);
                setCurrentRole(account.role);
                setWatchlist(account.watchlist || []);

                showToast(\`Selamat datang kembali, \${account.username}!\`, "success");
                setIsAuthModalOpen(false);
                return true;
            } else {
                return false;
            }
        } else {
            if (usersData[lowerUsername]) {
                return false;
            }

            const newAccount: UserAccount = {
                username: username.trim(),
                passwordHash: password,
                watchlist: SEED_WATCHLIST,
                role: "user",
            };

            usersData[lowerUsername] = newAccount;
            localStorage.setItem("cinelist_users", JSON.stringify(usersData));

            sessionStorage.setItem("cinelist_user", newAccount.username);
            sessionStorage.setItem("cinelist_role", newAccount.role);

            setCurrentUser(newAccount.username);
            setCurrentRole(newAccount.role);
            setWatchlist(SEED_WATCHLIST);

            showToast(\`Pendaftaran berhasil! Selamat datang \${newAccount.username}!\`, "success");
            setIsAuthModalOpen(false);
            return true;
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("cinelist_user");
        sessionStorage.removeItem("cinelist_role");
        setCurrentUser(null);
        setCurrentRole(null);
        setWatchlist([]);
        showToast("Anda telah keluar dari akun.", "info");
    };`;

const newAuth = `    const handleAuthSubmit = async (username: string, password: string, mode: "login" | "signup"): Promise<boolean> => {
        showToast("Login lokal dinonaktifkan. Silakan klik Login with Google.", "warning");
        return false;
    };

    const handleLogout = () => {
        signOut();
        showToast("Anda telah keluar dari akun.", "info");
    };`;

content = content.replace(oldAuth, newAuth);

// Insert removeItemFromBackend
const insertPoint = `    const currentSaveWatchlist = (newList: WatchlistItem[], changedItem?: WatchlistItem) => {`;
const insertContent = `    const removeItemFromBackend = async (showId: number) => {
        if (!currentUser) return;
        try {
            await fetch(\`/api/watchlist?showId=\${showId}\`, { method: "DELETE" });
        } catch (err) {
            console.error("Failed to delete item", err);
        }
    };

    const currentSaveWatchlist = (newList: WatchlistItem[], changedItem?: WatchlistItem) => {`;
content = content.replace(insertPoint, insertContent);


// Replace currentSaveWatchlist(updated) calls with changedItem logic
content = content.replace(/currentSaveWatchlist\(updated\);\n\s*showToast\(\`Status \$\{show.name\} diubah menjadi/g, 'currentSaveWatchlist(updated, updated.find(i => i.show.id === show.id));\n            showToast(`Status ${show.name} diubah menjadi');
content = content.replace(/currentSaveWatchlist\(\[\.\.\.watchlist, newItem\]\);/g, 'currentSaveWatchlist([...watchlist, newItem], newItem);');

content = content.replace(/currentSaveWatchlist\(updated\);\n\s*showToast\(\`Menghapus \$\{showName\} dari Daftar Tontonan\`, "warning"\);/g, 'currentSaveWatchlist(updated);\n        removeItemFromBackend(showId);\n        showToast(`Menghapus ${showName} dari Daftar Tontonan`, "warning");');

content = content.replace(/currentSaveWatchlist\(updated\);\n\s*showToast\("Rating personal berhasil diperbarui!"\);/g, 'currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));\n        showToast("Rating personal berhasil diperbarui!");');

content = content.replace(/currentSaveWatchlist\(updated\);\n\s*const item = watchlist.find/g, 'currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));\n        const item = watchlist.find');

// For handleToggleEpisode, handleSetEpisodesManual, handleSaveNotes, handleMarkAllEpisodes
// Let's just do a generic replace for all remaining 'currentSaveWatchlist(updated);'
// We can use a regex for this since we already mapped 'updated' to the modified list.
content = content.replace(/currentSaveWatchlist\(updated\);/g, 'currentSaveWatchlist(updated, updated.find(i => i.show.id === showId));');


fs.writeFileSync('./src/context/AppContext.tsx', content);
console.log('Refactor complete!');

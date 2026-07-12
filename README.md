# 🍿 MyCineList — Your Ultimate TV Series Tracker

Welcome to **MyCineList**! 🚀 Aplikasi tracker serial TV super *kece badai* yang bikin pengalaman binge-watching kamu makin tertata, rapi, dan terorganisir. Gak ada lagi cerita lupa udah nonton episode berapa atau bingung mau nonton apa akhir pekan ini!

## ✨ Fitur Kece Badai (Features)

- 🔍 **Live Search Anti-Lemot**: Cari serial favoritmu secepat kilat (powered by TV Maze API) dengan sistem debounce biar nggak bikin browser nge-lag!
- 🎲 **Surprise Me!**: Bingung mau nonton apa? Klik tombol ajaib "Acak 🔄" di sidebar dan biarkan takdir memilih tontonan terbaik buat kamu.
- 📊 **Watchlist Stats**: Pantau seberapa *no-life* (atau produktif) dirimu dengan dashboard statistik pribadi (Watching, Completed, Plan to Watch).
- 👑 **Sistem 3-Role (RBAC)**: Gak cuma buat user biasa, aplikasi ini punya hierarki kelas kakap:
  - 👤 **User**: Track tontonan pribadi sesuka hati.
  - 🛡️ **Admin**: Lihat statistik global platform.
  - 🦸‍♂️ **SuperSU**: Akses level Dewa (Root)! Bisa *inspect* watchlist orang lain, ubah jabatan akun, hingga hapus user dari sistem.
- 💾 **Local-First & Backup (JSON)**: Datamu sepenuhnya aman di browser (Local Storage). Takut hilang karena bersihin cache? Tinggal *Ekspor* ke JSON, dan *Impor* kembali kapan saja!
- 🎨 **UI/UX Premium**: Desain estetik ala Netflix, elemen *glassmorphism*, dark mode yang elegan, plus efek transisi yang super *smooth*.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router) dengan Turbopack ⚡
- **UI Library**: React 19 ⚛️
- **Styling**: Vanilla CSS (CSS Variables, Grid, Flexbox) — *Murni skill tanpa library CSS berat!*
- **Database**: Local Storage & Session Storage (Zero-config backend!)
- **Data Source**: [TVMaze API](https://www.tvmaze.com/api) 📺

## 🚀 Cara Menjalankan (Quick Start)

Penasaran pengen coba *run* di komputermu? Gampang banget!

1. **Buka Terminal & Masuk ke Direktori**
   Pastikan kamu sudah berada di folder project ini.

2. **Install semua dependencies**
   ```bash
   npm install
   ```

3. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

4. **Buka di Browser**
   Buka `http://localhost:3000` dan nikmati antarmuka yang memanjakan mata! 🎉

## 🔑 Akun Uji Coba (Bawaan)

Nggak mau ribet daftar akun baru? Langsung aja login pakai akun "rahasia" ini:

| Role | Username | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **SuperSU** | `supersu` | `supersu123` | Punya akses dashboard SuperSU (Level Dewa) |
| **Admin** | `admin` | `admin123` | Punya akses manajemen Admin biasa |
| **User** | `user` | `user123` | Akun penonton TV Series standar |

---

<div align="center">
  Dibuat dengan 💻, ☕, dan penuh gaya. <br>
  <strong>Binge-watch responsibly! 🍿</strong>
</div>

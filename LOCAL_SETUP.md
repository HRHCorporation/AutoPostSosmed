# Panduan Instalasi Lokal — AutomateIn

Panduan ini menjelaskan cara menjalankan AutomateIn di komputer lokal kamu dari awal hingga siap digunakan.

---

## Prasyarat

Pastikan software berikut sudah terinstall:

| Software | Versi Minimum | Cek |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| PostgreSQL | 14.x | `psql --version` |
| Git | — | `git --version` |

Untuk install PostgreSQL:
- **Mac:** `brew install postgresql@14 && brew services start postgresql@14`
- **Ubuntu/Debian:** `sudo apt install postgresql postgresql-contrib`
- **Windows:** Download installer dari [postgresql.org](https://www.postgresql.org/download/windows/)

---

## Langkah 1 — Clone Repository

```bash
git clone https://github.com/HRHCorporation/AutoPostSosmed.git
cd AutoPostSosmed
```

---

## Langkah 2 — Install Dependencies

```bash
npm install
```

---

## Langkah 3 — Buat Database PostgreSQL

```bash
# Masuk ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE autopost;

# Keluar
\q
```

Jika menggunakan user selain `postgres`, sesuaikan perintah di atas.

---

## Langkah 4 — Inisialisasi Skema Database

```bash
psql postgresql://postgres@localhost:5432/autopost -f schema.sql
```

Perintah ini akan membuat tabel: `posts`, `social_accounts`, `automations`, `media`.

> **Verifikasi:** `psql postgresql://postgres@localhost:5432/autopost -c "\dt"` — harus menampilkan 4 tabel.

---

## Langkah 5 — Konfigurasi Environment Variables

```bash
cp .env.example .env
```

Buka `.env` dan isi nilai-nilainya:

```env
# DATABASE — wajib diisi
DATABASE_URL=postgresql://postgres@localhost:5432/autopost

# App URL — biarkan ini untuk development lokal
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron secret — buat string acak, contoh: openssl rand -hex 16
CRON_SECRET=isi_dengan_string_acak_kamu

# AI (minimal salah satu)
GEMINI_API_KEY=         # Dari Google AI Studio: aistudio.google.com
DEEPSEEK_API_KEY=       # Opsional, dari platform.deepseek.com

# OAuth platform (isi sesuai platform yang ingin digunakan)
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

THREADS_APP_ID=
THREADS_APP_SECRET=

INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
WEBHOOK_VERIFY_TOKEN=   # String acak untuk verifikasi webhook Instagram
```

---

## Langkah 6 — Jalankan Development Server

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

Kamu akan langsung diarahkan ke dashboard tanpa perlu login.

---

## Langkah 7 — Setup OAuth (Opsional, per platform)

Lewati bagian ini jika kamu hanya ingin mencoba fitur editor dan AI. OAuth hanya dibutuhkan untuk benar-benar posting ke media sosial.

### 7a. LinkedIn

1. Buka [LinkedIn Developer Portal](https://developer.linkedin.com/apps) → **Create App**
2. Di tab **Auth**, tambahkan Authorized Redirect URL:
   ```
   http://localhost:3000/api/linkedin/callback
   ```
3. Di tab **Products**, aktifkan **Share on LinkedIn** dan **Sign In with LinkedIn using OpenID Connect**
4. Copy **Client ID** dan **Client Secret** ke `.env`

### 7b. Threads

1. Buka [Meta for Developers](https://developers.facebook.com/apps) → **Create App** → pilih tipe **Business**
2. Tambahkan produk **Threads API**
3. Di **Threads API → Settings**, tambahkan Redirect URI:
   ```
   http://localhost:3000/api/threads/callback
   ```
4. Copy **App ID** dan **App Secret** ke `.env` sebagai `THREADS_APP_ID` dan `THREADS_APP_SECRET`

### 7c. Instagram (Post Publishing + Comment Automation)

> Butuh akun Instagram **Business** atau **Creator** yang terhubung ke Facebook Page.

1. Buka [Meta for Developers](https://developers.facebook.com/apps) → **Create App** → pilih tipe **Business**
2. Tambahkan produk **Instagram**
3. Di **Instagram → Basic Display**, tambahkan Valid OAuth Redirect URI:
   ```
   http://localhost:3000/api/instagram/callback
   ```
4. Aktifkan permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_show_list`, `pages_read_engagement`
5. Copy **App ID** dan **App Secret** ke `.env` sebagai `INSTAGRAM_APP_ID` dan `INSTAGRAM_APP_SECRET`
6. Isi `WEBHOOK_VERIFY_TOKEN` dengan string acak

Untuk automation comment-to-DM, lihat panduan lengkap di [INSTAGRAM_AUTOMATION_GUIDE.md](./INSTAGRAM_AUTOMATION_GUIDE.md).

---

## Langkah 8 — Hubungkan Akun di Dashboard

1. Buka **http://localhost:3000/dashboard/settings**
2. Klik **Connect Account** di platform yang diinginkan
3. Ikuti alur OAuth
4. Setelah berhasil, akun akan tampil dengan tanda centang hijau

---

## Menjalankan Cron Job secara Manual

Cron job untuk publish post terjadwal berjalan di endpoint `/api/cron/publish`. Untuk mengujinya secara manual:

```bash
curl -H "Authorization: Bearer CRON_SECRET_KAMU" http://localhost:3000/api/cron/publish
```

Ganti `CRON_SECRET_KAMU` dengan nilai yang ada di `.env`.

Untuk production (Vercel), tambahkan di `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Struktur Fitur

| Fitur | Deskripsi |
|---|---|
| **Editor** | Buat post dengan TipTap rich text editor, generate konten dengan AI (Gemini / DeepSeek), generate gambar dengan AI |
| **Platform** | Publish ke LinkedIn, Threads, Instagram secara bersamaan |
| **Schedule** | Jadwalkan post untuk dipublish di waktu tertentu (via cron) |
| **Posts** | Lihat dan kelola draft, scheduled, dan published posts |
| **Automation** | Auto-reply komentar Instagram via DM saat keyword terdeteksi |
| **Settings** | Connect/disconnect akun media sosial |

---

## Troubleshooting

### Database connection error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

PostgreSQL tidak berjalan. Jalankan:
- **Mac:** `brew services start postgresql@14`
- **Linux:** `sudo systemctl start postgresql`

---

### `relation "posts" does not exist`

Schema belum dijalankan. Ulangi Langkah 4.

---

### OAuth redirect error

Pastikan Redirect URI di developer portal **persis sama** dengan yang ada di kode, termasuk `http://` vs `https://` dan trailing slash.

---

### Instagram: `no_facebook_page`

Akun Instagram belum terhubung ke Facebook Page, atau kamu login dengan akun Facebook yang salah saat OAuth.

---

### Post gagal publish ke Instagram

Instagram **wajib ada gambar**. Di editor, generate gambar dengan AI Image Generator lalu klik **"Use for Instagram"**, atau isi URL gambar secara manual di field Instagram Image URL.

---

## Migrasi Database (jika schema berubah)

Untuk menambahkan kolom baru ke database yang sudah ada (bukan setup baru):

```bash
# Contoh: tambah kolom image_url yang ditambahkan di versi terbaru
psql $DATABASE_URL -c "ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url text;"
psql $DATABASE_URL -c "ALTER TABLE posts ADD COLUMN IF NOT EXISTS platforms text NOT NULL DEFAULT 'linkedin';"
```

---

## Deploy ke Vercel

Lihat [NOAUTH_DEPLOYMENT_GUIDE.md](./NOAUTH_DEPLOYMENT_GUIDE.md) untuk panduan deployment ke Vercel.

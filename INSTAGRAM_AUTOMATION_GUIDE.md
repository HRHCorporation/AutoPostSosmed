# Instagram Comment-to-DM Automation — Setup Guide

Fitur ini membalas komentar Instagram secara otomatis via DM ketika seseorang menulis keyword tertentu di postingan kamu.

---

## Prasyarat

- Akun **Instagram Business** atau **Instagram Creator** (bukan personal)
- Akun Facebook yang terhubung ke Instagram tersebut
- Akses ke **Meta Developer Dashboard** (developers.facebook.com)

---

## Langkah 1 — Buat Meta App

1. Buka [https://developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Klik **Create App**
3. Pilih tipe: **Business**
4. Isi nama app, email, klik **Create App**

---

## Langkah 2 — Aktifkan Instagram Basic Display & Messaging

Di dashboard app kamu:

1. Klik **Add Product** → cari **Instagram** → klik **Set Up**
2. Klik **Add Product** → cari **Messenger** → klik **Set Up** (untuk DM)
3. Di sidebar kiri → **Instagram** → **Basic Display** → **Create New App**

---

## Langkah 3 — Ambil App ID & App Secret

1. Sidebar kiri → **Settings** → **Basic**
2. Copy **App ID** → masukkan ke `.env`:
   ```
   INSTAGRAM_APP_ID=123456789012345
   ```
3. Klik **Show** di App Secret → copy → masukkan ke `.env`:
   ```
   INSTAGRAM_APP_SECRET=abcdef1234567890abcdef1234567890
   ```

---

## Langkah 4 — Daftarkan Redirect URI

1. Sidebar → **Instagram** → **Basic Display**
2. Di bagian **Valid OAuth Redirect URIs**, tambahkan:
   ```
   https://domain-kamu.vercel.app/api/instagram/callback
   ```
   Untuk lokal (dengan ngrok):
   ```
   https://abc123.ngrok.io/api/instagram/callback
   ```
3. Klik **Save Changes**

---

## Langkah 5 — Setup Webhook

### 5a. Pilih Verify Token

Buat string acak sebagai verify token, contoh: `my_secret_token_2024`

Masukkan ke `.env`:
```
WEBHOOK_VERIFY_TOKEN=my_secret_token_2024
```

### 5b. Expose localhost (development only)

Meta tidak bisa reach `localhost` — gunakan ngrok:

```bash
# Install ngrok (jika belum)
brew install ngrok   # Mac
# atau download dari https://ngrok.com

# Jalankan app dulu
npm run dev

# Di terminal lain, expose port 3000
ngrok http 3000
```

Ngrok akan memberikan URL seperti:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

### 5c. Daftarkan Webhook di Meta

1. Sidebar → **Webhooks** → **Add Callback URL**
2. Isi:
   ```
   Callback URL: https://abc123.ngrok-free.app/api/webhooks/instagram
   Verify Token: my_secret_token_2024   ← harus sama dengan di .env
   ```
3. Klik **Verify and Save**
   - Meta akan kirim GET ke URL kamu — jika berhasil, muncul tanda centang hijau

4. Klik **Add Subscriptions** → pilih field: **`comments`** → klik Subscribe

---

## Langkah 6 — Connect Instagram di App

1. Buka app kamu → **Settings** → klik **Connect Account** di bagian Instagram
2. Login dengan akun Facebook yang terhubung ke Instagram Business kamu
3. Setujui semua permission yang diminta
4. Setelah redirect balik, Instagram akan tampil sebagai "Connected"

---

## Langkah 7 — Buat Automation Rule

1. Buka **Automation** di sidebar
2. Isi:
   - **Trigger Keyword**: kata yang harus ada di komentar, misal `info` atau `mau`
   - **DM Message**: pesan yang akan dikirim ke commenter
3. Klik **Create Automation**

---

## Langkah 8 — Test

1. Buka postingan Instagram kamu
2. Tulis komentar yang mengandung keyword (misal: "mau info dong")
3. Dalam beberapa detik, commenter akan menerima DM otomatis

---

## Untuk Production (Vercel)

Ganti semua URL ngrok dengan domain Vercel kamu:

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Dan update Redirect URI + Webhook Callback URL di Meta Developer Dashboard ke domain Vercel.

Juga pastikan semua env vars sudah ditambahkan di **Vercel Dashboard → Settings → Environment Variables**:

```
INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET
WEBHOOK_VERIFY_TOKEN
```

---

## Troubleshooting

| Masalah | Kemungkinan penyebab |
|---|---|
| Webhook verification gagal | `WEBHOOK_VERIFY_TOKEN` di `.env` tidak cocok dengan yang diisi di Meta |
| "no_facebook_page" saat connect | Akun Facebook tidak punya Page yang terhubung ke Instagram |
| "no_instagram_account" saat connect | Instagram tidak diset sebagai Business/Creator account |
| DM tidak terkirim | Commenter perlu pernah DM akun kamu dulu (Meta policy: 24-hour window) |
| Komentar tidak terdeteksi | Pastikan subscription field `comments` sudah aktif di webhook |

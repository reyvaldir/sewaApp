---
description: Deploy to VPS using GitHub Actions
---

# Panduan Setup CI/CD GitHub Actions ke VPS

Workflow ini menjelaskan langkah-langkah untuk menyiapkan *Continuous Deployment* (CD) otomatis dari repositori GitHub Anda ke VPS menggunakan koneksi SSH dan Docker. Setiap kali Anda melakukan `push` ke branch `main`, GitHub Actions akan otomatis memperbarui aplikasi Anda di VPS.

## Step 1: Persiapan Awal di VPS
Pastikan VPS Anda sudah siap:
1. Login/SSH ke VPS Anda.
2. Pastikan **Git**, **Docker**, dan **Docker Compose** sudah terinstal.
3. *Clone* repositori `sewaApp` Anda ke folder tujuan (misal: `/var/www/sewaApp`) untuk pertama kalinya dan atur file `.env` di sana.

## Step 2: Buat SSH Key untuk GitHub Actions
Anda perlu membuat kunci SSH agar GitHub Actions bisa masuk ke VPS Anda dengan aman tanpa *password*.
1. Jalankan perintah ini (di lokal atau di VPS) untuk membuat key baru:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f ./github_deploy_key
   ```
2. Jangan beri password (kosongkan *passphrase*).
3. Salin isi file **LOKAL/PUBLIC** (`github_deploy_key.pub`) ke file `~/.ssh/authorized_keys` di dalam VPS Anda:
   ```bash
   # Di dalam VPS Anda:
   echo "ISI_DARI_github_deploy_key.pub_DISINI" >> ~/.ssh/authorized_keys
   ```

## Step 3: Tambahkan Secrets di GitHub
Buka Repositori GitHub Anda (`reyvaldir/sewaApp`) > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.

Tambahkan 3 secret berikut:
1. `VPS_HOST` : Alamat IP publik VPS Anda (contoh: `198.51.100.12`).
2. `VPS_USERNAME` : Username SSH di VPS Anda (contoh: `root` atau `ubuntu`).
3. `VPS_SSH_KEY` : Salin **seluruh isi** file kunci **PRIVATE** yang tadi Anda buat (`github_deploy_key`), lengkap dengan tag `-----BEGIN OPENSSH PRIVATE KEY-----` dan `-----END OPENSSH PRIVATE KEY-----`.

## Step 4: Tambahkan File Workflow di Project Ini
1. Buat struktur folder `.github/workflows/` di root proyek ini.
2. Buat file bernama `deploy.yml` dan salin kode berikut ke dalamnya:

```yaml
name: Deploy Next.js to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/sewaApp
            git pull origin main
            docker compose down
            docker compose up -d --build
```
> **Catatan:** Sesuaikan bagian `cd /var/www/sewaApp` dengan path aktual letak folder aplikasi sewaApp di dalam VPS Anda.

## Step 5: Jalankan & Verifikasi
1. Commit file `.github/workflows/deploy.yml` dan push ke repositori GitHub.
2. Buka tab **Actions** di repositori GitHub Anda.
3. Anda akan melihat workflow bernama "Deploy Next.js to VPS" sedang berjalan secara otomatis yang akan melakukan penarikan kode terbaru (`git pull`) dan merestart docker container web + database Anda.

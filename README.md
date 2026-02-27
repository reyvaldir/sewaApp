# Costume Rental Management System

Protokol untuk menjalankan proyek ini di mesin lokal:

## Prasyarat

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker & Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Langkah-langkah Quick Start

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Jalankan Database (Docker)**
   Pastikan Docker Desktop sudah aktif, lalu jalankan:

   ```bash
   docker-compose up -d
   ```

3. **Inisialisasi Database (Prisma)**
   Lakukan sinkronisasi skema dan generate client:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Isi Data Awal (Seeding)**
   Jalankan script untuk mengisi 3 kategori, 5 master produk, 1 bundle, dan 17 unit inventory:

   ```bash
   node prisma/seed.js
   ```

5. **Jalankan Aplikasi**
   ```bash
   pnpm dev
   ```
   Akses di [http://localhost:3000/pos](http://localhost:3000/pos)

## Fitur Saat Ini

- **POS Interface**: UI Kasir yang modern dengan Sidebar Produk dan Sidebar Order.
- **Database Integration**: Menggunakan PostgreSQL (Docker) & Prisma ORM.
- **KTP Guarantee**: Sistem jaminan KTP untuk membebaskan deposit nominal uang.
- **Automatic Availability**: Status unit (Tersedia/Sewa) terupdate otomatis di UI.

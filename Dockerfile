# Tentukan versi Node.js yang akan digunakan
FROM node:14

# Buat direktori kerja untuk aplikasi
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Pasang dependensi
RUN npm install

# Salin semua file aplikasi ke direktori kerja
COPY . .

# Tentukan port yang akan digunakan oleh aplikasi (jika ada)
# EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "index.js"]
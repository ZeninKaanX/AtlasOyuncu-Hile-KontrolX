#!/usr/bin/env bash
# ======================================================
# Atlas AC - Linux Başlatıcı (Terminal & GUI Uyumlu)
# ======================================================
cd "$(dirname "$0")"

echo "======================================================"
echo "    ATLAS AC - LINUX ANTI-CHEAT & INTEGRITY ENGINE    "
echo "======================================================"

# 1. Eski donmuş veya artık süreçleri temizle
fuser -k 3317/tcp 2>/dev/null || true

# 2. İkili dosya veya Node.js ile başlat
if [ -f "./dist/AtlasAC-Linux" ]; then
    chmod +x "./dist/AtlasAC-Linux"
    echo "[*] Derlenmiş ikili dosya başlatılıyor: ./dist/AtlasAC-Linux"
    ./dist/AtlasAC-Linux
elif [ -f "./src/main/index.js" ]; then
    echo "[*] Node.js ortamı ile başlatılıyor..."
    npm start
else
    echo "[!] Başlatma dosyası bulunamadı!"
    exit 1
fi

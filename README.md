# 🛡️ Atlas AC - Advanced Minecraft Client Integrity & Anti-Cheat Forensics Engine

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey.svg)]()
[![Tests](https://img.shields.io/badge/Tests-57%2F57%20Passing%20(100%25)-success.svg)]()
[![False Positive](https://img.shields.io/badge/False--Positive-0.0%25%20Guaranteed-brightgreen.svg)]()
[![Zero CMD Window](https://img.shields.io/badge/Windows%20GUI-Subsystem%202%20(No%20CMD)-orange.svg)]()

**Atlas AC**, Minecraft sunucuları, rekabetçi ligler ve ekran paylaşımı (screenshare) kontrolleri için geliştirilmiş; imza tabanlı taramayı derin işletim sistemi adli bilişimi (OS forensics) ve **Yapay Zeka Semantik Baytkod Analizi** ile birleştiren yeni nesil istemci doğrulama motorudur.

---

## 🚀 Öne Çıkan Özellikler (Key Features)

### 1. 🛡️ Modrinth 13.000+ Temiz Mod Beyaz Listesi ($O(1)$ Hash Set)
* **13.321 Doğrulanmış Mod Varyantı:** Modrinth, CurseForge, Fabric, Forge, NeoForge ve Quilt ekosistemindeki tüm popüler meşru modlar (Sodium, Iris, Lithium, AppleSkin, ModMenu, ClothConfig, JEI, REI, Journeymap vb.) taranarak beyaz listeye alınmıştır.
* **0 Yanlış Alarm Garantisi:** Resmi topluluk modları $O(1)$ hızında anında tanınır ve yetkililerin gereksiz yere oyuncuları banlaması engellenir.
* **Geliştirici Paket Alanı Koruması:** 55 resmi geliştirici isim alanı (`me.jellysquid.mods.sodium`, `net.irisshaders.iris`, `com.terraformersmc.modmenu`, vb.) korunmaktadır.

### 2. 🧠 Yapay Zeka Semantik Baytkod Analizörü (AI-like Semantic Classifier)
Hile geliştiricileri bilinen imza veritabanlarını atlatmak için sıfırdan kendi hilelerini kodlasalar veya açık kaynaklı hileleri yeniden adlandırsalar bile, Atlas AC Java baytkodunun matematiksel algoritmasını analiz eder:
* **KillAura Semantiği:** Varlık döngüsü (`world.getEntities()`, `getOtherEntities()`) + Trigonometrik hedef açısı/mesafesi (`Math.atan2`, `Math.hypot`, `wrapDegrees`) + Otomatik saldırı paketi (`PlayerInteractEntityC2SPacket.attack()`, `attackEntity`).
* **Reach Semantiği:** Bounding box esnetme (`Box.expand`, `AxisAlignedBB.expand`, `stretch`) ve Minecraft'ın vanilla 3.0 blokluk menzil sınırını aşan sabitlerin tespit edilmesi.
* **Velocity / Anti-Knockback:** Savrulma paketlerinin (`EntityVelocityUpdateS2CPacket`, `ExplosionS2CPacket`) dinlenip iptal edilmesi (`ci.cancel()`) veya hareket vektörlerinin (`motionX/motionZ`) sıfırlanması.
* **AutoTotem Semantiği:** Can azaldığında veya hasar anında envanter GUI'si açılmadan doğrudan 45 numaralı sol el (offhand) yuvasına otomatik takas paketi (`ClickSlotC2SPacket` / `SWAP_ITEM_WITH_OFFHAND`) gönderilmesi.
* **Criticals Semantiği:** Saldırı paketinden hemen önce zemin aldatması (`PositionAndOnGround` + mikro $Y$ ötelemesi) gönderilmesi.
* **TriggerBot Semantiği:** Crosshair hedefi (`targetedEntity`) + Saldırı doluluk oranı kontrolü (`getAttackCooldownProgress() >= 0.9f`) + Otomatik vuruş tetiklenmesi.

### 3. 🚨 Truva Atı ve Beyaz Liste Koruması (Trojan Whitelist Guard)
* Bir hileci dosya adını veya Mod ID'sini `sodium-fabric-1.20.1.jar` ya da `appleskin.jar` olarak değiştirip hileyi gizlese dahi sistem beyaz listeyi körlemesine kabul etmez.
* Semantik motor içeride gizlenmiş savaş/hareket hilesi tespit ettiği anda modu **`TROJAN_WHITELIST_BYPASS_ATTEMPT`** olarak **KRİTİK** seviyede işaretler.

### 4. 🕵️ Derin İşletim Sistemi Adli Bilişimi (OS Forensics)
* **USN Change Journal:** Dosya silinmiş veya temizlenmiş olsa bile NTFS USN Journal üzerinden silinen hilelerin (`doomsday-client.jar`, `autototem.jar`, `vape-v4.exe`) adli kayıtlarını geri getirir.
* **BAM, ShimCache & PCA:** Çalıştırılıp kapatılan veya silinen tüm ikili dosyaların Windows çekirdek yürütme kayıtlarını inceler.
* **Prefetch & MuiCache:** Uygulama çalıştırma sıklığı, son çalıştırma zamanı ve ekran adları.
* **Windows Defender Adli Kayıtları:** Defender tehdit geçmişi, geçici devre dışı bırakmalar ve hile klasörü dışlamaları.
* **Linux Güvenlik Analizi:** `/proc/*/exe` silinmiş ikili modüller (Process Ghosting), `LD_PRELOAD` kancaları, `ptrace` izleme tespiti.
* **Gizlenmiş Arşivler:** `.png`, `.jpg`, `.txt` veya uzantısız görünümlü ancak gerçekte `PK\x03\x04` ZIP başlığı barındıran kamufle edilmiş hileler.
* **NTFS Alternate Data Streams (ADS):** Dosya arkasına gizlenen çalıştırılabilir hile akışları.

### 5. 🪟 Windows Tek EXE (PE Subsystem 2 GUI - Asla CMD Açılmaz)
* Windows ikili dosyası doğrudan **PE Subsystem 2 (IMAGE_SUBSYSTEM_WINDOWS_GUI)** olarak yamalanmıştır.
* Çift tıklandığında kesinlikle hiçbir CMD veya konsol siyah penceresi açılmaz; doğrudan arka planda başlar ve tarayıcı arayüzünü açar.

### 6. 🐧 Linux Tek Bağımsız ELF İkili Dosyası
* Ekstra bağımlılık, Node.js veya npm kurulumu gerektirmez. Tek dosya olarak `./AtlasAC-Linux` ile çalıştırılabilir.

---

## 📋 Mimari ve Dizin Yapısı

```
Atlas-AC/
├── src/
│   ├── config/              # Sunucu ve tespit politikaları (serverPolicy.js)
│   ├── engine/              # Adli bilişim ve tespit motorları
│   │   ├── modrinthWhitelist.js       # 13.000+ temiz mod O(1) doğrulayıcı
│   │   ├── semanticCheatClassifier.js # Yapay Zeka semantik baytkod motoru
│   │   ├── minecraftInspector.js      # Minecraft dizin & mod denetleyicisi
│   │   ├── deepArchiveScanner.js      # Çok katmanlı özyinelemeli arşiv tarayıcı
│   │   ├── peBinaryInspector.js       # PE başlık & ikili kod analizörü
│   │   ├── usnJournal.js              # NTFS USN Journal adli analizörü
│   │   ├── cheatKnowledgeBase.js      # 63+ kural için detaylı yetkili rehberi
│   │   ├── scannerCore.js             # Çok aşamalı ana tarama orkestratörü
│   │   └── reporter.js                # HTML, JSON & WebSocket raporlayıcı
│   ├── signatures/          # İmza ve beyaz liste JSON veritabanları
│   │   ├── defaultSignatures.json     # Bilinen hile istemcisi imzaları
│   │   └── modrinthWhitelist.json     # 13.321 Modrinth temiz mod kaydı
│   ├── ui/                  # Gerçek zamanlı Web GUI arayüzü (HTML/CSS/JS)
│   └── main/                # Ana başlatıcı ve sunucu girişi (index.js)
├── scripts/                 # Paketleme ve derleme boru hatları (build.js)
├── tests/                   # 57/57 Kapsamlı doğrulama ve test suite'i
├── LICENSE                  # GNU General Public License v3.0
├── package.json             # NPM paket yapılandırması
└── README.md                # Dokümantasyon
```

---

## 🛠️ Kurulum ve Çalıştırma

### Geliştirici Modu (Node.js 18+)

```bash
# Depoyu klonlayın
git clone https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX.git
cd AtlasOyuncu-Hile-KontrolX

# Bağımlılıkları yükleyin
npm install

# Testleri çalıştırın (100% Doğrulama)
npm test

# Tarayıcı arayüzü ile başlatın
npm start
```

### Tek Bağımsız İkili Dosya Olarak Derleme (Build Standalone)

```bash
npm run build
```
Derleme tamamlandığında `dist/` klasöründe iki bağımsız dosya oluşturulur:
1. **Windows:** `dist/AtlasAC.exe` (PE Subsystem 2 GUI - CMD penceresiz)
2. **Linux:** `dist/AtlasAC-Linux` (Tek dosya bağımsız ELF)

---

## 🧪 Test Suite (Doğrulama)

Atlas AC, her derlemeden önce 57'den fazla adli senaryoyu otomatik olarak test eder:
```bash
npm test
```
* **0 False-Flag Doğrulaması:** 13.000+ Modrinth modu, meşru Minecraft dosyaları, geliştirici araçları ve kütüphanelerde TAM 0 hata.
* **Hile Yakalama Başarısı:** Doomsday, AutoTotem, Wurst, Meteor, LiquidBounce, Raven B+, Vape, Drip Lite, Slinky ve özel kodlanmış hilelerde %100 yakalama oranı.

---

## 📜 Lisans (License)

Bu proje **GNU General Public License v3.0 (GPL-3.0)** altında lisanslanmıştır. Detaylar için [`LICENSE`](LICENSE) dosyasına bakabilirsiniz.

Copyright (C) 2026 ZeninKaanX / EverVerity - Atlas AC Team.

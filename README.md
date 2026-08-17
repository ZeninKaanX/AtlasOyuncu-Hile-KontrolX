# AtlasOyuncu Hile Kontrol

Minecraft için gelişmiş bir hile / zararlı yazılım **screen-share** tarama aracı. JavaFX tabanlı grafik arayüzü ile JVM süreçlerini, modları, USB aygıtlarını, kayıt defterini, Prefetch ve USN Journal verilerini inceler.

> **Uyarı:** Bu araç yalnızca kendi sisteminizde ve yasal amaçlarla kullanılmalıdır.

## Kaynak

Bu proje [Mandarin-Tool](https://github.com/Mehmetyll/Mandarin-Tool) (MIT lisanslı, screen-share çoklu tarama aracı) temel alınarak geliştirilmiştir (skid). Orijinal geliştiricilere teşekkür ederiz:
- [amanaman](https://github.com/trSScommunity)
- [einfrieren](https://github.com/korkusuzadX)
- [boboa](https://github.com/Boboalover)

Discord: `mandalinasslee`

## Özellikler

- **JVM Taraması** — Şüpheli Java süreçlerini, `javaagent` / attach girişimlerini ve enjeksiyonları tespit eder
- **Mod Analizi** — `.jar` modlarını açar, obfuscation seviyesini ölçer, bilinen hile imzalarını arar
- **Sınıf / JAR Analizi** — Analiz edilen modlar üzerinde gelişmiş sınıf araması; CFR ile yerinde dekompilasyon ve hex önizleme
- **USN Journal Analizi** — NTFS USN Journal üzerinden dosya/değişiklik geçmişini filtreler
- **Prefetch Analizi** — Windows `Prefetch` (.pf) dosyalarından çalıştırılmış uygulama geçmişini çıkarır
- **USB Geçmişi** — Olay günlüğü (Partition/Diagnostic) ve kayıt defterinden USB bağlantı geçmişini listeler
- **Regedit Analizi** — Kalıcılık sağlayan şüpheli registry anahtarlarını tarar
- **Olay Günlüğü (EventLog)** — Windows olay günlüklerini filtreler ve gösterir
- **Çöp Kutusu (Recycle Bin)** — Silinen dosyaların meta verilerini inceler
- **Servisler** — Windows servislerini, durumlarını ve çalıştırılabilir yollarını sıralar
- **Son / CLI / PowerShell** — Son açılan dosyalar, komut satırı geçmişi ve PowerShell komut geçmişi analizi
- **Alt Checker** — Lunar, Feather, SKlauncher ve Vanilla istemci hesap ayarlarını derin tarar
- **Site Bypass Analizi** — Bypass teknikleri ve ilgili web etkinliğini inceler
- **Crash Dump Analizi** — Çökmüş programları ve dump dosyalarını inceler
- **Anti-VM** — Sanal makine ortamlarını tespit edip çalışmayı durdurur (hilecilerin VM ile tespitten kaçmasını önler)
- Çok dilli arayüz (TR / EN / PL / RU / ES / AZ) ve Atlantafx "Dracula" koyu teması

## Gereksinimler

- Java 21 veya üzeri (JDK 21+)
- Windows (uygulama `wevtutil`, `reg`, `wmic` gibi Windows araçlarını kullanır)

## Derleme

Bağımlılıklar Maven Central'dan otomatik indirilir.

```bash
# Yalnızca Windows için çalışır durumda çıktı üretir:
./build.sh win      # Windows çıktısı (Windows .dll yerel kütüphaneleriyle)

# Not: linux/mac bayrakları yalnızca JavaFX yerel kütüphanelerini değiştirir;
# uygulama mantığı Windows'a özeldir (JNA win32, wevtutil/reg/wmic, Prefetch,
# Çöp Kutusu, USBSTOR kayıt defteri). Bu yüzden Linux/macOS'ta ÇALIŞMAZ —
# yalnızca Linux üzerinde Wine ile çalıştırılabilir.
```

Çıktı: `AtlasHileKontrol.jar` (bağımlılıklarla birlikte tek jar, ~16 MB).

### Bağımlılıklar

| Kütüphane            | Sürüm  | Amaç                                     |
| -------------------- | ------ | ---------------------------------------- |
| OpenJFX              | 22.0.2 | GUI (JDK 21+ gerektirir)                 |
| JNA + jna-platform   | 5.15.0 | Windows API erişimi                      |
| CFR                  | 0.152  | Sınıf dosyası dekompilasyonu (önizleme)   |
| Atlantafx Base       | 2.1.0  | "Dracula" teması                         |

## Kullanım

Derlenmiş `AtlasHileKontrol.jar` ve opsiyonel `jre/` klasörü yan yana olmalıdır. `launchers/` klasöründe hazır başlatıcılar bulunur:

| Başlatıcı | Platform | Açıklama |
|---|---|---|
| `launchers/AtlasOyuncuHileKontrol.bat` | Windows | Ana başlatıcı — UAC ister, Java 21 varlığını kontrol eder, gerekirse kurar |
| `launchers/Baslat-Linux.sh` | Linux | Wine ile çalıştırır |

### Otomatik Java kurulumu

`AtlasOyuncuHileKontrol.bat` şu sırayla çalışır:

1. `jre/` klasöründe gömülü Java 21 varsa onu kullanır
2. Sistemde Java 21+ kuruluysa onu kullanır (`java -version` kontrolü)
3. Hiçbiri yoksa otomatik kurar: önce `winget` (Windows paket yöneticisi, Temurin 21), olmazsa Zulu JRE 21'i indirir

> **Not:** İnternetten indirilen `AtlasHileKontrol.jar` / `java.exe` için
> Özellikler → "Engellemeyi Kaldır" (Unblock) işaretini kaldırın.

## Yapı

```
AtlasOyuncu-Hile-Kontrol/
├── build.sh                     # Üç aşamalı derleme: indir → derle → paketle
├── sources.txt                  # Derleme sırası için kaynak dosya listesi
├── launchers/
│   ├── AtlasOyuncuHileKontrol.bat   # Windows ana başlatıcı (UAC + Java 21 kontrolü)
│   └── Baslat-Linux.sh              # Linux / Wine başlatıcı
├── src/
│   ├── AtlasHileKontrol.java    # Ana uygulama (JavaFX Application)
│   ├── AtlasLauncher.java       # Başlatıcı (Main-Class, AtlasLauncher)
│   ├── AtlasHileKontrol.bat     # Basit Windows başlatıcı (UAC, gömülü JRE'siz)
│   ├── assets/                  # Kaynaklar
│   │   ├── Bundle_{tr,en,pl,ru,es,az}.properties  # Dil dosyaları
│   │   ├── style.css            # Arayüz stilleri
│   │   └── icon.png             # Uygulama ikonu
│   ├── a/a/a/                   # Obfuscation / string şifreleme yardımcıları
│   ├── b/                       # Analiz modülleri ve rapor modelleri (ModReport)
│   ├── c/ d/ e/                 # Arayüz ve analiz modülleri (sekmeler, Bundle işleme)
│   ├── scanner/                 # Tarama motorları (FindJVM, ModAnalyzer, ModSignatures,
│   │                            # PrefetchParser, USN, Discord/hesap izi tarayıcı, vb.)
│   └── util/                    # Yardımcı sınıflar (WinNative, ProcessMemoryScanner,
│                                # SignatureChecker, I18n, anti-VM)
```

`src/assets/` altındaki `Bundle_*.properties` dosyaları arayüzün dil paketleridir; `footer.madeBy` satırı alt bilgide görünür.

## Lisans

Bu proje kronik olarak [Mandarin-Tool](https://github.com/Mehmetyll/Mandarin-Tool) kaynak kodundan türetilmiştir. Orijinal proje MIT lisansıyla dağıtılmaktadır.
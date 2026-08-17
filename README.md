# AtlasOyuncu Hile Kontrol

Minecraft için gelişmiş bir hile / zararlı yazılım tarama aracı. JavaFX tabanlı grafik arayüzü ile JVM süreçlerini, modları, USB aygıtlarını, kayıt defterini ve sistem servislerini tarar.

> **Uyarı:** Bu araç yalnızca kendi sisteminizde ve yasal amaçlarla kullanılmalıdır.

## Özellikler

- **JVM Taraması** — Şüpheli Java süreçlerini, `javaagent` / attach girişimlerini ve enjeksiyonları tespit eder
- **Mod Analizi** — `.jar` modlarını açar, obfuscation seviyesini ölçer, bilinen hile imzalarını arar
- **USB Analizi** — Bağlı USB aygıtlarının geçmişini (VID/PID, seri no, dosya sistemi) listeler
- **Çöp Kutusu (Recycle Bin)** — Silinen dosyaların meta verilerini inceler
- **Kayıt Defteri** — Kalıcılık sağlayan şüpheli registry anahtarlarını tarar
- **Prefetch** — `Prefetch` dosyalarından çalıştırılmış uygulama geçmişini çıkarır
- **Discord / Minecraft hesap izleri** — Hesap dosyalarında kalan kimlik izlerini bulur
- **JAR önizleme** — CFR kullanarak sınıf dosyalarını yerinde dekompile eder
- **Anti-VM** — Sanal makine ortamlarını tespit edip çalışmayı durdurur (hilecilerin VM kullanarak tespitten kaçmasını önler)
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

Çıktı: `AtlasHileKontrol.jar` (bağımlılıklarla birlikte tek jar).

### Bağımlılıklar

| Kütüphane            | Sürüm  | Amaç                                  |
| -------------------- | ------ | ------------------------------------- |
| OpenJFX              | 22.0.2 | GUI                                   |
| JNA + jna-platform   | 5.15.0 | Windows API erişimi                   |
| CFR                  | 0.152  | Sınıf dosyası dekompilasyonu (önizleme) |
| Atlantafx Base       | 2.1.0  | "Dracula" teması                      |

## Kullanım

Derlenmiş `AtlasHileKontrol.jar` ve `jre/` klasörü yan yana olmalıdır. `launchers/` klasöründe hazır başlatıcılar bulunur:

| Başlatıcı | Platform | Açıklama |
|---|---|---|
| `launchers/AtlasOyuncuHileKontrol.bat` | Windows | Ana başlatıcı — Java sürümünü kontrol eder, gerekirse kurar |
| `launchers/Baslat-Linux.sh` | Linux | Wine ile çalıştırır |

### Otomatik Java kurulumu

`AtlasOyuncuHileKontrol.bat` şu sırayla çalışır:

1. `jre/` klasöründe gömülü Java 21 varsa onu kullanır
2. Sistemde Java 21+ kuruluysa onu kullanır (`java -version` kontrolü)
3. Hiçbiri yoksa otomatik kurar: önce `winget` (Windows paket yöneticisi), olmazsa Zulu JRE 21'i indirir

> **Not:** İnternetten indirilen `AtlasHileKontrol.jar` / `java.exe` için
> Özellikler → "Engellemeyi Kaldır" (Unblock) işaretini kaldırın.

## Yapı

```
src/
├── AtlasHileKontrol.java    # Ana uygulama (JavaFX Application)
├── AtlasLauncher.java       # Başlatıcı (Main-Class)
├── AtlasHileKontrol.bat     # Windows yönetici başlatıcı
├── assets/                  # Kaynaklar (dil dosyaları, stil, ikon)
├── a/  b/  c/  d/  e/       # Arayüz ve analiz modülleri
├── scanner/                 # Tarama motorları
└── util/                    # Yardımcı sınıflar
launchers/                   # Hazır çalıştırma betikleri
```



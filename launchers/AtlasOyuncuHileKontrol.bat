@echo off
setlocal EnableDelayedExpansion
title Atlasoyuncu Hile Kontrol
cd /d "%~dp0"

rem ===== Yonetici hakki =====
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Yonetici hakki gerekli, UAC aciliyor...
    powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)

echo [OK] Yonetici hakkiyla calisiyor.
echo.

rem ===== Proje dizini =====
rem %~dp0 zaten dogru calisir, sadece son \ temizle
set "BASE=%~dp0"
if "%BASE:~-1%"=="\" set "BASE=%BASE:~0,-1%"

rem Yol parantez iceriyorsa PowerShell icin environment variable kullan
set "BASE_DIR=%BASE%"

rem ===== JRE kontrol =====
set "JAVA="
set "JAVA_VER=0"

rem 1) Gomulu JRE
if exist "%BASE%\jre\bin\java.exe" (
    set "JAVA=%BASE%\jre\bin\java.exe"
    goto :checkVer
)

rem 2) Sistemdeki java
where java >nul 2>&1
if %errorlevel% equ 0 (
    set "JAVA=java"
    goto :checkVer
)

rem 3) Java kurulumu
echo Java bulunamadi. Kuruluyor...
goto :installJava

:checkVer
rem Java surumunu kontrol et
for /f "tokens=3" %%v in ('"%JAVA%" -version 2^>^&1 ^| findstr /i "version"') do set "JAVA_VER_RAW=%%~v"
set "JAVA_VER_RAW=!JAVA_VER_RAW:"=!"
for /f "tokens=1 delims=." %%a in ("!JAVA_VER_RAW!") do set "JAVA_MAJOR=%%a"
if "!JAVA_MAJOR!"=="1" (
    for /f "tokens=2 delims=." %%b in ("!JAVA_VER_RAW!") do set "JAVA_MAJOR=%%b"
)

echo Bulunan Java surumu: !JAVA_VER_RAW! (major: !JAVA_MAJOR!)

if !JAVA_MAJOR! GEQ 21 goto :run

echo.
echo [HATA] Java 21+ gerekli, !JAVA_MAJOR! bulundu.
echo Java 21+ yukleniyor...
goto :installJava

rem ===== Uygulamayi calistir =====
:run
echo.
echo Moduller: %BASE%\mods
echo JAR: %BASE%\AtlasHileKontrol.jar
echo.

if not exist "%BASE%\mods\javafx-controls-win.jar" (
    echo [HATA] mods\javafx-controls-win.jar bulunamadi!
    echo Lutfen mods klasorunun oldugundan emin olun.
    pause
    exit /b 1
)

if not exist "%BASE%\AtlasHileKontrol.jar" (
    echo [HATA] AtlasHileKontrol.jar bulunamadi!
    pause
    exit /b 1
)

echo Baslatiliyor...
"%JAVA%" --module-path "%BASE%\mods" --add-modules javafx.controls,javafx.swing -cp "%BASE%\AtlasHileKontrol.jar" AtlasLauncher
if errorlevel 1 (
    echo.
    echo Uygulama hatayla kapandi. (hata kodu: %errorlevel%)
)
pause
exit /b

rem ===== Java 21 kurulumu =====
:installJava
echo.
echo Java 21+ bulunamadi, kuruluyor...
echo.

rem === Yontem 1: winget (Windows 10 1809+ / Windows 11) ===
echo [1/3] winget deneniyor...
where winget >nul 2>&1
if !errorlevel! equ 0 (
    echo   winget bulundu, Eclipse Temurin JRE 21 kuruluyor...
    winget install EclipseAdoptium.Temurin.21.JRE --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Java 21 winget ile kuruldu!
        goto :verifyJava
    )
    echo   [!] winget kurulumu basarisiz
) else (
    echo   [!] winget bulunamadi (Windows 10 1809+ veya Windows 11 gerekli)
)

rem === Yontem 2: Zulu JRE 21 indir (ZIP) ===
echo [2/3] Zulu JRE 21 indiriliyor (49 MB)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$url='https://cdn.azul.com/zulu/bin/zulu21.52.203-ca-jre21.0.14-win_x64.zip';" ^
  "$zip=Join-Path $env:TEMP 'zulu21_jre.zip';" ^
  "Write-Host '  Indiriliyor...';" ^
  "try {" ^
  "  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 300;" ^
  "  Write-Host '  Indirme tamamlandi.';" ^
  "  $extract=Join-Path $env:TEMP 'zulu21_extract';" ^
  "  if(Test-Path $extract){Remove-Item $extract -Recurse -Force};" ^
  "  Write-Host '  Aciliyor...';" ^
  "  Expand-Archive -Path $zip -DestinationPath $extract -Force;" ^
  "  $src=(Get-ChildItem $extract -Directory | Select-Object -First 1).FullName;" ^
  "  if(!$src){throw 'Klasor bulunamadi'};" ^
  "  $dest=$env:BASE_DIR+'\jre';" ^
  "  New-Item -ItemType Directory -Force $dest | Out-Null;" ^
  "  Copy-Item (Join-Path $src '*') $dest -Recurse -Force;" ^
  "  Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "  Remove-Item $zip -Force -ErrorAction SilentlyContinue;" ^
  "  Write-Host '  Kurulum tamamlandi.';" ^
  "} catch {" ^
  "  Write-Host '  HATA:' $_.Exception.Message;" ^
  "  exit 1;" ^
  "}"

if exist "%BASE%\jre\bin\java.exe" (
    echo [OK] Java 21 indirildi: %BASE%\jre
    goto :verifyJava
)

rem === Yontem 3: Adoptium/Temurin 21 MSI indir ===
echo [3/3] Adoptium/Temurin 21 indiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "try {" ^
  "  Write-Host '  Adoptium API sorgulanıyor...';" ^
  "  $api='https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64^&image_type=jre^&os=windows^&page=0^&page_size=1^&vendor=eclipse';" ^
  "  $resp=Invoke-RestMethod -Uri $api -UseBasicParsing -TimeoutSec 30;" ^
  "  $msiUrl=$resp[0].binary.installer.link;" ^
  "  if(!$msiUrl){$msiUrl=$resp[0].binary.package.link;};" ^
  "  if(!$msiUrl){throw 'Download URL bulunamadi'};" ^
  "  Write-Host '  MSI indiriliyor...';" ^
  "  $msi=Join-Path $env:TEMP 'temurin21.msi';" ^
  "  Invoke-WebRequest -Uri $msiUrl -OutFile $msi -UseBasicParsing -TimeoutSec 300;" ^
  "  Write-Host '  MSI kuruluyor (sessiz, 1-2 dk)...';" ^
  "  $p=Start-Process msiexec.exe -ArgumentList '/i',\"$msi\",'/quiet','/norestart','ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome' -Wait -PassThru;" ^
  "  Remove-Item $msi -Force -ErrorAction SilentlyContinue;" ^
  "  if($p.ExitCode -ne 0){throw 'MSI kurulumu basarisiz: '+$p.ExitCode};" ^
  "  Write-Host '  Kurulum tamamlandi.';" ^
  "} catch {" ^
  "  Write-Host '  HATA:' $_.Exception.Message;" ^
  "  exit 1;" ^
  "}"

goto :verifyJava

:verifyJava
echo.
echo Java kuruldu, dogrulaniyor...

rem Gomulu JRE varsa onu kullan
if exist "%BASE%\jre\bin\java.exe" (
    set "JAVA=%BASE%\jre\bin\java.exe"
    goto :checkVer
)

rem PATH'i yenile ve tekrar kontrol et
set "PATH=%PATH%;%ProgramFiles%\Zulu\zulu-21-jre\bin;%ProgramFiles%\Eclipse Adoptium\jdk-21*"
where java >nul 2>&1
if !errorlevel! equ 0 (
    set "JAVA=java"
    goto :checkVer
)

rem JAVA_HOME kontrol
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        set "JAVA=%JAVA_HOME%\bin\java.exe"
        goto :checkVer
    )
)

echo.
echo [HATA] Java kuruldu ama hala bulunamadi.
echo.
echo Manuel olarak indirin:
echo   https://adoptium.net/temurin/releases/?version=21
echo.
echo Indirdikten sonra:
echo   1. JRE klasorunu bu dizine `jre` olarak kopyalayin, VEYA
echo   2. JAVA_HOME ortam degiskenini ayarlayin, VEYA
echo   3. java.exe'nin bulundugu dizini PATH'e ekleyin
echo.
pause
exit /b 1

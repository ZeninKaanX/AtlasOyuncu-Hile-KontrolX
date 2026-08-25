@echo off
setlocal EnableDelayedExpansion
title Atlasoyuncu Hile Kontrol

rem ===== Proje dizini (admin-oncesi) =====
cd /d "%~dp0"
set "BASE=%~dp0"
if "%BASE:~-1%"=="\" set "BASE=%BASE:~0,-1%"
set "BASE_DIR=%BASE%"

rem ===== Yonetici hakki =====
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Yonetici hakki gerekli, UAC aciliyor...
    powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)
echo [OK] Yonetici hakkiyla calisiyor.
echo.

rem ===== JRE kontrol =====
set "JAVA="

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

rem 3) Java kurulumu gerekli
echo Java bulunamadi, kuruluyor...
goto :installJava

rem ===== Java surum kontrol =====
:checkVer
echo Java test ediliyor: "!JAVA!"

rem HATA: 2>&1 yonunu dosyaya yaz, pipe kullanma
"!JAVA!" -version > "%TEMP%\atlas_jver.txt" 2>&1

rem Dosya bos mu?
for %%F in ("%TEMP%\atlas_jver.txt") do if %%~zF==0 (
    echo [HATA] Java calistirilamiyor - cikti bos
    dir "%BASE%\jre\bin\java.exe" 2>nul
    goto :installJava
)

rem Versiyon dosyasini goster
echo   ---
type "%TEMP%\atlas_jver.txt"
echo   ---

rem Surumu dosyadan oku (token 3 = "21.0.14" seklinde)
set "JAVA_MAJOR=0"
for /f "usebackq tokens=3" %%q in ("%TEMP%\atlas_jver.txt") do (
    if !JAVA_MAJOR! equ 0 (
        set "VER=%%~q"
        rem Tırnak işaretlerini temizle
        set "VER=!VER:"=!"
        rem Major version al
        for /f "tokens=1 delims=." %%a in ("!VER!") do (
            set /a "JAVA_MAJOR=%%a" 2>nul
        )
    )
)

if !JAVA_MAJOR! equ 0 (
    echo [HATA] Java surumu alinamadi
    echo   Ham cikti yukarida goruldu
    goto :installJava
)

echo Bulunan Java major: !JAVA_MAJOR!

if !JAVA_MAJOR! GEQ 21 goto :run

echo [HATA] Java 21+ gerekli, !JAVA_MAJOR! bulundu.
goto :installJava

rem ===== Uygulamayi calistir =====
:run
echo.
if not exist "%BASE%\mods\javafx-controls-win.jar" (
    echo [HATA] mods\javafx-controls-win.jar bulunamadi!
    pause
    exit /b 1
)
if not exist "%BASE%\AtlasHileKontrol.jar" (
    echo [HATA] AtlasHileKontrol.jar bulunamadi!
    pause
    exit /b 1
)

echo Baslatiliyor...
"!JAVA!" --module-path "%BASE%\mods" --add-modules javafx.controls,javafx.swing -cp "%BASE%\AtlasHileKontrol.jar" AtlasLauncher
if errorlevel 1 (
    echo.
    echo Uygulama hatayla kapandi.
)
pause
exit /b

rem ===== Java 21 kurulumu =====
:installJava
echo.
echo Java 21+ kuruluyor...
echo.

rem === Yontem 1: winget ===
echo [1/3] winget deneniyor...
where winget >nul 2>&1
if !errorlevel! equ 0 (
    echo   Eclipse Temurin JRE 21 kuruluyor...
    winget install EclipseAdoptium.Temurin.21.JRE --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Java 21 kuruldu!
        goto :refreshAndVerify
    )
    echo   [!] winget basarisiz
) else (
    echo   [!] winget bulunamadi
)

rem === Yontem 2: Zulu JRE 21 ZIP ===
echo [2/3] Zulu JRE 21 indiriliyor (49 MB)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$url='https://cdn.azul.com/zulu/bin/zulu21.52.203-ca-jre21.0.14-win_x64.zip';" ^
  "$zip=Join-Path $env:TEMP 'zulu21_jre.zip';" ^
  "Write-Host '  Indiriliyor...';" ^
  "Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 300;" ^
  "Write-Host '  Indirme tamamlandi.';" ^
  "$extract=Join-Path $env:TEMP 'zulu21_extract';" ^
  "if(Test-Path $extract){Remove-Item $extract -Recurse -Force};" ^
  "Write-Host '  Aciliyor...';" ^
  "Expand-Archive -Path $zip -DestinationPath $extract -Force;" ^
  "$src=(Get-ChildItem $extract -Directory | Select-Object -First 1).FullName;" ^
  "if(!$src){throw 'Klasor bulunamadi'};" ^
  "$dest=$env:BASE_DIR+'\jre';" ^
  "New-Item -ItemType Directory -Force $dest | Out-Null;" ^
  "Copy-Item (Join-Path $src '*') $dest -Recurse -Force;" ^
  "Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "Remove-Item $zip -Force -ErrorAction SilentlyContinue;" ^
  "Write-Host '  Kurulum tamamlandi.'"

if exist "%BASE%\jre\bin\java.exe" (
    echo [OK] Java 21 indirildi
    set "JAVA=%BASE%\jre\bin\java.exe"
    goto :checkVer
)

rem === Yontem 3: Adoptium MSI ===
echo [3/3] Adoptium/Temurin 21 indiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "try {" ^
  "  $api='https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64^&image_type=jre^&os=windows^&page=0^&page_size=1^&vendor=eclipse';" ^
  "  $resp=Invoke-RestMethod -Uri $api -UseBasicParsing -TimeoutSec 30;" ^
  "  $msiUrl=$resp[0].binary.installer.link;" ^
  "  if(!$msiUrl){$msiUrl=$resp[0].binary.package.link;};" ^
  "  Write-Host '  MSI indiriliyor...';" ^
  "  $msi=Join-Path $env:TEMP 'temurin21.msi';" ^
  "  Invoke-WebRequest -Uri $msiUrl -OutFile $msi -UseBasicParsing -TimeoutSec 300;" ^
  "  Write-Host '  Kuruluyor (1-2 dk)...';" ^
  "  $p=Start-Process msiexec.exe -ArgumentList '/i',\"$msi\",'/quiet','/norestart','ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome' -Wait -PassThru;" ^
  "  Remove-Item $msi -Force -ErrorAction SilentlyContinue;" ^
  "  if($p.ExitCode -ne 0){throw 'MSI hata: '+$p.ExitCode};" ^
  "  Write-Host '  Tamamlandi.';" ^
  "} catch {" ^
  "  Write-Host '  HATA:' $_.Exception.Message;" ^
  "}"

goto :refreshAndVerify

:refreshAndVerify
echo.
echo Java dogrulaniyor...

rem PATH'i yenile
for /f "delims=" %%i in ('powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH','User')"') do set "NEWPATH=%%i"

rem Gomulu JRE
if exist "%BASE%\jre\bin\java.exe" (
    set "JAVA=%BASE%\jre\bin\java.exe"
    goto :checkVer
)

rem JAVA_HOME
if defined JAVA_HOME (
    if exist "!JAVA_HOME!\bin\java.exe" (
        set "JAVA=!JAVA_HOME!\bin\java.exe"
        goto :checkVer
    )
)

rem PATH'te java ara
set "PATH=%NEWPATH%"
where java >nul 2>&1
if !errorlevel! equ 0 (
    set "JAVA=java"
    goto :checkVer
)

rem Zulu varsayilan konum
if exist "%ProgramFiles%\Zulu\zulu-21-jre\bin\java.exe" (
    set "JAVA=%ProgramFiles%\Zulu\zulu-21-jre\bin\java.exe"
    goto :checkVer
)

echo.
echo [HATA] Java kuruldu ama hala bulunamadi.
echo.
echo Manuel indirin: https://adoptium.net/temurin/releases/?version=21
pause
exit /b 1

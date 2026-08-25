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
set "BASE=%~dp0"
rem Son \ kaldir
if "%BASE:~-1%"=="\" set "BASE=%BASE:~0,-1%"

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
echo 1. deneme: winget ile kurulum...
winget install EclipseAdoptium.Temurin.21.JRE --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
if %errorlevel% equ 0 (
    echo Java 21 kuruldu!
    echo.
    echo Yeniden baslatiliyor...
    set "JAVA=%BASE%\jre\bin\java.exe"
    if exist "!JAVA!" goto :checkVer
    set "JAVA=java"
    where java >nul 2>&1
    if %errorlevel% equ 0 goto :checkVer
    echo Java kuruldu ama bulunamadi. Pencereyi kapatip bat'i tekrar calistirin.
    pause
    exit /b 0
)

echo 2. deneme: Zulu JRE 21 indiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$u='https://cdn.azul.com/zulu/bin/zulu21.52.15-ca-jre21.0.12-win_x64.zip';" ^
  "$z=Join-Path $env:TEMP 'zulu21_jre.zip';" ^
  "Invoke-WebRequest -Uri $u -OutFile $z -UseBasicParsing;" ^
  "$d=Join-Path $env:TEMP 'zulu21_extract';" ^
  "if(Test-Path $d){Remove-Item $d -Recurse -Force};" ^
  "Expand-Archive -Path $z -DestinationPath $d -Force;" ^
  "$s=(Get-ChildItem $d -Directory | Select-Object -First 1).FullName;" ^
  "New-Item -ItemType Directory -Force '%BASE%\jre' | Out-Null;" ^
  "Copy-Item (Join-Path $s '*') '%BASE%\jre' -Recurse -Force;" ^
  "Remove-Item $d -Recurse -Force;" ^
  "Remove-Item $z -Force;"

if exist "%BASE%\jre\bin\java.exe" (
    set "JAVA=%BASE%\jre\bin\java.exe"
    echo Java 21 indirildi: %BASE%\jre
    goto :checkVer
)

echo.
echo [HATA] Java kurulamadi!
echo Manuel olarak indirin: https://adoptium.net/temurin/releases/?version=21
pause
exit /b 1

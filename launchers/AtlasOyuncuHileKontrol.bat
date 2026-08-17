@echo off
setlocal EnableDelayedExpansion
title Atlasoyuncu Hile Kontrol
cd /d "%~dp0"

set "JAVA=%~dp0jre\bin\java.exe"

rem 1) Gomulu JRE (Java 17) hazir mi?
if exist "%JAVA%" goto :run

rem 2) Sistemde Java 17+ var mi?
call :findSystemJava
if defined JAVA goto :run

rem 3) Java 17+ yok -> otomatik kur
echo Java 17+ bulunamadi. Otomatik kuruluyor...
call :installJava
if not defined JAVA if exist "%~dp0jre\bin\java.exe" set "JAVA=%~dp0jre\bin\java.exe"
if not defined JAVA (
    echo.
    echo Java kurulamadi. Lutfen https://adoptium.net adresinden Java 17 indirin.
    pause
    exit /b 1
)

:run
echo Baslatiliyor...
"%JAVA%" -jar "%~dp0AtlasHileKontrol.jar"
if errorlevel 1 (
    echo.
    echo Uygulama hatayla kapandi.
)
pause
exit /b

rem ============ Sistemdeki Java surumunu kontrol et ============
:findSystemJava
set "JAVA="
where java >nul 2>&1
if errorlevel 1 exit /b 0

set "VER="
for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do set "VER=%%~v"
if not defined VER exit /b 0

set "MAJOR="
for /f "tokens=1 delims=." %%a in ("!VER!") do set "MAJOR=%%a"
if "!MAJOR!"=="1" for /f "tokens=2 delims=." %%b in ("!VER!") do set "MAJOR=%%b"

if !MAJOR! GEQ 17 set "JAVA=java"
exit /b 0

rem ============ Java 17 kur ============
:installJava
rem 1) winget (Windows paket yoneticisi, Defender dostu)
winget install EclipseAdoptium.Temurin.17.JRE --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
if not errorlevel 1 (
    echo Java kuruldu. Lutfen bu pencereyi kapatip bat'i tekrar calistirin.
    pause
    exit /b 0
)

rem 2) winget yoksa Zulu JRE 17'yi klasore indir (hemen kullanilabilir)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; $u='https://cdn.azul.com/zulu/bin/zulu17.68.17-ca-jre17.0.20-win_x64.zip'; $z=Join-Path $env:TEMP 'zulu17_jre.zip'; Invoke-WebRequest -Uri $u -OutFile $z; $d=Join-Path $env:TEMP 'zulu17_extract'; if(Test-Path $d){Remove-Item $d -Recurse -Force}; Expand-Archive -Path $z -DestinationPath $d -Force; $s=(Get-ChildItem $d -Directory | Select-Object -First 1).FullName; New-Item -ItemType Directory -Force '%~dp0jre' | Out-Null; Copy-Item (Join-Path $s '*') '%~dp0jre' -Recurse -Force; Remove-Item $d -Recurse -Force; Remove-Item $z -Force;"
if exist "%~dp0jre\bin\java.exe" set "JAVA=%~dp0jre\bin\java.exe"
exit /b 0

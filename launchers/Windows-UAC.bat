@echo off
title Atlasoyuncu Hile Kontrol
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Yonetici hakki gerekli, UAC aciliyor...
    powershell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)

echo [OK] Yonetici hakkiyla calisiyor.
echo.
java -jar "%~dp0AtlasHileKontrol.jar"
pause

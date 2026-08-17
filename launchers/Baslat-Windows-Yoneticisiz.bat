@echo off
setlocal
title Atlasoyuncu Hile Kontrol
cd /d "%~dp0"

set "JAVA=%~dp0jre\bin\java.exe"

if not exist "%JAVA%" (
    echo Java 17+ bulunamadi, otomatik indiriliyor (bir kereye mahsus)...
    call :installjre
    set "JAVA=%~dp0jre\bin\java.exe"
)

echo Baslatiliyor...
"%JAVA%" -jar "%~dp0AtlasHileKontrol.jar" 2>"%~dp0hata.log"

if errorlevel 1 (
    echo.
    echo HATA: Uygulama baslatilamadi. Detay "hata.log" dosyasinda.
    echo.
    type "%~dp0hata.log" 2>nul
    echo.
)
pause
exit /b

:installjre
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; $u='https://cdn.azul.com/zulu/bin/zulu17.68.17-ca-jre17.0.20-win_x64.zip'; $z=Join-Path $env:TEMP 'zulu17_jre.zip'; Write-Host 'Zulu JRE 17 indiriliyor...'; Invoke-WebRequest -Uri $u -OutFile $z; $d=Join-Path $env:TEMP 'zulu17_extract'; if(Test-Path $d){Remove-Item $d -Recurse -Force}; Expand-Archive -Path $z -DestinationPath $d -Force; $s=(Get-ChildItem $d -Directory | Select-Object -First 1).FullName; New-Item -ItemType Directory -Force '%~dp0jre' | Out-Null; Copy-Item (Join-Path $s '*') '%~dp0jre' -Recurse -Force; Remove-Item $d -Recurse -Force; Remove-Item $z -Force; Write-Host 'Java hazir.'"
exit /b

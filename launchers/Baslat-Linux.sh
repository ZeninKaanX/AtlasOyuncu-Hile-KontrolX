#!/bin/bash
# Linux / Wine başlatıcı — UAC gerektirmez
# Kullanım: ./Baslat-Linux.sh
cd "$(dirname "$0")"
export WINEDEBUG=-all
wine jre/bin/java.exe -jar AtlasHileKontrol.jar

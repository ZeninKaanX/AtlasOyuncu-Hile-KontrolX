#!/usr/bin/env bash
set -euo pipefail

# Hedef platform: linux | win | mac
PLATFORM="${1:-linux}"

JFX_VER="22.0.2"
JNA_VER="5.15.0"
CFR_VER="0.152"
ATLANTAFX_VER="2.1.0"
MAVEN="https://repo1.maven.org/maven2"

DIR="$(cd "$(dirname "$0")" && pwd)"
LIBS="$DIR/lib"
OUT="$DIR/out"
STAGE="$DIR/staging"

mkdir -p "$LIBS" "$OUT"

echo "[1/4] Bağımlılıklar indiriliyor (platform: $PLATFORM)..."

dl() {
  local url="$1" out="$2"
  if [ ! -f "$out" ]; then
    echo "  -> $out"
    curl -sSL -o "$out" "$url"
  fi
}

for m in base controls graphics swing; do
  dl "$MAVEN/org/openjfx/javafx-$m/$JFX_VER/javafx-$m-$JFX_VER-$PLATFORM.jar" "$LIBS/javafx-$m.jar"
done
dl "$MAVEN/net/java/dev/jna/jna/$JNA_VER/jna-$JNA_VER.jar"                     "$LIBS/jna.jar"
dl "$MAVEN/net/java/dev/jna/jna-platform/$JNA_VER/jna-platform-$JNA_VER.jar" "$LIBS/jna-platform.jar"
dl "$MAVEN/org/benf/cfr/$CFR_VER/cfr-$CFR_VER.jar"                             "$LIBS/cfr.jar"
dl "$MAVEN/io/github/mkpaz/atlantafx-base/$ATLANTAFX_VER/atlantafx-base-$ATLANTAFX_VER.jar" "$LIBS/atlantafx.jar"

CP="$LIBS/javafx-base.jar:$LIBS/javafx-controls.jar:$LIBS/javafx-graphics.jar:$LIBS/javafx-swing.jar:$LIBS/jna.jar:$LIBS/jna-platform.jar:$LIBS/cfr.jar"

echo "[2/4] Derleniyor..."
rm -rf "$OUT"
mkdir -p "$OUT"
find src -name '*.java' | sort > "$DIR/sources.tmp"
javac -encoding UTF-8 -cp "$CP" -d "$OUT" @"$DIR/sources.tmp"

echo "[3/4] Paketleniyor..."
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -r "$OUT"/* "$STAGE/"
cp -r src/assets "$STAGE/assets"

for j in "$LIBS"/*.jar; do
  ( cd "$STAGE" && unzip -oq "$j" \
      -x 'META-INF/*.SF' 'META-INF/*.RSA' 'META-INF/*.DSA' 'META-INF/MANIFEST.MF' 'module-info.class' )
done
find "$STAGE" -name 'module-info.class' -delete

printf 'Manifest-Version: 1.0\nMain-Class: AtlasLauncher\nCreated-By: AtlasOyuncu\n\n' > "$DIR/MANIFEST.MF"
jar cfm "$DIR/AtlasHileKontrol.jar" "$DIR/MANIFEST.MF" -C "$STAGE" .

echo "[4/4] Tamamlandı: $DIR/AtlasHileKontrol.jar"

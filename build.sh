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
MODS="$DIR/mods"

mkdir -p "$LIBS" "$OUT"

echo "[1/5] Bağımlılıklar indiriliyor (platform: $PLATFORM)..."

dl() {
  local url="$1" out="$2"
  if [ ! -f "$out" ]; then
    echo "  -> $out"
    curl -sSL -o "$out" "$url"
  fi
}

# JavaFX jars: platform-özgü, module-path'te kullanılacak
for m in base controls graphics swing; do
  dl "$MAVEN/org/openjfx/javafx-$m/$JFX_VER/javafx-$m-$JFX_VER-$PLATFORM.jar" "$LIBS/javafx-$m-$PLATFORM.jar"
done
# Bağımlılıklar: fat JAR'a pack edilecek
dl "$MAVEN/net/java/dev/jna/jna/$JNA_VER/jna-$JNA_VER.jar"                     "$LIBS/jna.jar"
dl "$MAVEN/net/java/dev/jna/jna-platform/$JNA_VER/jna-platform-$JNA_VER.jar"    "$LIBS/jna-platform.jar"
dl "$MAVEN/org/benf/cfr/$CFR_VER/cfr-$CFR_VER.jar"                              "$LIBS/cfr.jar"
dl "$MAVEN/io/github/mkpaz/atlantafx-base/$ATLANTAFX_VER/atlantafx-base-$ATLANTAFX_VER.jar" "$LIBS/atlantafx.jar"
dl "$MAVEN/org/xerial/sqlite-jdbc/3.49.1.0/sqlite-jdbc-3.49.1.0.jar"           "$LIBS/sqlite-jdbc.jar"

# Derleme classpath: her şey dahil
CP="$LIBS/javafx-base-$PLATFORM.jar:$LIBS/javafx-controls-$PLATFORM.jar:$LIBS/javafx-graphics-$PLATFORM.jar:$LIBS/javafx-swing-$PLATFORM.jar:$LIBS/jna.jar:$LIBS/jna-platform.jar:$LIBS/cfr.jar:$LIBS/sqlite-jdbc.jar:$LIBS/atlantafx.jar"

echo "[2/5] Derleniyor..."
rm -rf "$OUT"
mkdir -p "$OUT"
find src -name '*.java' | sort > "$DIR/sources.tmp"
javac -encoding UTF-8 --release 21 -cp "$CP" -d "$OUT" @"$DIR/sources.tmp"

echo "[3/5] Uygulama JAR paketleniyor..."
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -r "$OUT"/* "$STAGE/"
cp -r src/assets "$STAGE/assets"

# Sadece bağımlılıkları pack et (JavaFX HARİÇ - module-path'te olacak)
for j in "$LIBS"/jna.jar "$LIBS"/jna-platform.jar "$LIBS"/cfr.jar "$LIBS"/atlantafx.jar "$LIBS"/sqlite-jdbc.jar; do
  ( cd "$STAGE" && unzip -oq "$j" \
      -x 'META-INF/*.SF' 'META-INF/*.RSA' 'META-INF/*.DSA' 'META-INF/MANIFEST.MF' 'module-info.class' )
done
find "$STAGE" -name 'module-info.class' -delete

printf 'Manifest-Version: 1.0\nMain-Class: AtlasLauncher\nCreated-By: AtlasOyuncu\n\n' > "$DIR/MANIFEST.MF"
jar cfm "$DIR/AtlasHileKontrol.jar" "$DIR/MANIFEST.MF" -C "$STAGE" .

echo "[4/5] JavaFX modülleri kopyalanıyor..."
rm -rf "$MODS"
mkdir -p "$MODS"
for m in base controls graphics swing; do
  cp "$LIBS/javafx-$m-$PLATFORM.jar" "$MODS/"
done

echo "[5/5] Tamamlandı!"
echo "  JAR:   $DIR/AtlasHileKontrol.jar"
echo "  Mods:  $DIR/mods/"
echo ""
echo "Calistirma ornegi (linux):"
echo "  java --module-path mods/ --add-modules javafx.controls,javafx.swing -cp AtlasHileKontrol.jar AtlasLauncher"
echo ""
echo "Calistirma ornegi (windows):"
echo '  java --module-path mods\ --add-modules javafx.controls,javafx.swing -cp AtlasHileKontrol.jar AtlasLauncher'

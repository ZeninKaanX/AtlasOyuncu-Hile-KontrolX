package scanner;

import b.ModReport;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;

public class ModAnalyzer {
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final Pattern PATTERN_REGEX = Pattern.compile(
            "(?<![A-Za-z])(" + String.join("|", ModSignatures.PATTERNS) + ")(?![A-Za-z])");

    private static final Pattern FULLWIDTH_REGEX = Pattern.compile(
            "[\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF10-\\uFF19]{2,}");

    private static final Set<String> STRING_SET = new HashSet<>(Arrays.asList(ModSignatures.STRINGS));
    private static final Set<String> LEGIT_IDS = new HashSet<>(Arrays.asList(ModSignatures.LEGIT_MOD_IDS));
    private static final Set<String> WHITELIST_SLUGS = new HashSet<>(Arrays.asList(ModSignatures.WHITELISTED_SLUGS));

    public List<ModReport> analyze(File folder, Consumer<ModReport> onProgress) {
        List<ModReport> reports = new ArrayList<>();
        if (folder == null || !folder.isDirectory()) {
            return reports;
        }
        File[] jars = folder.listFiles((dir, name) -> name.toLowerCase().endsWith(".jar"));
        if (jars == null) {
            return reports;
        }
        Arrays.sort(jars, Comparator.comparing(File::getName, String.CASE_INSENSITIVE_ORDER));
        for (File jar : jars) {
            ModReport report = analyzeOne(jar);
            reports.add(report);
            if (onProgress != null) {
                onProgress.accept(report);
            }
        }
        return reports;
    }

    private ModReport analyzeOne(File jar) {
        String fileName = jar.getName();
        String path = jar.getAbsolutePath();
        String modName = null;
        boolean verified = false;
        boolean whitelisted = false;

        String hash = sha1(jar);
        if (hash != null) {
            String[] modrinth = queryModrinth(hash.toLowerCase());
            if (modrinth != null && !modrinth[1].isEmpty()) {
                modName = modrinth[0];
                verified = true;
                whitelisted = WHITELIST_SLUGS.contains(modrinth[1].toLowerCase());
            } else {
                String mega = queryMegabase(hash.toLowerCase());
                if (mega != null && !mega.isEmpty()) {
                    modName = mega;
                    verified = true;
                }
            }
        }

        if (whitelisted) {
            return new ModReport(fileName, path, ModReport.CAT_VERIFIED,
                    modName == null || modName.isEmpty() ? "Verified via Modrinth" : modName, "");
        }

        String source = downloadSource(jar);

        ContentResult content = scanContent(jar);
        if (!content.patterns.isEmpty() || !content.strings.isEmpty() || !content.fullwidth.isEmpty()) {
            Set<String> resolvedFullwidth = resolveFullwidth(content.fullwidth);
            StringBuilder sb = new StringBuilder();
            if (!content.patterns.isEmpty()) {
                sb.append("PATTERNS: ").append(String.join(", ", content.patterns)).append('\n');
            }
            Set<String> uniqueStrings = new LinkedHashSet<>(content.strings);
            uniqueStrings.removeAll(content.patterns);
            if (!uniqueStrings.isEmpty()) {
                sb.append("STRINGS: ").append(String.join(", ", uniqueStrings)).append('\n');
            }
            if (!resolvedFullwidth.isEmpty()) {
                sb.append("FULLWIDTH UNICODE: ").append(String.join(", ", resolvedFullwidth));
            }
            String details = sb.toString().trim();
            return new ModReport(fileName, path, ModReport.CAT_SUSPICIOUS, details, source == null ? "" : source);
        }

        List<String> bypassFlags = scanBypass(jar);
        if (!bypassFlags.isEmpty()) {
            return new ModReport(fileName, path, ModReport.CAT_BYPASS, String.join("\n", bypassFlags),
                    source == null ? "" : source);
        }

        List<String> obfFlags = scanObfuscation(jar);
        if (!obfFlags.isEmpty()) {
            return new ModReport(fileName, path, ModReport.CAT_OBFUSCATED, String.join("\n", obfFlags),
                    source == null ? "" : source);
        }

        if (verified) {
            return new ModReport(fileName, path, ModReport.CAT_VERIFIED,
                    modName == null || modName.isEmpty() ? "Verified (hash match)" : modName,
                    source == null ? "" : source);
        }

        return new ModReport(fileName, path, ModReport.CAT_UNKNOWN,
                source == null ? "No match found" : ("Source: " + source), source == null ? "" : source);
    }

    private static String sha1(File file) {
        try (InputStream in = Files.newInputStream(file.toPath())) {
            MessageDigest md = MessageDigest.getInstance("SHA1");
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) {
                md.update(buf, 0, n);
            }
            StringBuilder sb = new StringBuilder();
            for (byte b : md.digest()) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private static String[] queryModrinth(String hash) {
        try {
            String version = httpGet("https://api.modrinth.com/v2/version_file/" + hash);
            String projectId = extractJsonString(version, "project_id");
            if (projectId == null) {
                return null;
            }
            String project = httpGet("https://api.modrinth.com/v2/project/" + projectId);
            String title = extractJsonString(project, "title");
            String slug = extractJsonString(project, "slug");
            return new String[]{title == null ? "" : title, slug == null ? "" : slug};
        } catch (Exception e) {
            return null;
        }
    }

    private static String queryMegabase(String hash) {
        try {
            String body = httpGet("https://megabase.vercel.app/api/query?hash=" + hash);
            if (body == null || body.contains("\"error\"")) {
                return null;
            }
            return extractJsonString(body, "name");
        } catch (Exception e) {
            return null;
        }
    }

    private static String httpGet(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("User-Agent", "ModAnalyzer")
                .GET()
                .build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200 ? response.body() : null;
    }

    private static String extractJsonString(String json, String key) {
        if (json == null) {
            return null;
        }
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : null;
    }

    private static String downloadSource(File file) {
        try {
            File zone = new File(file.getAbsolutePath() + ":Zone.Identifier");
            if (!zone.exists()) {
                return null;
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                    new FileInputStream(zone), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("HostUrl=")) {
                        return classifySource(line.substring("HostUrl=".length()).trim());
                    }
                }
            }
        } catch (Exception e) {
        }
        return null;
    }

    private static String classifySource(String url) {
        String u = url.toLowerCase();
        if (u.contains("mediafire.com")) return "MediaFire";
        if (u.contains("discord.com") || u.contains("discordapp.com")) return "Discord";
        if (u.contains("dropbox.com")) return "Dropbox";
        if (u.contains("drive.google.com")) return "Google Drive";
        if (u.contains("mega.nz") || u.contains("mega.co.nz")) return "MEGA";
        if (u.contains("github.com")) return "GitHub";
        if (u.contains("modrinth.com")) return "Modrinth";
        if (u.contains("curseforge.com")) return "CurseForge";
        if (u.contains("anydesk.com")) return "AnyDesk";
        if (u.contains("doomsdayclient.com")) return "DoomsdayClient";
        if (u.contains("prestigeclient.vip")) return "PrestigeClient";
        if (u.contains("198macros.com")) return "198Macros";
        if (u.contains("dqrkis.xyz")) return "Dqrkis";
        Matcher m = Pattern.compile("https?://(?:www\\.)?([^/]+)").matcher(url);
        return m.find() ? m.group(1) : url;
    }

    private static ContentResult scanContent(File file) {
        ContentResult result = new ContentResult();
        try (ZipFile zip = new ZipFile(file)) {
            List<ZipEntry> entries = new ArrayList<>();
            Enumeration<? extends ZipEntry> en = zip.entries();
            while (en.hasMoreElements()) {
                entries.add(en.nextElement());
            }

            for (ZipEntry e : entries) {
                Matcher m = PATTERN_REGEX.matcher(e.getName());
                while (m.find()) {
                    result.patterns.add(m.group());
                }
            }

            for (ZipEntry e : entries) {
                if (!e.getName().matches("^META-INF/jars/.+\\.jar$")) {
                    continue;
                }
                try {
                    byte[] data = readAll(zip.getInputStream(e));
                    try (ZipInputStream zin = new ZipInputStream(new ByteArrayInputStream(data))) {
                        ZipEntry inner;
                        while ((inner = zin.getNextEntry()) != null) {
                            Matcher m = PATTERN_REGEX.matcher(inner.getName());
                            while (m.find()) {
                                result.patterns.add(m.group());
                            }
                            String name = inner.getName();
                            if (name.matches(".*\\.(class|json)$") || name.endsWith("MANIFEST.MF")) {
                                scanBytes(readAll(zin), result);
                            }
                        }
                    }
                } catch (IOException ex) {
                }
            }

            for (ZipEntry e : entries) {
                String name = e.getName();
                if (name.matches(".*\\.(class|json)$") || name.endsWith("MANIFEST.MF")) {
                    try {
                        scanBytes(readAll(zip.getInputStream(e)), result);
                    } catch (IOException ex) {
                    }
                }
            }
        } catch (IOException ex) {
        }
        return result;
    }

    private static void scanBytes(byte[] bytes, ContentResult result) {
        try {
            String ascii = new String(bytes, StandardCharsets.US_ASCII);
            String utf8 = new String(bytes, StandardCharsets.UTF_8);

            Matcher pm = PATTERN_REGEX.matcher(ascii);
            while (pm.find()) {
                result.patterns.add(pm.group());
            }

            for (String s : STRING_SET) {
                if (ascii.contains(s)) {
                    result.strings.add(s);
                    continue;
                }
                if (utf8.contains(s)) {
                    result.strings.add(s);
                }
            }

            Matcher fm = FULLWIDTH_REGEX.matcher(utf8);
            while (fm.find()) {
                result.fullwidth.add(fm.group());
            }
        } catch (Exception ex) {
        }
    }

    private static Set<String> resolveFullwidth(Set<String> found) {
        List<String> pool = new ArrayList<>();
        for (String s : ModSignatures.STRINGS) {
            if (s.matches(".*[\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF10-\\uFF19].*")) {
                pool.add(s);
            }
        }
        Set<String> resolved = new LinkedHashSet<>();
        for (String fw : found) {
            if (fw.length() < 3) {
                continue;
            }
            String best = null;
            for (String cs : pool) {
                if (cs.contains(fw) && (best == null || cs.length() < best.length())) {
                    best = cs;
                }
            }
            if (best != null) {
                resolved.add(best);
            } else if (fw.length() >= 6) {
                resolved.add(fw);
            }
        }
        Set<String> finalSet = new LinkedHashSet<>();
        List<String> list = new ArrayList<>(resolved);
        for (String fw : list) {
            boolean redundant = false;
            for (String other : list) {
                if (fw.length() < other.length() && other.contains(fw)) {
                    redundant = true;
                    break;
                }
            }
            if (!redundant) {
                finalSet.add(fw);
            }
        }
        return finalSet;
    }

    private static List<String> scanBypass(File file) {
        List<String> flags = new ArrayList<>();
        try (ZipFile zip = new ZipFile(file)) {
            List<ZipEntry> entries = new ArrayList<>();
            Enumeration<? extends ZipEntry> en = zip.entries();
            while (en.hasMoreElements()) {
                entries.add(en.nextElement());
            }

            List<String> nestedJars = new ArrayList<>();
            int outerClasses = 0;
            for (ZipEntry e : entries) {
                String name = e.getName();
                if (name.matches("^META-INF/jars/.+\\.jar$")) {
                    nestedJars.add(name);
                }
                if (name.endsWith(".class")) {
                    outerClasses++;
                }
            }

            for (String nj : nestedJars) {
                String base = nj.substring(nj.lastIndexOf('/') + 1);
                if (base.endsWith(".jar")) {
                    base = base.substring(0, base.length() - 4);
                }
                if (isSuspiciousJarName(base)) {
                    flags.add("Suspicious nested JAR — no version, unknown dependency: " + base);
                }
            }

            if (nestedJars.size() == 1 && outerClasses < 3) {
                String njName = nestedJars.get(0).substring(nestedJars.get(0).lastIndexOf('/') + 1);
                flags.add("Hollow shell — only " + outerClasses + " own class(es), wraps: " + njName);
            }

            String outerModId = readFabricModId(zip);

            List<String> classNames = new ArrayList<>();
            List<byte[]> classContents = new ArrayList<>();
            for (ZipEntry e : entries) {
                if (!e.getName().endsWith(".class")) {
                    continue;
                }
                classNames.add(e.getName());
                classContents.add(readAll(zip.getInputStream(e)));
            }
            for (String nj : nestedJars) {
                ZipEntry nested = zip.getEntry(nj);
                if (nested == null) {
                    continue;
                }
                try (ZipInputStream zin = new ZipInputStream(new ByteArrayInputStream(readAll(zip.getInputStream(nested))))) {
                    ZipEntry inner;
                    while ((inner = zin.getNextEntry()) != null) {
                        if (inner.getName().endsWith(".class")) {
                            classNames.add(inner.getName());
                            classContents.add(readAll(zin));
                        }
                    }
                } catch (IOException ex) {
                }
            }

            boolean runtimeExec = false;
            boolean httpDownload = false;
            boolean httpExfil = false;
            int obfuscatedCount = 0;
            int numericClassCount = 0;
            int unicodeClassCount = 0;
            int totalClassCount = classNames.size();

            for (int i = 0; i < totalClassCount; i++) {
                String name = classNames.get(i);
                String className = name.substring(name.lastIndexOf('/') + 1);
                if (className.endsWith(".class")) {
                    className = className.substring(0, className.length() - 6);
                }
                if (className.matches("^\\d+$")) {
                    numericClassCount++;
                }
                if (className.matches(".*[^\\x00-\\x7F].*")) {
                    unicodeClassCount++;
                }
                String[] segs = name.replaceAll("\\.class$", "").split("/");
                int cur = 0;
                int maxConsecutive = 0;
                for (String seg : segs) {
                    if (seg.length() == 1) {
                        cur++;
                        if (cur > maxConsecutive) {
                            maxConsecutive = cur;
                        }
                    } else {
                        cur = 0;
                    }
                }
                if (maxConsecutive >= 3) {
                    obfuscatedCount++;
                }

                String ct = new String(classContents.get(i), StandardCharsets.US_ASCII);
                if (ct.contains("java/lang/Runtime") && ct.contains("getRuntime") && ct.contains("exec")) {
                    runtimeExec = true;
                }
                if (ct.contains("openConnection") && ct.contains("HttpURLConnection") && ct.contains("FileOutputStream")) {
                    httpDownload = true;
                }
                if (ct.contains("openConnection") && ct.contains("setDoOutput")
                        && ct.contains("getOutputStream") && ct.contains("getProperty")) {
                    httpExfil = true;
                }
            }

            int obfPct = totalClassCount >= 10 ? pct(obfuscatedCount, totalClassCount) : 0;
            int numPct = totalClassCount >= 5 ? pct(numericClassCount, totalClassCount) : 0;
            int uniPct = totalClassCount >= 5 ? pct(unicodeClassCount, totalClassCount) : 0;

            if (runtimeExec && obfPct >= 25) {
                flags.add("Runtime.exec() in obfuscated code — can run arbitrary OS commands");
            }
            if (httpDownload) {
                flags.add("HTTP file download — fetches and writes files from a remote server at runtime");
            }
            if (httpExfil) {
                flags.add("HTTP POST exfiltration — sends system data to an external server");
            }
            if (totalClassCount >= 10 && obfPct >= 25) {
                flags.add("Heavy obfuscation — " + obfPct + "% of classes use single-letter path segments (a/b/c style)");
            }
            if (numPct >= 20) {
                flags.add("Numeric class names — " + numPct + "% of classes have numeric-only names (e.g. 1234.class)");
            }
            if (uniPct >= 10) {
                flags.add("Unicode class names — " + uniPct + "% of classes use non-ASCII characters");
            }

            long dangerCount = flags.stream().filter(f ->
                    f.contains("Runtime.exec") || f.contains("HTTP file download")
                            || f.contains("HTTP POST") || f.contains("Heavy obfuscation")
                            || f.contains("Suspicious nested JAR")).count();
            if (outerModId != null && !outerModId.isEmpty() && LEGIT_IDS.contains(outerModId) && dangerCount > 0) {
                flags.add("Fake mod identity — claims to be '" + outerModId + "' but contains dangerous code");
            }
        } catch (Exception ex) {
        }
        return flags;
    }

    private static boolean isSuspiciousJarName(String base) {
        if (base.matches(".*\\d.*")) {
            return false;
        }
        String low = base.toLowerCase();
        for (String prefix : ModSignatures.MAVEN_PREFIXES) {
            if (low.startsWith(prefix)) {
                return false;
            }
        }
        return base.length() <= 20;
    }

    private static String readFabricModId(ZipFile zip) {
        ZipEntry e = zip.getEntry("fabric.mod.json");
        if (e == null) {
            return null;
        }
        try {
            String text = new String(readAll(zip.getInputStream(e)), StandardCharsets.UTF_8);
            Matcher m = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"").matcher(text);
            return m.find() ? m.group(1) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private static List<String> scanObfuscation(File file) {
        List<String> flags = new ArrayList<>();
        try (ZipFile zip = new ZipFile(file)) {
            int totalClass = 0;
            int numericCount = 0;
            int unicodeCount = 0;
            int fullwidthCount = 0;
            int japaneseCount = 0;
            int singleLetterCount = 0;
            int twoLetterCount = 0;
            int gibberishCount = 0;
            int noVowelCount = 0;
            int confusionCount = 0;
            int singleCharPkg = 0;
            StringBuilder sample = new StringBuilder();
            int sampleSize = 0;

            Enumeration<? extends ZipEntry> en = zip.entries();
            while (en.hasMoreElements()) {
                ZipEntry e = en.nextElement();
                String name = e.getName();
                if (!name.endsWith(".class")) {
                    continue;
                }
                totalClass++;
                String full = name.replaceAll("\\.class$", "");
                String className = full.substring(full.lastIndexOf('/') + 1);

                if (className.matches("^\\d+$")) numericCount++;
                if (className.matches(".*[^\\x00-\\x7F].*")) unicodeCount++;
                if (className.matches(".*[\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF10-\\uFF19].*")) fullwidthCount++;
                if (className.matches(".*[\\u3040-\\u309F\\u30A0-\\u30FF].*")) japaneseCount++;
                if (className.matches("^[a-zA-Z]$")) singleLetterCount++;
                if (className.matches("^[a-zA-Z]{2}$")) twoLetterCount++;
                if (className.matches("^[Il1O0]+$") || className.matches("^_+$")) confusionCount++;

                if (className.length() >= 3 && className.length() <= 8 && className.matches("^[a-zA-Z]+$")) {
                    int vowels = 0;
                    for (char ch : className.toCharArray()) {
                        if ("aeiouAEIOU".indexOf(ch) >= 0) {
                            vowels++;
                        }
                    }
                    if (vowels == 0) {
                        noVowelCount++;
                    }
                    boolean cluster = className.matches(".*[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{3,}.*");
                    if (cluster && (double) vowels / className.length() < 0.3) {
                        gibberishCount++;
                    }
                }

                String[] segs = full.split("/");
                for (int i = 0; i < segs.length - 1; i++) {
                    if (segs[i].length() == 1) {
                        singleCharPkg++;
                    }
                }

                if (sampleSize < 150000 && e.getSize() < 100000 && e.getSize() > 100) {
                    try {
                        String ascii = new String(readAll(zip.getInputStream(e)), StandardCharsets.US_ASCII);
                        sample.append(ascii);
                        sampleSize += ascii.length();
                    } catch (IOException ex) {
                    }
                }
            }

            if (totalClass < 5) {
                return flags;
            }

            int numPct = pct(numericCount, totalClass);
            int uniPct = pct(unicodeCount, totalClass);
            int fwPct = pct(fullwidthCount, totalClass);
            int jpPct = pct(japaneseCount, totalClass);
            int s1Pct = pct(singleLetterCount, totalClass);
            int s2Pct = pct(twoLetterCount, totalClass);
            int gibPct = pct(gibberishCount, totalClass);
            int novPct = pct(noVowelCount, totalClass);
            int confPct = pct(confusionCount, totalClass);

            if (numPct >= 20) flags.add("Numeric class names — " + numPct + "% of classes have numeric-only names");
            if (uniPct >= 10) flags.add("Unicode class names — " + uniPct + "% of classes use non-ASCII characters");
            if (fwPct > 0) flags.add("Fullwidth Unicode class names — " + fwPct + "% use ａｂｃ/ＡＢＣ/０１２ chars (" + fullwidthCount + " classes)");
            if (jpPct > 0) flags.add("Japanese obfuscation — " + jpPct + "% use hiragana/katakana class names (" + japaneseCount + " classes)");
            if (s1Pct >= 15) flags.add("Single-letter class names — " + s1Pct + "% (" + singleLetterCount + " classes)");
            if (s2Pct >= 20) flags.add("Two-letter class names — " + s2Pct + "% (" + twoLetterCount + " classes)");
            if (gibPct >= 5) flags.add("Gibberish class names — " + gibPct + "% have no vowels / consonant clusters (" + gibberishCount + " classes)");
            if (novPct >= 8) flags.add("No-vowel class names — " + novPct + "% (" + noVowelCount + " classes)");
            if (confPct >= 3) flags.add("Confusion-char names (Il1O0/_) — " + confPct + "% (" + confusionCount + " classes)");
            if (singleCharPkg >= 6) flags.add("Single-char package paths — " + singleCharPkg + " path segments like a/b/c");

            Matcher fm = FULLWIDTH_REGEX.matcher(sample.toString());
            int fwCount = 0;
            Set<String> examples = new LinkedHashSet<>();
            while (fm.find()) {
                fwCount++;
                if (examples.size() < 3) {
                    examples.add(fm.group());
                }
            }
            if (fwCount > 0) {
                flags.add("Fullwidth strings in class content — " + fwCount + " occurrences (e.g. " + String.join(", ", examples) + ")");
            }

            String sampleStr = sample.toString();
            for (Map.Entry<String, String[]> obf : ModSignatures.OBFUSCATORS.entrySet()) {
                for (String pattern : obf.getValue()) {
                    if (sampleStr.contains(pattern)) {
                        flags.add("Known cheat obfuscator detected — " + obf.getKey() + " (matched: " + pattern + ")");
                        break;
                    }
                }
            }
        } catch (Exception ex) {
        }
        return flags;
    }

    private static int pct(int n, int total) {
        return (int) Math.round(n * 100.0 / total);
    }

    private static byte[] readAll(InputStream in) throws IOException {
        try {
            return in.readAllBytes();
        } finally {
            in.close();
        }
    }

    private static final class ContentResult {
        final Set<String> patterns = new LinkedHashSet<>();
        final Set<String> strings = new LinkedHashSet<>();
        final Set<String> fullwidth = new LinkedHashSet<>();
    }
}

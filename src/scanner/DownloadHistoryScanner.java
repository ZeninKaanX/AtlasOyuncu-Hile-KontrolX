package scanner;

import b.DownloadHistoryEntry;
import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class DownloadHistoryScanner {

    private static final String CHROME_QUERY =
        "SELECT target_path, tab_url, total_bytes, start_time FROM downloads ORDER BY start_time DESC LIMIT 200";

    public static List<DownloadHistoryEntry> scanAll() {
        List<DownloadHistoryEntry> entries = new ArrayList<>();
        entries.addAll(scanChrome());
        entries.addAll(scanEdge());
        entries.addAll(scanFirefox());
        return entries;
    }

    public static List<DownloadHistoryEntry> scanChrome() {
        File db = getChromeDb();
        return scanChromiumDb(db, "Chrome");
    }

    public static List<DownloadHistoryEntry> scanEdge() {
        File db = getEdgeDb();
        return scanChromiumDb(db, "Edge");
    }

    public static List<DownloadHistoryEntry> scanFirefox() {
        List<DownloadHistoryEntry> entries = new ArrayList<>();
        String appData = System.getenv("APPDATA");
        if (appData == null) return entries;

        File profiles = new File(appData, "Mozilla/Firefox/Profiles");
        if (!profiles.exists()) return entries;

        File[] dirs = profiles.listFiles(File::isDirectory);
        if (dirs == null) return entries;

        for (File dir : dirs) {
            if (dir.getName().endsWith(".default") || dir.getName().endsWith(".default-release")) {
                File places = new File(dir, "places.sqlite");
                if (!places.exists()) continue;

                String url = "jdbc:sqlite:" + places.getAbsolutePath();
                try (Connection conn = DriverManager.getConnection(url);
                     Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery(
                         "SELECT p.url, p.title, p.visit_count, p.last_visit_date " +
                         "FROM moz_places p WHERE p.url LIKE '%download%' OR p.url LIKE '%mega%' OR p.url LIKE '%mediafire%' " +
                         "ORDER BY p.last_visit_date DESC LIMIT 100")) {
                    while (rs.next()) {
                        String u = rs.getString("url");
                        String t = rs.getString("title");
                        entries.add(new DownloadHistoryEntry("Firefox",
                            t != null ? t : extractFilename(u),
                            u != null ? u : "", "", formatDate(rs.getLong("last_visit_date"))));
                    }
                } catch (SQLException ignored) {}
                break;
            }
        }
        return entries;
    }

    private static List<DownloadHistoryEntry> scanChromiumDb(File db, String browser) {
        List<DownloadHistoryEntry> entries = new ArrayList<>();
        if (db == null || !db.exists()) return entries;

        String url = "jdbc:sqlite:" + db.getAbsolutePath();
        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(CHROME_QUERY)) {
            while (rs.next()) {
                String path = rs.getString("target_path");
                String src = rs.getString("tab_url");
                long bytes = rs.getLong("total_bytes");
                long time = rs.getLong("start_time");
                entries.add(new DownloadHistoryEntry(browser,
                    extractFilename(path), src != null ? src : "",
                    formatSize(bytes), formatDateChromium(time)));
            }
        } catch (SQLException ignored) {}
        return entries;
    }

    private static File getChromeDb() {
        String local = System.getenv("LOCALAPPDATA");
        if (local != null) {
            File f = new File(local, "Google/Chrome/User Data/Default/History");
            if (f.exists()) return f;
        }
        return null;
    }

    private static File getEdgeDb() {
        String local = System.getenv("LOCALAPPDATA");
        if (local != null) {
            File f = new File(local, "Microsoft/Edge/User Data/Default/History");
            if (f.exists()) return f;
        }
        return null;
    }

    private static String extractFilename(String path) {
        if (path == null) return "unknown";
        int idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        return idx >= 0 ? path.substring(idx + 1) : path;
    }

    private static String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }

    private static String formatDateChromium(long chromeTime) {
        if (chromeTime <= 0) return "";
        try {
            long epoch = (chromeTime / 1000000L) - 11644473600L;
            return Instant.ofEpochSecond(epoch)
                .atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"));
        } catch (Exception e) { return ""; }
    }

    private static String formatDate(long microTime) {
        if (microTime <= 0) return "";
        try {
            long epoch = microTime / 1000000L;
            return Instant.ofEpochSecond(epoch)
                .atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"));
        } catch (Exception e) { return ""; }
    }
}

package scanner;

import b.BrowserHistoryEntry;
import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class BrowserHistoryScanner {

    private static final String QUERY =
        "SELECT url, title, visit_count, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 500";

    public static List<BrowserHistoryEntry> scanAll() {
        List<BrowserHistoryEntry> entries = new ArrayList<>();
        entries.addAll(scanChrome());
        entries.addAll(scanEdge());
        entries.addAll(scanFirefox());
        return entries;
    }

    public static List<BrowserHistoryEntry> scanChrome() {
        File db = getChromeDb();
        return scanChromiumDb(db, "Chrome");
    }

    public static List<BrowserHistoryEntry> scanEdge() {
        File db = getEdgeDb();
        return scanChromiumDb(db, "Edge");
    }

    public static List<BrowserHistoryEntry> scanFirefox() {
        List<BrowserHistoryEntry> entries = new ArrayList<>();
        File db = getFirefoxDb();
        if (db == null || !db.exists()) return entries;

        String url = "jdbc:sqlite:" + db.getAbsolutePath();
        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                 "SELECT p.url, p.title, p.visit_count, p.last_visit_date " +
                 "FROM moz_places p WHERE p.visit_count > 0 " +
                 "ORDER BY p.last_visit_date DESC LIMIT 500")) {
            while (rs.next()) {
                String u = rs.getString("url");
                String t = rs.getString("title");
                int vc = rs.getInt("visit_count");
                long lv = rs.getLong("last_visit_date");
                entries.add(new BrowserHistoryEntry("Firefox",
                    t != null ? t : "", u != null ? u : "",
                    String.valueOf(vc), formatDate(lv)));
            }
        } catch (SQLException ignored) {}
        return entries;
    }

    private static List<BrowserHistoryEntry> scanChromiumDb(File db, String browser) {
        List<BrowserHistoryEntry> entries = new ArrayList<>();
        if (db == null || !db.exists()) return entries;

        String url = "jdbc:sqlite:" + db.getAbsolutePath();
        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(QUERY)) {
            while (rs.next()) {
                String u = rs.getString("url");
                String t = rs.getString("title");
                int vc = rs.getInt("visit_count");
                long lv = rs.getLong("last_visit_time");
                entries.add(new BrowserHistoryEntry(browser,
                    t != null ? t : "", u != null ? u : "",
                    String.valueOf(vc), formatDateChromium(lv)));
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

    private static File getFirefoxDb() {
        String appData = System.getenv("APPDATA");
        if (appData == null) return null;
        File profiles = new File(appData, "Mozilla/Firefox/Profiles");
        if (!profiles.exists()) return null;
        File[] dirs = profiles.listFiles(File::isDirectory);
        if (dirs == null) return null;
        for (File dir : dirs) {
            if (dir.getName().endsWith(".default") || dir.getName().endsWith(".default-release")) {
                File places = new File(dir, "places.sqlite");
                if (places.exists()) return places;
            }
        }
        return null;
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

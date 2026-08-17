/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.FileVisitor;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import javafx.application.Platform;
import javafx.collections.ObservableList;

public class a {
    private static final List<String> a = Arrays.asList("\"guild(?:_id|Id)\"\\s*:\\s*\"(\\d{17,19})\"", "\"(?:channel(?:_id|Id)|parent_id)\"\\s*:\\s*\"(\\d{17,19})\"", "\"role(?:_id|Id)\"\\s*:\\s*\"(\\d{17,19})\"", "\"(?:message_id|application_id|webhook_id|emoji_id|sticker_id|integration_id|subscription_id|event_id|invite_code|sku_id|payment_id|interaction_id|component_id)\"\\s*:\\s*\"(\\d{17,19})\"", "/guilds/(\\d{17,19})/", "/channels/(\\d{17,19})/", "\"recipient(?:_id|s|_ids)\"\\s*:\\s*\\[?[^\\]]*?\"?(\\d{17,19})\"?", "\"members\"\\s*:\\s*\\[[^\\]]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"author\"\\s*:\\s*\\{[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"relationships\"[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"friend(?:_ids|s)\"\\s*:\\s*\\[?[^\\]]*?\"?(\\d{17,19})\"?", "\"mentioned_users\"\\s*:\\s*\\[[^\\]]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"presence\"\\s*:\\s*\\{[^\\}]*?\"user\"\\s*:\\s*\\{[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"users\":\\{[^\\}]*?\"(\\d{17,19})\":\\{[^\\}]*?\"username\"", "\"private_channels\"[^\\]]*?\"recipient_ids\"[^\\]]*?\"(\\d{17,19})\"", "\"nick\"[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"hoisted_role\"[^\\}]*?\"(\\d{17,19})\"", "\"bot\"\\s*:\\s*true[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"application\"\\s*:\\s*\\{[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"", "\"webhook\"\\s*:\\s*\\{[^\\}]*?\"id\"\\s*:\\s*\"(\\d{17,19})\"");
    private final Set<String> b = Collections.synchronizedSet(new HashSet());
    private final Set<String> c = Collections.synchronizedSet(new HashSet());

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public void a(ObservableList<b.a> observableList) {
        observableList.clear();
        this.b.clear();
        this.c.clear();
        String string = System.getenv("APPDATA");
        String string2 = System.getenv("LOCALAPPDATA");
        String string3 = System.getenv("USERPROFILE");
        ExecutorService executorService = Executors.newFixedThreadPool(4);
        try {
            CompletableFuture.allOf(CompletableFuture.runAsync(() -> this.a(string, string2, string3, observableList), executorService), CompletableFuture.runAsync(() -> this.a(string, observableList), executorService), CompletableFuture.runAsync(() -> this.b(string, observableList), executorService), CompletableFuture.runAsync(() -> this.a(string, string2, observableList), executorService)).join();
        }
        finally {
            executorService.shutdown();
        }
    }

    private void a(ObservableList<b.a> observableList, String string, String string2, String string3, Set<String> set) {
        if (string == null || string.trim().isEmpty()) {
            return;
        }
        String string4 = string.trim().toLowerCase();
        if (!set.contains(string4)) {
            set.add(string4);
            b.a a2 = new b.a(string.trim(), string2, string3);
            Platform.runLater(() -> observableList.add(a2));
        } else {
            Platform.runLater(() -> {
                for (b.a a2 : observableList) {
                    if (!a2.getUsername().equalsIgnoreCase(string4) || !a2.getType().equals(string3)) continue;
                    if (a2.getSource().contains(string2)) break;
                    a2.setSource(a2.getSource() + ", " + string2);
                    break;
                }
            });
        }
    }

    private void a(String string, String string2, String string3, ObservableList<b.a> observableList) {
        HashMap<String, String> hashMap = new HashMap<String, String>();
        if (string != null) {
            hashMap.put(string + "\\PrismLauncher\\accounts.json", "PrismLauncher");
            hashMap.put(string + "\\.minecraft\\labymod-neo\\accounts.json", "LabyMod Neo");
            hashMap.put(string + "\\.minecraft\\launcher_accounts_microsoft_store.json", "Vanilla");
            hashMap.put(string + "\\.minecraft\\LabyMod\\accounts.json", "LabyMod");
            hashMap.put(string + "\\MultiMC\\accounts.json", "MultiMC");
            hashMap.put(string + "\\.tlauncher\\accounts.json", "TLauncher");
            hashMap.put(string + "\\.minecraft\\BLClient\\accounts.json", "Badlion Client");
            hashMap.put(string + "\\.feather\\accounts.json", "Feather Client");
            hashMap.put(string + "\\.minecraft\\Feather\\accounts.json", "Feather Client");
            hashMap.put(string + "\\ATLauncher\\accounts.json", "ATLauncher");
            hashMap.put(string + "\\.minecraft\\ATLauncher\\accounts.json", "ATLauncher");
            hashMap.put(string + "\\gdlauncher_next\\accounts.json", "GDLauncher");
            hashMap.put(string + "\\gdlauncher\\accounts.json", "GDLauncher");
            hashMap.put(string + "\\.minecraft\\SKlauncher\\accounts.json", "SKlauncher");
            hashMap.put(string + "\\PolyMC\\accounts.json", "PolyMC");
            hashMap.put(string + "\\.technic\\accounts.json", "Technic");
            hashMap.put(string + "\\.minecraft\\Technic\\accounts.json", "Technic");
            hashMap.put(string + "\\crystal-launcher\\accounts.json", "Crystal Launcher");
            hashMap.put(string + "\\.minecraft\\Crystal\\accounts.json", "Crystal Launcher");
            hashMap.put(string + "\\Valhalla\\accounts.json", "Valhalla");
            hashMap.put(string + "\\.minecraft\\ModrinthApp\\accounts.json", "ModrinthApp");
            hashMap.put(string + "\\ModrinthApp\\accounts.json", "Modrinth App");
            hashMap.put(string + "\\CurseForge\\accounts.json", "CurseForge");
            hashMap.put(string + "\\.minecraft\\forge\\accounts.json", "Forge");
            hashMap.put(string + "\\.minecraft\\fabric\\accounts.json", "Fabric");
            hashMap.put(string + "\\VoidLauncher\\accounts.json", "VoidLauncher");
            hashMap.put(string + "\\.minecraft\\legacy\\accounts.json", "Legacy");
            hashMap.put(string + "\\Salwyrr\\accounts.json", "Salwyrr");
            hashMap.put(string + "\\.minecraft\\launcher_msa_credentials.json", "Vanilla");
            hashMap.put(string + "\\.minecraft\\TlauncherProfiles.json", "TLauncher");
            hashMap.put(string + "\\HMCL\\accounts.json", "HMCL");
            hashMap.put(string + "\\PCL\\accounts.json", "PCL");
            hashMap.put(string + "\\Impact\\accounts.json", "Impact");
            hashMap.put(string + "\\Wurst\\accounts.json", "Wurst");
            hashMap.put(string + "\\LiquidBounce\\accounts.json", "LiquidBounce");
            hashMap.put(string + "\\Aristois\\accounts.json", "Aristois");
            hashMap.put(string + "\\Meteor\\accounts.json", "Meteor");
            hashMap.put(string + "\\.meteor\\accounts.json", "Meteor");
            hashMap.put(string + "\\Inertia\\accounts.json", "Inertia");
            hashMap.put(string + "\\Sigma\\accounts.json", "Sigma");
            hashMap.put(string + "\\Konas\\accounts.json", "Konas");
            hashMap.put(string + "\\Future\\accounts.json", "Future");
            hashMap.put(string + "\\Kami\\accounts.json", "Kami");
            hashMap.put(string + "\\Salhack\\accounts.json", "Salhack");
            hashMap.put(string + "\\Rusherhack\\accounts.json", "Rusherhack");
            hashMap.put(string + "\\Pyro\\accounts.json", "Pyro");
            hashMap.put(string + "\\Phobos\\accounts.json", "Phobos");
            hashMap.put(string + "\\TL Legacy\\accounts.json", "TL Legacy");
            hashMap.put(string + "\\Minecraft Launcher\\accounts.json", "Minecraft Launcher");
        }
        if (string2 != null) {
            hashMap.put(string2 + "\\CurseForge\\accounts.json", "CurseForge");
        }
        if (string3 != null) {
            hashMap.put(string3 + "\\.lunarclient\\settings\\game\\accounts.json", "Lunar Client");
            hashMap.put(string3 + "\\.lunarclient\\settings\\game-backup\\accounts.json", "Lunar Client");
            hashMap.put(string3 + "\\.minecraft\\launcher_accounts.json", "Vanilla");
            hashMap.put(string3 + "\\Documents\\.minecraft\\accounts.json", "Vanilla");
            hashMap.put(string3 + "\\curseforge\\minecraft\\Install\\accounts.json", "CurseForge");
        }
        for (Map.Entry entry : hashMap.entrySet()) {
            this.a(Paths.get((String)entry.getKey(), new String[0]), "\"(?:username|name|displayName|playerName)\"\\s*:\\s*\"([a-zA-Z0-9_*]{3,16})\"", (String)entry.getValue(), observableList);
        }
    }

    private void a(Path path, String string, String string2, ObservableList<b.a> observableList) {
        if (Files.exists(path, new LinkOption[0]) && Files.isRegularFile(path, new LinkOption[0])) {
            try {
                String string3 = Files.readString(path);
                Pattern pattern = Pattern.compile(string, 2);
                Matcher matcher = pattern.matcher(string3);
                while (matcher.find()) {
                    String string4 = matcher.group(1).trim();
                    if (!this.a(string4)) continue;
                    this.a(observableList, string4, string2, "Minecraft", this.b);
                }
            }
            catch (IOException iOException) {
                // empty catch block
            }
        }
    }

    private boolean a(String string) {
        if (string.length() < 3 || string.length() > 16) {
            return false;
        }
        List<String> list = Arrays.asList("accounts", "forge", "fabric", "vanilla", "profile", "instance", "optifine");
        if (list.contains(string.toLowerCase())) {
            return false;
        }
        return !string.contains("*") && !string.matches("(?i)^Player\\d+$");
    }

    private void a(String string, ObservableList<b.a> observableList) {
        String[] stringArray;
        if (string == null) {
            return;
        }
        for (String string2 : stringArray = new String[]{string + "\\PrismLauncher\\instances", string + "\\MultiMC\\instances", string + "\\PolyMC\\instances"}) {
            Path path3 = Paths.get(string2, new String[0]);
            if (!Files.exists(path3, new LinkOption[0]) || !Files.isDirectory(path3, new LinkOption[0])) continue;
            try (Stream<Path> stream = Files.list(path3);){
                stream.filter(path -> Files.isDirectory(path, new LinkOption[0])).forEach(path2 -> {
                    Path accountsPath = path2.resolve("accounts.json");
                    String launcherName = Optional.ofNullable(accountsPath.getParent()).map(Path::getFileName).map(Path::toString).orElse("Instance Launcher");
                    this.a(accountsPath, "\"(?:username|name|displayName|playerName)\"\\s*:\\s*\"([a-zA-Z0-9_*]{3,16})\"", launcherName + " Instance", observableList);
                });
            }
            catch (IOException iOException) {
                // empty catch block
            }
        }
    }

    private void b(String string, ObservableList<b.a> observableList) {
        if (string == null) {
            return;
        }
        Path path = Paths.get(string, "ow-electron", "jilehohlakeokncafogkgnicgndeecdiengddbcc", "logs", "overlay", "overlay.log");
        Path path2 = Paths.get(string, "ow-electron", "jilehohlakeokncafogkgnicgndeecdiengddbcc", "logs", "utility", "utility.log");
        Pattern pattern = Pattern.compile("--username\\s+([a-zA-Z0-9_]{3,16})\\b", 2);
        for (Path path3 : new Path[]{path, path2}) {
            if (!Files.exists(path3, new LinkOption[0]) || !Files.isRegularFile(path3, new LinkOption[0])) continue;
            try {
                String string2 = Files.readString(path3);
                Matcher matcher = pattern.matcher(string2);
                while (matcher.find()) {
                    if (!this.a(matcher.group(1))) continue;
                    this.a(observableList, matcher.group(1), "Overwolf", "Minecraft", this.b);
                }
            }
            catch (IOException iOException) {
                // empty catch block
            }
        }
    }

    private void a(String string, String string2, ObservableList<b.a> observableList) {
        Path path;
        String[] stringArray;
        if (string != null) {
            for (String string3 : stringArray = new String[]{"discord", "discordcanary", "discordptb", "discorddevelopment"}) {
                path = Paths.get(string, string3);
                this.a(path, string3, observableList);
            }
        }
        if (string2 != null) {
            for (String string3 : stringArray = new String[]{"Discord", "DiscordCanary", "DiscordPTB", "DiscordDevelopment"}) {
                path = Paths.get(string2, string3);
                this.a(path, string3, observableList);
            }
        }
    }

    private void a(Path path, String string, ObservableList<b.a> observableList) {
        if (Files.exists(path, new LinkOption[0])) {
            String[] stringArray;
            for (String string2 : stringArray = new String[]{"Local Storage\\leveldb", "Session Storage", "IndexedDB", "logs"}) {
                this.b(path.resolve(string2), string, observableList);
            }
            this.b(path, string, observableList);
        }
    }

    private void b(Path path, final String string, final ObservableList<b.a> observableList) {
        if (!Files.exists(path, new LinkOption[0])) {
            return;
        }
        try {
            Files.walkFileTree(path, new SimpleFileVisitor<Path>(){

                @Override
                public FileVisitResult visitFile(Path path, BasicFileAttributes basicFileAttributes) throws IOException {
                    if (basicFileAttributes.size() > 0xA00000L) {
                        return FileVisitResult.CONTINUE;
                    }
                    String string3 = path.getFileName().toString().toLowerCase();
                    if (string3.endsWith(".exe") || string3.endsWith(".dll") || string3.endsWith(".png") || string3.endsWith(".jpg")) {
                        return FileVisitResult.CONTINUE;
                    }
                    try {
                        byte[] byArray = Files.readAllBytes(path);
                        String string2 = new String(byArray, "ISO-8859-1");
                        a.this.b(string2, string, observableList);
                        if (string3.endsWith(".log") || string3.endsWith(".txt") || string3.endsWith(".json") || string3.endsWith(".ldb")) {
                            string2 = new String(byArray, "UTF-8");
                            a.this.b(string2, string, observableList);
                        }
                    }
                    catch (IOException iOException) {
                        // empty catch block
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path path, IOException iOException) {
                    return FileVisitResult.CONTINUE;
                }
            });
        }
        catch (IOException iOException) {
            // empty catch block
        }
    }

    private void b(String string, String string2, ObservableList<b.a> observableList) {
        Object object;
        String string3;
        Object object2;
        Matcher matcher;
        HashSet<String> hashSet = new HashSet<String>();
        for (String object32 : a) {
            matcher = Pattern.compile(object32, 2).matcher(string);
            while (matcher.find()) {
                if (matcher.groupCount() <= 0) continue;
                hashSet.add(matcher.group(1));
            }
        }
        Matcher matcher2 = Pattern.compile("AudioContextSettingsMigrated:(\\d{17,19})", 2).matcher(string);
        while (matcher2.find()) {
            String string4 = matcher2.group(1);
            if (!this.b(string4) || hashSet.contains(string4)) continue;
            this.a(observableList, string4, string2, "Discord ID", this.c);
        }
        Pattern pattern = Pattern.compile("\"(?:id|username)\"\\s*:\\s*\"([^\"]+)\"\\s*,\\s*\"(?:username|id)\"\\s*:\\s*\"([^\"]+)\"", 2);
        matcher = pattern.matcher(string);
        while (matcher.find()) {
            object2 = matcher.group(1);
            string3 = matcher.group(2);
            object = null;
            Object object3 = null;
            if (this.b((String)object2)) {
                object = object2;
                object3 = string3;
            } else if (this.b(string3)) {
                object = string3;
                object3 = object2;
            }
            if (object == null || hashSet.contains(object)) continue;
            Object object4 = object3 != null && !((String)object3).isEmpty() ? (String)object3 + " (" + (String)object + ")" : object;
            this.a(observableList, (String)object4, string2, "Discord ID", this.c);
        }
        object2 = Pattern.compile("\"id\"\\s*:\\s*\"(\\d{17,19})\"\\s*,\\s*\"username\"\\s*:\\s*\"([^\"]{2,32})\"\\s*,\\s*\"email\"", 2).matcher(string);
        while (((Matcher)object2).find()) {
            string3 = ((Matcher)object2).group(1);
            object = ((Matcher)object2).group(2);
            if (!this.b(string3) || hashSet.contains(string3)) continue;
            this.a(observableList, (String)object + " (" + string3 + ")", string2, "Discord ID", this.c);
        }
    }

    private boolean b(String string) {
        if (string.length() < 17 || string.length() > 19) {
            return false;
        }
        try {
            long l2 = Long.parseLong(string);
            long l3 = (l2 >> 22) + 1420070400000L;
            if (l3 < 1420070400000L || l3 > 1893456000000L) {
                return false;
            }
        }
        catch (NumberFormatException numberFormatException) {
            return false;
        }
        return true;
    }

    private static /* synthetic */ String _yef(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x37;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 473120619 + 1917347253 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


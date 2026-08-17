/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.r;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileAttribute;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class o {
    private static final Pattern a = Pattern.compile("VID_([0-9A-Fa-f]{4})[&;]PID_([0-9A-Fa-f]{4})", 2);
    private static final Pattern b = Pattern.compile("<Data Name='([^']+)'>([^<]*)</Data>");
    private static final Pattern c = Pattern.compile("SystemTime='([^']+)'");
    private static final Pattern d = Pattern.compile("(?=<Event\\s)");
    private static final DateTimeFormatter e = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public static List<r> a() {
        ArrayList<r> arrayList = new ArrayList<r>();
        try {
            String string;
            Object object;
            HashMap<String, String> hashMap = new HashMap<String, String>();
            HashMap<String, String> hashMap2 = new HashMap<String, String>();
            o.a(hashMap, hashMap2);
            Map<String, String[]> map = o.b();
            ArrayList<a> arrayList2 = new ArrayList<a>();
            o.b(arrayList2);
            o.c(arrayList2);
            o.a(arrayList2);
            arrayList2.sort((a2, a3) -> {
                if (a2.i == null && a3.i == null) {
                    return 0;
                }
                if (a2.i == null) {
                    return 1;
                }
                if (a3.i == null) {
                    return -1;
                }
                return a3.i.compareTo(a2.i);
            });
            HashSet<String> hashSet = new HashSet<String>();
            for (a object22 : arrayList2) {
                String string2;
                String[] stringArray;
                Object object2;
                object = "";
                string = "";
                if (object22.e != null && !object22.e.isEmpty() && ((Matcher)(object2 = a.matcher(object22.e))).find()) {
                    object = ((Matcher)object2).group(1).toLowerCase();
                    string = ((Matcher)object2).group(2).toLowerCase();
                }
                if (((String)object).isEmpty() && object22.a != null) {
                    object2 = object22.a.toLowerCase().replaceAll("[._]", "");
                    if (map.containsKey(object2)) {
                        stringArray = map.get(object2);
                        object = stringArray[0];
                        string = stringArray[1];
                    }
                    if (((String)object).isEmpty() && map.containsKey(object22.a.toLowerCase())) {
                        stringArray = map.get(object22.a.toLowerCase());
                        object = stringArray[0];
                        string = stringArray[1];
                    }
                }
                object2 = ((String)object).isEmpty() ? "" : hashMap.getOrDefault(object, "");
                String productName = string.isEmpty() ? "" : hashMap2.getOrDefault((String)object + ":" + string, "");
                Object object3 = "";
                object3 = object22.b != null && !object22.b.isEmpty() && !object22.b.equalsIgnoreCase("NULL") ? object22.b + " " + o.h(object22.c) : o.h(object22.c);
                if (((String)object3).trim().isEmpty()) {
                    object3 = ((String)object2).isEmpty() ? "USB Drive" : (String)object2 + " USB Drive";
                }
                String string3 = ((String)object).isEmpty() ? "-" : ((String)object).toUpperCase();
                String string4 = string2 = string.isEmpty() ? "-" : string.toUpperCase();
                Object object4 = ((String)object2).isEmpty() ? (((String)object).isEmpty() ? o.i(object22.b) : string3) : object2;
                String productNameFinal = productName.isEmpty() ? o.i(object22.c) : productName;
                String string5 = o.a(object22.h);
                String string6 = object22.i == null ? "-" : o.g(object22.i);
                String string7 = object22.j == null ? "-" : o.g(object22.j);
                arrayList.add(new r(((String)object3).trim(), "USB Mass Storage", (String)object4, productNameFinal, o.i(object22.a), string3, string2, string7, string6, string5, o.i(object22.f), o.i(object22.d), o.i(object22.g)));
                if (object22.a == null || object22.a.isEmpty()) continue;
                hashSet.add(object22.a.toLowerCase());
            }
            List<r> list = o.a(hashMap, hashMap2, map);
            Iterator iterator = list.iterator();
            while (iterator.hasNext()) {
                object = (r)iterator.next();
                string = ((r)object).getSerialNumber();
                if (string != null && !string.equals("-") && hashSet.contains(string.toLowerCase())) continue;
                arrayList.add((r)object);
            }
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
        return arrayList;
    }

    private static void a(List<a> list) {
        String string2;
        LinkedHashMap<String, List<a>> linkedHashMap = new LinkedHashMap<String, List<a>>();
        for (a object : list) {
            if (object.a == null || object.a.isEmpty()) continue;
            string2 = object.a.toLowerCase();
            linkedHashMap.computeIfAbsent(string2, string -> new ArrayList<a>()).add(object);
        }
        for (List<a> list2 : linkedHashMap.values()) {
            string2 = null;
            String string3 = null;
            String string4 = null;
            String string5 = null;
            String string6 = null;
            String string7 = null;
            long l2 = 0L;
            for (a a4 : list2) {
                if (string2 == null && a4.b != null && !a4.b.isEmpty() && !a4.b.equalsIgnoreCase("NULL")) {
                    string2 = a4.b;
                }
                if (string3 == null && a4.c != null && !a4.c.isEmpty()) {
                    string3 = a4.c;
                }
                if (string4 == null && a4.d != null && !a4.d.isEmpty()) {
                    string4 = a4.d;
                }
                if (string5 == null && a4.e != null && !a4.e.isEmpty()) {
                    string5 = a4.e;
                }
                if (string6 == null && a4.f != null && !a4.f.isEmpty()) {
                    string6 = a4.f;
                }
                if (string7 == null && a4.g != null && !a4.g.isEmpty()) {
                    string7 = a4.g;
                }
                if (l2 > 0L || a4.h <= 0L) continue;
                l2 = a4.h;
            }
            list2.sort((a2, a3) -> {
                if (a2.i == null && a3.i == null) {
                    return 0;
                }
                if (a2.i == null) {
                    return 1;
                }
                if (a3.i == null) {
                    return -1;
                }
                return a2.i.compareTo(a3.i);
            });
            for (int i2 = 0; i2 < list2.size() - 1; ++i2) {
                ((a)list2.get((int)i2)).j = ((a)list2.get((int)(i2 + 1))).i;
            }
            for (a a4 : list2) {
                if ((a4.b == null || a4.b.isEmpty() || a4.b.equalsIgnoreCase("NULL")) && string2 != null) {
                    a4.b = string2;
                }
                if ((a4.c == null || a4.c.isEmpty()) && string3 != null) {
                    a4.c = string3;
                }
                if ((a4.d == null || a4.d.isEmpty()) && string4 != null) {
                    a4.d = string4;
                }
                if ((a4.e == null || a4.e.isEmpty()) && string5 != null) {
                    a4.e = string5;
                }
                if ((a4.f == null || a4.f.isEmpty()) && string6 != null) {
                    a4.f = string6;
                }
                if ((a4.g == null || a4.g.isEmpty()) && string7 != null) {
                    a4.g = string7;
                }
                if (a4.h > 0L || l2 <= 0L) continue;
                a4.h = l2;
            }
        }
    }

    private static void b(List<a> list) {
        try {
            String[] stringArray;
            String string = o.a("Microsoft-Windows-Partition/Diagnostic", 1006);
            if (string == null || string.isEmpty()) {
                return;
            }
            for (String string2 : stringArray = d.split(string)) {
                String string3;
                String string4;
                int n2;
                Map<String, String> map;
                String string5;
                if (string2.trim().isEmpty() || !string2.contains("<Event") || (string5 = (map = o.a(string2)).getOrDefault("BusType", "")).isEmpty()) continue;
                try {
                    n2 = Integer.parseInt(string5);
                }
                catch (NumberFormatException numberFormatException) {
                    continue;
                }
                if (n2 != 7 || (string4 = map.getOrDefault("SerialNumber", "").trim()).isEmpty()) continue;
                String string6 = o.b(string2);
                a a2 = new a();
                a2.a = string4;
                a2.b = map.getOrDefault("Manufacturer", "");
                a2.c = map.getOrDefault("Model", "");
                a2.d = map.getOrDefault("Revision", "");
                a2.e = o.c(map.getOrDefault("ParentId", ""));
                a2.i = string6;
                String string7 = map.getOrDefault("Capacity", "");
                if (!string7.isEmpty()) {
                    try {
                        a2.h = Long.parseLong(string7);
                    }
                    catch (NumberFormatException numberFormatException) {
                        // empty catch block
                    }
                }
                String string8 = map.getOrDefault("PartitionStyle", "");
                String string9 = map.getOrDefault("PartitionTable", "").trim();
                if (!string9.isEmpty() && (string3 = o.a(string8, string9)) != null && !string3.isEmpty()) {
                    a2.f = string3;
                }
                list.add(a2);
            }
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    private static void c(List<a> list) {
        try {
            String[] stringArray;
            String string = o.a("Microsoft-Windows-Storsvc/Diagnostic", 1002);
            if (string == null || string.isEmpty()) {
                return;
            }
            for (String string2 : stringArray = d.split(string)) {
                String string3;
                String string4;
                String string5;
                String string6;
                String string7;
                String string8;
                int n2;
                Map<String, String> map;
                String string9;
                if (string2.trim().isEmpty() || !string2.contains("<Event") || (string9 = (map = o.a(string2)).getOrDefault("BusType", "")).isEmpty()) continue;
                try {
                    n2 = Integer.parseInt(string9);
                }
                catch (NumberFormatException numberFormatException) {
                    continue;
                }
                if (n2 != 7 || (string8 = map.getOrDefault("SerialNumber", "").trim()).isEmpty()) continue;
                String string10 = o.b(string2);
                a a2 = new a();
                a2.a = string8;
                a2.i = string10;
                String string11 = map.getOrDefault("VendorId", "").trim();
                String string12 = map.getOrDefault("ProductId", "").trim();
                if (!string11.isEmpty() && !string11.equalsIgnoreCase("NULL")) {
                    a2.b = string11;
                }
                if (!string12.isEmpty()) {
                    a2.c = string12;
                }
                if (!(string7 = map.getOrDefault("ProductRevision", "")).isEmpty()) {
                    a2.d = string7;
                }
                if (!(string6 = map.getOrDefault("FileSystem", "").trim()).isEmpty()) {
                    a2.f = string6;
                }
                if (!(string5 = o.c(map.getOrDefault("ParentId", ""))).isEmpty()) {
                    a2.e = string5;
                }
                if (!(string4 = map.getOrDefault("Size", "")).isEmpty()) {
                    try {
                        a2.h = Long.parseLong(string4);
                    }
                    catch (NumberFormatException numberFormatException) {
                        // empty catch block
                    }
                }
                if (!(string3 = map.getOrDefault("DriveLetter", "").trim()).isEmpty()) {
                    a2.g = string3;
                }
                list.add(a2);
            }
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    private static String a(String string, int n2) {
        try {
            String string2 = "*[System[EventID=" + n2 + "]]";
            ProcessBuilder processBuilder = new ProcessBuilder("wevtutil", "qe", string, "/q:" + string2, "/f:xml", "/rd:true", "/c:500");
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            StringBuilder stringBuilder = new StringBuilder();
            try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));){
                String string3;
                while ((string3 = bufferedReader.readLine()) != null) {
                    stringBuilder.append(string3).append("\n");
                }
            }
            boolean bl = process.waitFor(30L, TimeUnit.SECONDS);
            if (!bl) {
                process.destroyForcibly();
                return null;
            }
            int n3 = process.exitValue();
            if (n3 != 0) {
                return null;
            }
            return stringBuilder.toString();
        }
        catch (Exception exception) {
            exception.printStackTrace();
            return null;
        }
    }

    private static Map<String, String> a(String string) {
        LinkedHashMap<String, String> linkedHashMap = new LinkedHashMap<String, String>();
        Matcher matcher = b.matcher(string);
        while (matcher.find()) {
            linkedHashMap.put(matcher.group(1), matcher.group(2));
        }
        return linkedHashMap;
    }

    private static String b(String string) {
        Matcher matcher = c.matcher(string);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private static String c(String string) {
        if (string == null) {
            return "";
        }
        return string.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">");
    }

    private static List<r> a(Map<String, String> map, Map<String, String> map2, Map<String, String[]> map3) {
        ArrayList<r> arrayList = new ArrayList<r>();
        try {
            String string = o.a("HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR", true);
            if (string == null || string.isEmpty()) {
                return arrayList;
            }
            List<b> list = o.d(string);
            for (b b2 : list) {
                String string2;
                String[] stringArray2;
                String string3 = b2.a;
                if (string3.equalsIgnoreCase("HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR") || (stringArray2 = (string2 = string3.substring("HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR".length() + 1)).split("\\\\")).length != 2) continue;
                String string4 = stringArray2[0];
                String string5 = stringArray2[1];
                String vendorName = o.b(string4, "Ven_");
                String productName = o.b(string4, "Prod_");
                String string7 = string5;
                int n2 = string5.lastIndexOf(38);
                if (n2 > 0 && string5.substring(n2 + 1).matches("\\d+")) {
                    string7 = string5.substring(0, n2);
                }
                String friendlyName = b2.b.getOrDefault("FriendlyName", "");
                if (friendlyName.isEmpty()) {
                    friendlyName = vendorName + " " + productName;
                }
                String string8 = b2.b.getOrDefault("HardwareID", "");
                String vid = "";
                String pid = "";
                if (!string8.isEmpty()) {
                    Matcher matcher = a.matcher(string8);
                    if (matcher.find()) {
                        vid = matcher.group(1).toLowerCase();
                        pid = matcher.group(2).toLowerCase();
                    }
                }
                if (vid.isEmpty() && map3.containsKey(string7.toLowerCase())) {
                    String[] vidPid = map3.get(string7.toLowerCase());
                    vid = vidPid[0];
                    pid = vidPid[1];
                }
                if (vid.isEmpty() && map3.containsKey(string5.toLowerCase())) {
                    String[] vidPid = map3.get(string5.toLowerCase());
                    vid = vidPid[0];
                    pid = vidPid[1];
                }
                String vendorNameFull = vid.isEmpty() ? "" : map.getOrDefault(vid, "");
                String productNameFull = pid.isEmpty() ? "" : map2.getOrDefault(vid + ":" + pid, "");
                String string12 = b2.b.getOrDefault("DeviceDesc", "USB Mass Storage");
                if (string12.contains(";")) {
                    string12 = string12.substring(string12.lastIndexOf(59) + 1).trim();
                }
                String string13 = vid.isEmpty() ? "-" : vid.toUpperCase();
                String string14 = pid.isEmpty() ? "-" : pid.toUpperCase();
                String finalVendor = vendorNameFull.isEmpty() ? vendorName : vendorNameFull;
                String finalProduct = productNameFull.isEmpty() ? productName : productNameFull;
                String friendlyTrimmed = friendlyName.trim();
                if (friendlyTrimmed.isEmpty()) {
                    friendlyTrimmed = vendorName + " " + productName;
                }
                arrayList.add(new r(friendlyTrimmed, string12, finalVendor, finalProduct, string7, string13, string14, "-", "-", "-", "-", "-", "-"));
            }
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
        return arrayList;
    }

    private static Map<String, String[]> b() {
        HashMap<String, String[]> hashMap = new HashMap<String, String[]>();
        try {
            String string = o.a("HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USB", false);
            if (string == null) {
                return hashMap;
            }
            for (String string2 : string.split("\\r?\\n")) {
                String string3;
                Matcher matcher;
                if (!(string2 = string2.trim()).startsWith("HKLM\\") && !string2.startsWith("HKEY_LOCAL_MACHINE\\") || !string2.contains("VID_") || !(matcher = a.matcher(string2)).find()) continue;
                String string4 = matcher.group(1).toLowerCase();
                String string5 = matcher.group(2).toLowerCase();
                if (string2.contains("MI_") || (string3 = o.a(string2, false)) == null) continue;
                for (String string6 : string3.split("\\r?\\n")) {
                    if (!(string6 = string6.trim()).startsWith("HKLM\\") && !string6.startsWith("HKEY_LOCAL_MACHINE\\") || string6.equalsIgnoreCase(string2)) continue;
                    String string7 = string6.substring(string6.lastIndexOf(92) + 1).toLowerCase();
                    hashMap.put(string7, new String[]{string4, string5});
                    int n2 = string7.lastIndexOf(38);
                    if (n2 <= 0 || !string7.substring(n2 + 1).matches("\\d+")) continue;
                    hashMap.put(string7.substring(0, n2), new String[]{string4, string5});
                }
            }
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
        return hashMap;
    }

    private static String a(String string, boolean bl) {
        try {
            ArrayList<String> arrayList = new ArrayList<String>();
            arrayList.add("reg");
            arrayList.add("query");
            arrayList.add(string);
            if (bl) {
                arrayList.add("/s");
            }
            ProcessBuilder processBuilder = new ProcessBuilder(arrayList);
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            StringBuilder stringBuilder = new StringBuilder();
            try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream(), Charset.forName("UTF-8")));){
                String string2;
                while ((string2 = bufferedReader.readLine()) != null) {
                    stringBuilder.append(string2).append("\n");
                }
            }
            if (!process.waitFor(30L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
            return stringBuilder.toString();
        }
        catch (Exception exception) {
            exception.printStackTrace();
            return null;
        }
    }

    private static List<b> d(String string) {
        ArrayList<b> arrayList = new ArrayList<b>();
        b b2 = null;
        for (String string2 : string.split("\\r?\\n")) {
            String string3;
            String[] stringArray;
            if (string2.trim().isEmpty()) continue;
            if ((string2.startsWith("HKLM\\") || string2.startsWith("HKEY_LOCAL_MACHINE\\")) && !string2.contains("    ")) {
                b2 = new b(string2.trim());
                arrayList.add(b2);
                continue;
            }
            if (b2 == null || !string2.startsWith("    ") || (stringArray = (string3 = string2.trim()).split("\\s{2,}", 3)).length < 3) continue;
            b2.b.put(stringArray[0].trim(), stringArray[2].trim());
        }
        return arrayList;
    }

    private static void a(Map<String, String> map, Map<String, String> map2) {
        try {
            long l2;
            Path path = Paths.get(System.getProperty("java.io.tmpdir"), "AtlasHileKontrol");
            Path path2 = path.resolve("usb.ids");
            List<String> list = null;
            if (Files.exists(path2, new LinkOption[0]) && (l2 = System.currentTimeMillis() - Files.getLastModifiedTime(path2, new LinkOption[0]).toMillis()) < 604800000L) {
                list = Files.readAllLines(path2, StandardCharsets.UTF_8);
            }
            if (list == null) {
                list = o.a(path, path2);
            }
            if (list == null) {
                return;
            }
            String string = null;
            for (String string2 : list) {
                if (string2.startsWith("#") || string2.trim().isEmpty()) continue;
                if (!string2.startsWith("C ")) {
                    String string3;
                    if (string2.startsWith("\t\t")) continue;
                    if (string2.startsWith("\t")) {
                        if (string == null || (string3 = string2.substring(1).trim()).length() < 6) continue;
                        String string4 = string3.substring(0, 4).toLowerCase();
                        String string5 = string3.substring(4).trim();
                        map2.put(string + ":" + string4, string5);
                        continue;
                    }
                    if (string2.length() >= 6 && o.f(string2.substring(0, 4))) {
                        string = string2.substring(0, 4).toLowerCase();
                        string3 = string2.substring(4).trim();
                        map.put(string, string3);
                        continue;
                    }
                    string = null;
                    continue;
                }
                break;
            }
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    private static String a(String string, String string2) {
        try {
            if (string2 == null || string2.length() < 20) {
                return null;
            }
            int n2 = 0;
            try {
                n2 = Integer.parseInt(string);
            }
            catch (Exception exception) {
                // empty catch block
            }
            byte[] byArray = o.e(string2);
            if (byArray == null || byArray.length < 16) {
                return null;
            }
            if (n2 == 0) {
                String string3 = o.a(byArray);
                return string3;
            }
            if (n2 == 1) {
                return null;
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        return null;
    }

    private static String a(byte[] byArray) {
        int n2;
        int n3;
        int[] nArray = new int[]{156, 144, 128, 112};
        int[] nArray2 = new int[]{32, 72, 48, 80};
        for (n3 = 0; n3 < nArray.length; ++n3) {
            n2 = nArray[n3];
            int n4 = nArray2[n3];
            for (int n5 : new int[]{8, 0, 4}) {
                if (n5 + n2 > byArray.length) continue;
                int n6 = n5;
                while (n6 + n4 < byArray.length) {
                    int n7 = byArray[n6 + n4] & 0xFF;
                    String string = o.a(n7);
                    if (string != null) {
                        return string;
                    }
                    n6 += n2;
                }
            }
        }
        for (n3 = 0; n3 < byArray.length; ++n3) {
            n2 = byArray[n3] & 0xFF;
            if (n2 != 12 && n2 != 11 || n3 < 4 || !o.a(byArray, n3)) continue;
            return "FAT32";
        }
        for (n3 = 0; n3 < byArray.length; ++n3) {
            n2 = byArray[n3] & 0xFF;
            if (n2 != 7 || n3 < 4 || !o.a(byArray, n3)) continue;
            return "NTFS";
        }
        return null;
    }

    private static boolean a(byte[] byArray, int n2) {
        int n3 = 0;
        int n4 = Math.max(0, n2 - 4);
        int n5 = Math.min(byArray.length, n2 + 4);
        for (int i2 = n4; i2 < n5; ++i2) {
            if (i2 == n2 || byArray[i2] != 0) continue;
            ++n3;
        }
        return n3 >= 2;
    }

    private static String a(int n2) {
        switch (n2) {
            case 1: 
            case 4: 
            case 6: 
            case 14: {
                return "FAT16";
            }
            case 11: 
            case 12: {
                return "FAT32";
            }
            case 7: {
                return "NTFS";
            }
            case 131: {
                return "EXT";
            }
            case 130: {
                return "Linux Swap";
            }
            case 175: {
                return "HFS+";
            }
        }
        return null;
    }

    private static byte[] e(String string) {
        try {
            if (string.length() % 2 != 0) {
                return null;
            }
            byte[] byArray = new byte[string.length() / 2];
            for (int i2 = 0; i2 < byArray.length; ++i2) {
                byArray[i2] = (byte)Integer.parseInt(string.substring(i2 * 2, i2 * 2 + 2), 16);
            }
            return byArray;
        }
        catch (Exception exception) {
            return null;
        }
    }

    private static List<String> a(Path path, Path path2) {
        try {
            URL uRL = URI.create("http://www.linux-usb.org/usb.ids").toURL();
            HttpURLConnection httpURLConnection = (HttpURLConnection)uRL.openConnection();
            httpURLConnection.setRequestMethod("GET");
            httpURLConnection.setConnectTimeout(5000);
            httpURLConnection.setReadTimeout(10000);
            if (httpURLConnection.getResponseCode() != 200) {
                return null;
            }
            ArrayList<String> arrayList = new ArrayList<String>();
            try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream(), StandardCharsets.UTF_8));){
                String string;
                while ((string = bufferedReader.readLine()) != null) {
                    arrayList.add(string);
                }
            }
            Files.createDirectories(path, new FileAttribute[0]);
            Files.write(path2, arrayList, StandardCharsets.UTF_8, new OpenOption[0]);
            return arrayList;
        }
        catch (Exception exception) {
            exception.printStackTrace();
            return null;
        }
    }

    private static boolean f(String string) {
        for (char c2 : string.toCharArray()) {
            if (c2 >= '0' && c2 <= '9' || c2 >= 'a' && c2 <= 'f' || c2 >= 'A' && c2 <= 'F') continue;
            return false;
        }
        return true;
    }

    private static String b(String string, String string2) {
        int n2 = string.indexOf(string2);
        if (n2 < 0) {
            return "";
        }
        int n3 = n2 + string2.length();
        int n4 = string.indexOf(38, n3);
        if (n4 < 0) {
            n4 = string.length();
        }
        return string.substring(n3, n4).replace('_', ' ').trim();
    }

    private static String g(String string) {
        if (string == null || string.isEmpty()) {
            return "-";
        }
        try {
            Instant instant = Instant.parse(string);
            return e.format(instant);
        }
        catch (Exception exception) {
            String string2 = string.replace("T", " ");
            int n2 = string2.indexOf(".");
            if (n2 != -1) {
                string2 = string2.substring(0, n2);
            } else if (string2.endsWith("Z")) {
                string2 = string2.substring(0, string2.length() - 1);
            }
            return string2;
        }
    }

    private static String a(long l2) {
        if (l2 <= 0L) {
            return "-";
        }
        double d2 = (double)l2 / 1.073741824E9;
        if (d2 >= 1.0) {
            return String.format("%.1f GB", d2);
        }
        double d3 = (double)l2 / 1048576.0;
        return String.format("%.1f MB", d3);
    }

    private static String h(String string) {
        return string == null ? "" : string;
    }

    private static String i(String string) {
        return string == null || string.isEmpty() || string.equalsIgnoreCase("NULL") ? "-" : string;
    }

    private static /* synthetic */ String _ndcj(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xD1;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 372230547 + 1984147545 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    private static class a {
        String a;
        String b;
        String c;
        String d;
        String e;
        String f;
        String g;
        long h;
        String i;
        String j;

        private a() {
        }
    }

    private static class b {
        final String a;
        final Map<String, String> b = new LinkedHashMap<String, String>();

        b(String string) {
            this.a = string;
        }
    }
}


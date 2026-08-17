/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;
import java.io.File;
import java.io.Serializable;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import util.I18n;

public class l {
    private static final Set<String> a = Set.of(".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".cab", ".iso");
    private static final Map<String, String> b = Map.of("AB58EA128BA92CA69A31B36B4E545653EED2A6CF", "github.com");
    private static final long[] c = new long[]{0L, 0x800000L, 32768L, 0x808000L, 128L, 0x800080L, 32896L, 0xC0C0C0L, 0x808080L, 0xFF0000L, 65280L, 0xFFFF00L, 255L, 0xFF00FFL, 65535L, 0xFFFFFFL};

    public static List<String> a() {
        ArrayList<String> arrayList = new ArrayList<String>();
        try {
            String[] stringArray;
            String string = "SYSTEM\\MountedDevices";
            for (String string2 : stringArray = Advapi32Util.registryGetValues(WinReg.HKEY_LOCAL_MACHINE, string).keySet().toArray(new String[0])) {
                if (!string2.startsWith("\\??\\Volume") && !string2.contains("\\DosDevices\\")) continue;
                arrayList.add(string2);
            }
        }
        catch (Exception exception) {
            arrayList.add(String.format(I18n.a("regedit.readError"), exception.getMessage()));
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> b() {
        Object[][] objectArrayArray;
        ArrayList<String> arrayList = new ArrayList<String>();
        for (Object[] objectArray : objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "Software\\WinRAR\\ArcHistory"}, {WinReg.HKEY_CURRENT_USER, "Software\\WinRAR\\DialogEditHistory\\ArcName"}, {WinReg.HKEY_CURRENT_USER, "Software\\7-Zip\\Extraction\\PathHistory"}, {WinReg.HKEY_CURRENT_USER, "Software\\Bandizip\\Settings\\RecentFiles"}}) {
            WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
            String string = (String)objectArray[1];
            try {
                if (!Advapi32Util.registryKeyExists(hKEY, string)) continue;
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string);
                boolean bl = false;
                for (Object object : treeMap.values()) {
                    if (!(object instanceof String)) continue;
                    arrayList.add((String)object);
                    bl = true;
                }
                if (!bl) continue;
                arrayList.add("");
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> c() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string = "Software\\Microsoft\\DirectInput";
        try {
            if (Advapi32Util.registryKeyExists(WinReg.HKEY_CURRENT_USER, string)) {
                String[] stringArray;
                for (String string2 : stringArray = Advapi32Util.registryGetKeys(WinReg.HKEY_CURRENT_USER, string)) {
                    arrayList.add(string2);
                }
            }
        }
        catch (Exception exception) {
            arrayList.add(String.format(I18n.a("regedit.readError"), exception.getMessage()));
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> d() {
        Object[][] objectArrayArray;
        ArrayList<String> arrayList = new ArrayList<String>();
        for (Object[] objectArray : objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run"}, {WinReg.HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"}}) {
            WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
            String string = (String)objectArray[1];
            String string2 = (hKEY == WinReg.HKEY_CURRENT_USER ? "HKCU" : "HKLM") + "\\" + string;
            arrayList.add("--- " + string2 + " ---");
            try {
                if (!Advapi32Util.registryKeyExists(hKEY, string)) {
                    arrayList.add("");
                    continue;
                }
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string);
                for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                    String string3 = entry.getValue() instanceof String ? "REG_SZ" : "REG_EXPAND_SZ";
                    arrayList.add(String.format("%-25s %-10s %s", entry.getKey(), string3, entry.getValue()));
                }
            }
            catch (Exception exception) {
                arrayList.add(String.format(I18n.a("regedit.readError"), exception.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    public static List<String> e() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string = "SYSTEM\\CurrentControlSet\\Services\\bam\\State\\UserSettings";
        try {
            String[] stringArray;
            if (!Advapi32Util.registryKeyExists(WinReg.HKEY_LOCAL_MACHINE, string)) {
                arrayList.add(I18n.a("regedit.noMatch"));
                return arrayList;
            }
            for (String string2 : stringArray = Advapi32Util.registryGetKeys(WinReg.HKEY_LOCAL_MACHINE, string)) {
                String string3 = string + "\\" + string2;
                arrayList.add("\n[HKLM\\" + string3 + "]");
                try {
                    TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(WinReg.HKEY_LOCAL_MACHINE, string3);
                    for (String string4 : treeMap.keySet()) {
                        arrayList.add(string4);
                    }
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
        }
        catch (Exception exception) {
            arrayList.add(String.format(I18n.a("regedit.readError"), exception.getMessage()));
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> f() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string = "Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer";
        String string2 = string + "\\DisallowRun";
        try {
            if (Advapi32Util.registryKeyExists(WinReg.HKEY_CURRENT_USER, string)) {
                Object object = Advapi32Util.registryGetValues(WinReg.HKEY_CURRENT_USER, string).get("DisallowRun");
                if (object instanceof Integer && (Integer)object == 1) {
                    arrayList.add("HKCU\\" + string + " -> DisallowRun = 1");
                    arrayList.add("");
                }
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        try {
            if (Advapi32Util.registryKeyExists(WinReg.HKEY_CURRENT_USER, string2)) {
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(WinReg.HKEY_CURRENT_USER, string2);
                for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                    String string3 = entry.getValue() != null ? entry.getValue().toString() : "";
                    if (string3.trim().isEmpty()) continue;
                    arrayList.add(string3 + " (#" + entry.getKey() + ")");
                }
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> g() {
        Object object;
        Object[][] objectArrayArray;
        ArrayList<String> arrayList = new ArrayList<String>();
        String string = "SOFTWARE\\Microsoft\\Command Processor";
        Object[][] objectArrayArray2 = objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "HKCU"}, {WinReg.HKEY_LOCAL_MACHINE, "HKLM"}};
        int n2 = objectArrayArray2.length;
        for (int i2 = 0; i2 < n2; ++i2) {
            Object[] objectArray = objectArrayArray2[i2];
            WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
            object = (String)objectArray[1];
            try {
                Object object2;
                if (!Advapi32Util.registryKeyExists(hKEY, string) || (object2 = Advapi32Util.registryGetValues(hKEY, string).get("AutoRun")) == null || object2.toString().trim().isEmpty()) continue;
                arrayList.add((String)object + "\\" + string);
                arrayList.add("  AutoRun = '" + String.valueOf(object2) + "'");
                arrayList.add("");
                continue;
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        for (Object[] objectArray2 : objectArrayArray2 = new String[][]{{"Software\\Microsoft\\Windows\\CurrentVersion\\Run"}, {"Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce"}, {"SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run"}}) {
            object = objectArray2[0];
            for (Object[] objectArray : objectArrayArray) {
                WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
                String string2 = (String)objectArray[1];
                try {
                    if (!Advapi32Util.registryKeyExists(hKEY, (String)object)) continue;
                    TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, (String)object);
                    for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                        String string3;
                        String string4 = string3 = entry.getValue() != null ? entry.getValue().toString().toLowerCase() : "";
                        if (!string3.contains("taskkill") && !string3.contains("tskill")) continue;
                        arrayList.add(string2 + "\\" + (String)object);
                        arrayList.add("  '" + entry.getKey() + "' = '" + String.valueOf(entry.getValue()) + "'");
                        arrayList.add("");
                    }
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> h() {
        String[] stringArray;
        ArrayList<String> arrayList = new ArrayList<String>();
        for (String string : stringArray = new String[]{"Console", "Console\\%SystemRoot%_system32_cmd.exe"}) {
            try {
                int n2;
                long l2;
                if (!Advapi32Util.registryKeyExists(WinReg.HKEY_CURRENT_USER, string)) continue;
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(WinReg.HKEY_CURRENT_USER, string);
                long[] lArray = new long[16];
                boolean bl = false;
                for (int i2 = 0; i2 < 16; ++i2) {
                    String string2 = String.format("ColorTable%02d", i2);
                    Object object = treeMap.get(string2);
                    if (object instanceof Integer) {
                        lArray[i2] = Integer.toUnsignedLong((Integer)object);
                        if (lArray[i2] == c[i2]) continue;
                        bl = true;
                        continue;
                    }
                    lArray[i2] = c[i2];
                }
                Object object = treeMap.get("ScreenColors");
                int n3 = object instanceof Integer ? (Integer)object : 7;
                int n4 = n3 & 0xF;
                long l3 = lArray[n4];
                if (l3 == (l2 = lArray[n2 = n3 >> 4 & 0xF])) {
                    arrayList.add("HKCU\\" + string);
                    arrayList.add("  " + I18n.a("regedit.bypass.cmdColorFg") + ": " + l.a(n4) + " = " + I18n.a("regedit.bypass.cmdColorBg") + ": " + l.a(n2) + " (invisible)");
                    arrayList.add("");
                } else {
                    double d2;
                    double d3 = l.a(l3);
                    if (Math.abs(d3 - (d2 = l.a(l2))) < 30.0) {
                        arrayList.add("HKCU\\" + string);
                        arrayList.add("  " + l.a(n4) + " <-> " + l.a(n2) + " (low contrast)");
                        arrayList.add("");
                    }
                }
                if (!bl) continue;
                boolean bl2 = true;
                for (long l4 : lArray) {
                    if (!(l.a(l4) >= 20.0)) continue;
                    bl2 = false;
                    break;
                }
                if (!bl2) continue;
                arrayList.add("HKCU\\" + string);
                arrayList.add("  Palette darkened to near-black");
                arrayList.add("");
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> i() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string = "SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters";
        try {
            if (!Advapi32Util.registryKeyExists(WinReg.HKEY_LOCAL_MACHINE, string)) {
                arrayList.add(I18n.a("regedit.bypass.prefetchKeyMissing"));
                return arrayList;
            }
            Object object = Advapi32Util.registryGetValues(WinReg.HKEY_LOCAL_MACHINE, string).get("EnablePrefetcher");
            if (object instanceof Integer) {
                int n2 = (Integer)object;
                if (n2 == 0) {
                    arrayList.add("EnablePrefetcher = 0 (" + I18n.a("regedit.bypass.prefetchFullyDisabled") + ")");
                } else if (n2 == 1) {
                    arrayList.add("EnablePrefetcher = 1 (" + I18n.a("regedit.bypass.prefetchBootOnly") + ")");
                }
            }
        }
        catch (Exception exception) {
            arrayList.add(String.format(I18n.a("regedit.readError"), exception.getMessage()));
        }
        File file = new File(System.getenv("SystemRoot") + "\\Prefetch");
        if (file.exists() && file.isDirectory()) {
            File[] fileArray = file.listFiles();
            if (fileArray != null) {
                for (File file2 : fileArray) {
                    if (!file2.getName().toLowerCase().endsWith(".pf")) continue;
                    try {
                        boolean bl = (Boolean)Files.getAttribute(file2.toPath(), "dos:readonly", new LinkOption[0]);
                        if (!bl) continue;
                        arrayList.add(file2.getName() + " (read-only)");
                    }
                    catch (Exception exception) {
                        // empty catch block
                    }
                }
            }
        }
        return arrayList;
    }

    public static List<String> j() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String[] stringArray = new String[]{"SOFTWARE\\Microsoft\\SystemCertificates\\Disallowed\\Certificates", "SOFTWARE\\Policies\\Microsoft\\SystemCertificates\\Disallowed\\Certificates"};
        Object[][] objectArrayArray = new Object[][]{{WinReg.HKEY_LOCAL_MACHINE, "HKLM"}, {WinReg.HKEY_CURRENT_USER, "HKCU"}};
        for (String string : stringArray) {
            for (Object[] objectArray : objectArrayArray) {
                WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
                String string2 = (String)objectArray[1];
                try {
                    String[] stringArray2;
                    if (!Advapi32Util.registryKeyExists(hKEY, string)) continue;
                    for (String string3 : stringArray2 = Advapi32Util.registryGetKeys(hKEY, string)) {
                        String string4 = string3.toUpperCase().replace(" ", "");
                        String string5 = b.get(string4);
                        if (string5 != null) {
                            arrayList.add(string5 + " (" + string4 + ")");
                        } else {
                            arrayList.add(string4);
                        }
                        arrayList.add("  " + string2 + "\\" + string + "\\" + string3);
                        arrayList.add("");
                    }
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    /*
     * WARNING - void declaration
     */
    public static List<String> k() {
        int var5_9 = 0;
        ArrayList<String> arrayList = new ArrayList<String>();
        Object[][] objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "HKCU"}, {WinReg.HKEY_LOCAL_MACHINE, "HKLM"}};
        String string = "Software\\Policies\\Microsoft\\Windows\\System";
        Object[][] object = objectArrayArray;
        int object2 = object.length;
        boolean bl = false;
        while (var5_9 < object2) {
            Object[] objectArray = object[var5_9];
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string, "DisableCMD", I18n.a("regedit.bypass.gpoCmdDisabled"));
            ++var5_9;
        }
        String string2 = "Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System";
        for (Object[] objectArray : objectArrayArray) {
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string2, "DisableRegistryTools", I18n.a("regedit.bypass.gpoRegeditDisabled"));
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string2, "DisableTaskMgr", I18n.a("regedit.bypass.gpoTaskMgrDisabled"));
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string2, "NoDispCPL", I18n.a("regedit.bypass.gpoControlPanelDisabled"));
        }
        String string3 = "Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer";
        for (Object[] objectArray : objectArrayArray) {
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string3, "NoControlPanel", I18n.a("regedit.bypass.gpoControlPanelBlocked"));
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string3, "NoRun", I18n.a("regedit.bypass.gpoRunDisabled"));
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string3, "NoFind", I18n.a("regedit.bypass.gpoSearchDisabled"));
            l.a(arrayList, (WinReg.HKEY)objectArray[0], (String)objectArray[1], string3, "NoFolderOptions", I18n.a("regedit.bypass.gpoFolderOptHidden"));
        }
        String string4 = "Software\\Policies\\Microsoft\\Windows\\PowerShell";
        for (Object[] objectArray : objectArrayArray) {
            WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
            String string5 = (String)objectArray[1];
            try {
                Object object3;
                if (!Advapi32Util.registryKeyExists(hKEY, string4)) continue;
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string4);
                Object object4 = treeMap.get("ExecutionPolicy");
                if (object4 != null && (((String)(object3 = object4.toString())).equalsIgnoreCase("Restricted") || ((String)object3).equalsIgnoreCase("AllSigned"))) {
                    arrayList.add(string5 + "\\" + string4 + " -> ExecutionPolicy = '" + (String)object3 + "'");
                    arrayList.add("");
                }
                if (!((object3 = treeMap.get("EnableScripts")) instanceof Integer) || (Integer)object3 != 0) continue;
                arrayList.add(string5 + "\\" + string4 + " -> EnableScripts = 0");
                arrayList.add("");
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> l() {
        Object object;
        ArrayList<String> arrayList = new ArrayList<String>();
        String[] stringArray = new String[]{"NoFirewallPage", "DisallowFirewall", "NC_AllowAdvancedTCPIPConfig", "NC_AddDeleteComponents", "NC_ChangeBindState"};
        Set<String> set = Set.of(stringArray);
        String[] stringArray2 = new String[]{"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer", "SOFTWARE\\Policies\\Microsoft\\Windows\\System"};
        Object[][] objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "HKCU"}, {WinReg.HKEY_LOCAL_MACHINE, "HKLM"}};
        for (String string : stringArray2) {
            for (Object[] objectArray : objectArrayArray) {
                WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
                String string2 = (String)objectArray[1];
                try {
                    if (!Advapi32Util.registryKeyExists(hKEY, string)) continue;
                    object = Advapi32Util.registryGetValues(hKEY, string);
                    for (Map.Entry<String, Object> entry : ((TreeMap<String, Object>)object).entrySet()) {
                        if (!set.contains(entry.getKey())) continue;
                        arrayList.add(entry.getKey() + " = " + String.valueOf(entry.getValue()));
                        arrayList.add("  " + string2 + "\\" + string);
                        arrayList.add("");
                    }
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
        }
        String string = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\DisallowCpl";
        for (Object[] objectArray : objectArrayArray) {
            WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
            String string3 = (String)objectArray[1];
            try {
                if (!Advapi32Util.registryKeyExists(hKEY, string)) continue;
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string);
                for (Map.Entry entry : treeMap.entrySet()) {
                    object = entry.getValue() != null ? entry.getValue().toString() : "";
                    if (!((String)object).toLowerCase().contains("firewall")) continue;
                    arrayList.add((String)object);
                    arrayList.add("  " + string3 + "\\" + string);
                    arrayList.add("");
                }
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> m() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String[][] stringArrayArray = new String[][]{{"SOFTWARE\\Policies\\Google\\Chrome", "Chrome"}, {"SOFTWARE\\Policies\\Microsoft\\Edge", "Edge"}, {"SOFTWARE\\Policies\\BraveSoftware\\Brave", "Brave"}, {"SOFTWARE\\Policies\\Vivaldi", "Vivaldi"}};
        Object[][] objectArrayArray = new Object[][]{{WinReg.HKEY_LOCAL_MACHINE, "HKLM"}, {WinReg.HKEY_CURRENT_USER, "HKCU"}};
        for (String[] stringArray : stringArrayArray) {
            String string = stringArray[0];
            String string2 = stringArray[1];
            String string3 = string + "\\URLBlockList";
            String string4 = string + "\\URLAllowList";
            for (Object[] objectArray : objectArrayArray) {
                WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
                String string5 = (String)objectArray[1];
                try {
                    Object object2;
                    if (!Advapi32Util.registryKeyExists(hKEY, string3)) continue;
                    TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string3);
                    for (Map.Entry<String, Object> entry2 : treeMap.entrySet()) {
                        object2 = entry2.getValue() != null ? entry2.getValue().toString() : "";
                        if (((String)object2).trim().isEmpty()) continue;
                        arrayList.add(string2 + ": '" + (String)object2 + "'");
                        arrayList.add("  [" + string5 + "] #" + (String)entry2.getKey());
                    }
                    boolean bl = treeMap.values().stream().anyMatch(object -> object != null && object.toString().trim().equals("*"));
                    if (bl && Advapi32Util.registryKeyExists(hKEY, string4) && !Advapi32Util.registryGetValues(hKEY, string4).isEmpty()) {
                        ArrayList<String> arrayList2 = new ArrayList<String>();
                        for (Object v2 : Advapi32Util.registryGetValues(hKEY, string4).values()) {
                            if (v2 == null || v2.toString().trim().isEmpty()) continue;
                            arrayList2.add(v2.toString());
                        }
                        if (!arrayList2.isEmpty()) {
                            arrayList.add(string2 + " \u2014 allowlist-only mode (* block)");
                            arrayList.add("  Permitted: " + String.join((CharSequence)", ", arrayList2));
                        }
                    }
                    if (treeMap.isEmpty()) continue;
                    arrayList.add("");
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> n() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string = "Software\\WinRAR\\ArcHistory";
        try {
            if (!Advapi32Util.registryKeyExists(WinReg.HKEY_CURRENT_USER, string)) {
                arrayList.add(I18n.a("regedit.noMatch"));
                return arrayList;
            }
            TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(WinReg.HKEY_CURRENT_USER, string);
            for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                String string2;
                String string3 = string2 = entry.getValue() != null ? entry.getValue().toString() : "";
                if (string2.trim().isEmpty()) continue;
                String string4 = "";
                int n2 = string2.lastIndexOf(46);
                if (n2 >= 0) {
                    string4 = string2.substring(n2).toLowerCase();
                }
                if (a.contains(string4)) continue;
                arrayList.add(string2 + " (ext: " + string4 + ")");
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    public static List<String> o() {
        Object object;
        ArrayList<String> arrayList = new ArrayList<String>();
        String[] stringArray = new String[]{"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains", "SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains"};
        Object[][] objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "HKCU"}, {WinReg.HKEY_LOCAL_MACHINE, "HKLM"}};
        String[] stringArray2 = stringArray;
        int n2 = stringArray2.length;
        for (int i2 = 0; i2 < n2; ++i2) {
            String string = stringArray2[i2];
            for (Object[] objectArray : objectArrayArray) {
                object = (WinReg.HKEY)objectArray[0];
                String string2 = (String)objectArray[1];
                try {
                    String[] stringArray3;
                    if (!Advapi32Util.registryKeyExists((WinReg.HKEY)object, string)) continue;
                    for (String string3 : stringArray3 = Advapi32Util.registryGetKeys((WinReg.HKEY)object, string)) {
                        String string4 = string + "\\" + string3;
                        try {
                            TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues((WinReg.HKEY)object, string4);
                            for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                                if (!(entry.getValue() instanceof Integer) || (Integer)entry.getValue() != 4) continue;
                                arrayList.add(string3 + " -> " + entry.getKey() + " = 4 (Restricted)");
                                arrayList.add("  " + string2 + "\\" + string4);
                                arrayList.add("");
                            }
                        }
                        catch (Exception exception) {
                            // empty catch block
                        }
                    }
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
        }
        for (String string : stringArray2 = new String[]{"SOFTWARE\\Policies\\Microsoft\\Internet Explorer\\Security", "SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"}) {
            try {
                if (!Advapi32Util.registryKeyExists(WinReg.HKEY_LOCAL_MACHINE, string)) continue;
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(WinReg.HKEY_LOCAL_MACHINE, string);
                for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                    object = entry.getKey().toLowerCase();
                    if (!((String)object).contains("lock") && !((String)object).contains("disable")) continue;
                    arrayList.add(entry.getKey() + " = " + String.valueOf(entry.getValue()));
                    arrayList.add("  HKLM\\" + string);
                    arrayList.add("");
                }
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("regedit.noMatch"));
        }
        return arrayList;
    }

    private static void a(List<String> list, WinReg.HKEY hKEY, String string, String string2, String string3, String string4) {
        try {
            if (!Advapi32Util.registryKeyExists(hKEY, string2)) {
                return;
            }
            TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string2);
            Object object = treeMap.get(string3);
            if (object instanceof Integer && (Integer)object != 0) {
                list.add(string4);
                list.add("  " + string + "\\" + string2 + " -> " + string3 + " = " + String.valueOf(object));
                list.add("");
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    private static double a(long l2) {
        double d2 = l2 & 0xFFL;
        double d3 = l2 >> 8 & 0xFFL;
        double d4 = l2 >> 16 & 0xFFL;
        return 0.299 * d2 + 0.587 * d3 + 0.114 * d4;
    }

    private static String a(int n2) {
        switch (n2) {
            case 0: {
                return "Black";
            }
            case 1: {
                return "Dark Blue";
            }
            case 2: {
                return "Dark Green";
            }
            case 3: {
                return "Dark Cyan";
            }
            case 4: {
                return "Dark Red";
            }
            case 5: {
                return "Dark Magenta";
            }
            case 6: {
                return "Dark Yellow";
            }
            case 7: {
                return "Gray";
            }
            case 8: {
                return "Dark Gray";
            }
            case 9: {
                return "Blue";
            }
            case 10: {
                return "Green";
            }
            case 11: {
                return "Cyan";
            }
            case 12: {
                return "Red";
            }
            case 13: {
                return "Magenta";
            }
            case 14: {
                return "Yellow";
            }
            case 15: {
                return "White";
            }
        }
        return "Index " + n2;
    }

    private static /* synthetic */ String _tj(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xA3;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2093607121 + 678739925 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


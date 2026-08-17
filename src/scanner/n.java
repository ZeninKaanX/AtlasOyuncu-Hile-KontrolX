/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import util.I18n;

public class n {
    public static List<String> a() {
        ArrayList<String> arrayList = new ArrayList<String>();
        File file2 = new File(System.getenv("SystemRoot") + "\\System32\\drivers\\etc");
        arrayList.add(String.format(I18n.a("detect.folderHeader"), file2.getAbsolutePath()));
        arrayList.add("");
        if (!file2.exists() || !file2.isDirectory()) {
            arrayList.add(I18n.a("sitebypass.hostsNotFound"));
            return arrayList;
        }
        File[] fileArray = file2.listFiles((file, string) -> string.toLowerCase().startsWith("hosts".toLowerCase()));
        if (fileArray == null || fileArray.length == 0) {
            arrayList.add(I18n.a("sitebypass.hostsNotFound"));
            return arrayList;
        }
        for (File file3 : fileArray) {
            if (!file3.isFile()) continue;
            String string2 = file3.getName();
            arrayList.add("[" + string2 + "]");
            try {
                List<String> list = Files.readAllLines(file3.toPath());
                boolean bl = false;
                for (String string3 : list) {
                    String string4 = string3.toLowerCase();
                    if (!string4.contains("nirsoft.net") && !string4.contains("github.com") && !string4.contains("echo.ac") && !string4.contains("anticheat.ac") && !string4.contains("beta.anticheat.ac") && !string4.contains("ericzimmerman.github.io") && !string4.contains("cleverfiles.com") && !string4.contains("voidtools.com") && !string4.contains("software.informer.com") && !string4.contains("privazer.com") && !string4.contains("diskanalyzer.com") && !string4.contains("lunar.gg") && !string4.contains("badlion.net") && !string4.contains("cheatbreaker.net") && !string4.contains("virustotal.com") && !string4.contains("any.run") && !string4.contains("hybrid-analysis.com") && !string4.contains("malwarebytes.com") && !string4.contains("kaspersky.com") && !string4.contains("avast.com") && !string4.contains("processhacker.sourceforge.io") && !string4.contains("systeminformer.sourceforge.io") && !string4.contains("x64dbg.com") && !string4.contains("ollydbg.de") && !string4.contains("download.sysinternals.com")) continue;
                    arrayList.add(string3);
                    bl = true;
                }
                if (!bl) {
                    arrayList.add(String.format(I18n.a("sitebypass.noMatchInFile"), string2));
                }
            }
            catch (IOException iOException) {
                arrayList.add(String.format(I18n.a("sitebypass.readError"), string2, iOException.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    public static List<String> b() {
        Object[][] objectArrayArray;
        ArrayList<String> arrayList = new ArrayList<String>();
        for (Object[] objectArray : objectArrayArray = new Object[][]{{WinReg.HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains", "HKCU"}, {WinReg.HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains", "HKLM"}, {WinReg.HKEY_LOCAL_MACHINE, "SOFTWARE\\Policies\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ZoneMap\\Domains", "HKLM"}}) {
            WinReg.HKEY hKEY = (WinReg.HKEY)objectArray[0];
            String string = (String)objectArray[1];
            String string2 = (String)objectArray[2];
            try {
                if (!Advapi32Util.registryKeyExists(hKEY, string)) continue;
                n.a(hKEY, string, "", string2, arrayList);
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        if (arrayList.isEmpty()) {
            arrayList.add(I18n.a("sitebypass.noRestrictedMatch"));
        }
        return arrayList;
    }

    private static void a(WinReg.HKEY hKEY, String string, String string2, String string3, List<String> list) {
        try {
            TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(hKEY, string);
            for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                String string4;
                if (!(entry.getValue() instanceof Integer) || (Integer)entry.getValue() != 4 || list.contains((string4 = string2.isEmpty() ? string : string2) + " (" + string3 + ")")) continue;
                list.add(string4 + " (" + string3 + ")");
            }
            for (String string5 : Advapi32Util.registryGetKeys(hKEY, string)) {
                String string6 = string2.isEmpty() ? string5 : string2 + "\\" + string5;
                n.a(hKEY, string + "\\" + string5, string6, string3, list);
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    public static List<String> c() {
        ArrayList<String> arrayList = new ArrayList<String>();
        File file2 = new File(System.getenv("SystemRoot") + "\\System32\\drivers\\etc");
        if (!file2.exists() || !file2.isDirectory()) {
            arrayList.add(I18n.a("sitebypass.hostsNotFound"));
            return arrayList;
        }
        File[] fileArray = file2.listFiles((file, string) -> string.toLowerCase().startsWith("hosts".toLowerCase()));
        if (fileArray == null || fileArray.length == 0) {
            arrayList.add(I18n.a("sitebypass.hostsNotFound"));
            return arrayList;
        }
        for (File file3 : fileArray) {
            if (!file3.isFile()) continue;
            arrayList.add("[" + file3.getName() + "]");
            try {
                List<String> list = Files.readAllLines(file3.toPath());
                arrayList.addAll(list);
            }
            catch (IOException iOException) {
                arrayList.add(String.format(I18n.a("sitebypass.readError"), file3.getName(), iOException.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    private static /* synthetic */ String _aq(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x32;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2034623041 + 1130222523 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


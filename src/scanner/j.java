/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.n;
import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class j {
    private static final String[] a = new String[]{".jar", ".class", ".zip", ".txt", "Folder"};

    public static List<n> a() {
        ArrayList<n> arrayList = new ArrayList<n>();
        for (String string : a) {
            String string2 = "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\\" + string;
            try {
                if (!Advapi32Util.registryKeyExists(WinReg.HKEY_CURRENT_USER, string2)) continue;
                TreeMap<String, Object> treeMap = Advapi32Util.registryGetValues(WinReg.HKEY_CURRENT_USER, string2);
                ArrayList<n> arrayList2 = new ArrayList<n>();
                for (Map.Entry<String, Object> entry : treeMap.entrySet()) {
                    String string3;
                    if ("MRUListEx".equalsIgnoreCase(entry.getKey())) continue;
                    Object object = entry.getValue();
                    if (!(object instanceof byte[])) {
                        if (!(object instanceof String) || (string3 = (String)object).isEmpty()) continue;
                        arrayList2.add(new n(string3, false));
                        continue;
                    }
                    byte[] byArray = (byte[])object;
                    string3 = j.a(byArray);
                    if (string3.isEmpty()) continue;
                    arrayList2.add(new n(string3, false));
                }
                if (arrayList2.isEmpty()) continue;
                arrayList.add(new n("--- " + string + " ---", false));
                arrayList.addAll(arrayList2);
                arrayList.add(new n("", false));
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        return arrayList;
    }

    private static String a(byte[] byArray) {
        if (byArray == null || byArray.length < 2) {
            return "";
        }
        try {
            int n2 = byArray.length;
            for (int i2 = 0; i2 < byArray.length - 1; i2 += 2) {
                if (byArray[i2] != 0 || byArray[i2 + 1] != 0) continue;
                n2 = i2;
                break;
            }
            if (n2 == 0) {
                return "";
            }
            String string = new String(byArray, 0, n2, StandardCharsets.UTF_16LE).trim();
            return string.replaceAll("[^\\x20-\\x7E]", "");
        }
        catch (Exception exception) {
            return "";
        }
    }

    private static /* synthetic */ String _chbf(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x92;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1286469837 + 576717147 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


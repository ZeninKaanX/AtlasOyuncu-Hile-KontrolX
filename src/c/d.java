/*
 * Decompiled with CFR 0.152.
 */
package c;

import b.b;
import b.j;
import java.io.File;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import util.I18n;

public class d {
    private static final ThreadLocal<int[]> a = ThreadLocal.withInitial(() -> new int[256]);
    private static final ThreadLocal<int[]> b = ThreadLocal.withInitial(() -> new int[256]);

    public static a a(File file, String string, boolean bl) {
        return d.a(file, string, bl, false);
    }

    public static a a(File file, String string, boolean bl, boolean bl2) {
        Object object;
        Object object2;
        ArrayList<b> arrayList = new ArrayList<b>();
        double d2 = 0.0;
        int n2 = 0;
        int n6 = 0;
        long l2 = file.length();
        double d3 = (double)l2 / 1024.0;
        double d4 = d3 / 1024.0;
        String string2 = d4 >= 1.0 ? String.format(Locale.US, "%.2f MB", d4) : String.format(Locale.US, "%.2f KB", d3);
        boolean bl3 = file.isHidden();
        boolean bl4 = string != null && !string.trim().isEmpty();
        String[] stringArray = bl4 ? string.split("\\|") : new String[]{};
        for (int i2 = 0; i2 < stringArray.length; ++i2) {
            stringArray[i2] = stringArray[i2].trim().toLowerCase();
        }
        try {
            object2 = new ZipFile(file);
            try {
                Enumeration<? extends ZipEntry> enumeration = ((ZipFile)object2).entries();
                while (enumeration.hasMoreElements()) {
                    ZipEntry object3 = enumeration.nextElement();
                    String string3 = object3.getName();
                    String string4 = string3.toLowerCase();
                    if (string4.endsWith(".class")) {
                        d2 += d.a(string3);
                        ++n2;
                        if (c.d.b(string3)) {
                            ++n6;
                        }
                    }
                    if (!bl4) continue;
                    boolean bl5 = false;
                    int n3 = string4.lastIndexOf(47);
                    String string5 = n3 == -1 ? string4 : string4.substring(n3 + 1);
                    int n4 = string5.lastIndexOf(46);
                    String string6 = n4 > 0 ? string5.substring(0, n4) : string5;
                    for (String string7 : stringArray) {
                        if (string7.isEmpty()) continue;
                        if (bl) {
                            String string8;
                            int n5 = string7.lastIndexOf(46);
                            String string9 = string8 = n5 > 0 ? string7.substring(0, n5) : string7;
                            if (!string6.equals(string8) && !string5.equals(string7) && !string4.equals(string7)) continue;
                            bl5 = true;
                            break;
                        }
                        if (!string4.contains(string7)) continue;
                        bl5 = true;
                        break;
                    }
                    if (!bl5) continue;
                    arrayList.add(new b(string3, file.getName(), file.getAbsolutePath(), bl3 ? I18n.a("yes") : I18n.a("no"), string2, I18n.a("status.querying")));
                }
            }
            finally {
                ((ZipFile)object2).close();
            }
        }
        catch (Exception exception) {
            return null;
        }
        object2 = I18n.a("obf.unknown");
        if (n2 > 0) {
            double d5 = d2 / (double)n2;
            double d6 = (double)n6 / (double)n2;
            object2 = d5 >= 3.1 && d5 <= 3.5 || d6 >= 0.25 ? I18n.a("obf.high") : I18n.a("obf.low");
        }
        for (b b2 : arrayList) {
            b2.setObfuscation((String)object2);
        }
        object = new j(file.getName(), file.getAbsolutePath(), string2, I18n.a("analysis.completed"), (String)object2);
        return new a((j)object, arrayList);
    }

    private static boolean b(String string) {
        if (string == null || string.isEmpty()) {
            return false;
        }
        String string2 = string;
        if (string2.endsWith(".class")) {
            string2 = string2.substring(0, string2.length() - 6);
        }
        int n2 = 0;
        int n3 = 0;
        for (String string3 : string2.split("/")) {
            if (string3.length() == 1) {
                ++n2;
                n3 = Math.max(n3, n2);
            } else {
                n2 = 0;
            }
        }
        return n3 >= 3;
    }

    private static double a(String string) {
        if (string == null || string.isEmpty()) {
            return 0.0;
        }
        int n2 = string.length();
        int[] nArray = a.get();
        int[] nArray2 = b.get();
        int n3 = 0;
        for (int i2 = 0; i2 < n2; ++i2) {
            char c2 = string.charAt(i2);
            if (c2 >= '\u0100') continue;
            if (nArray[c2] == 0) {
                nArray2[n3++] = c2;
            }
            char c3 = c2;
            nArray[c3] = nArray[c3] + 1;
        }
        double d2 = 0.0;
        double d3 = n2;
        for (int i3 = 0; i3 < n3; ++i3) {
            int n4 = nArray2[i3];
            double d4 = (double)nArray[n4] / d3;
            d2 -= d4 * (Math.log(d4) / Math.log(2.0));
            nArray[n4] = 0;
        }
        return d2;
    }

    private static /* synthetic */ String _aajc(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x3F;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1912719711 + 109052815 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static class a {
        public final j a;
        public final List<b> b;

        public a(j j2, List<b> list) {
            this.a = j2;
            this.b = list;
        }
    }
}


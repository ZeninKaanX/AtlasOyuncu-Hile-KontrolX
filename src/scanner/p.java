/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import c.d;
import java.io.File;
import java.io.RandomAccessFile;
import util.I18n;

public class p {
    public static a a(File file) {
        return p.a(file, null);
    }

    public static a a(File file, String string) {
        if (file == null || !file.exists() || !file.isFile()) {
            return new a("", "");
        }
        String string2 = string != null && !string.isEmpty() ? string : file.getName();
        String string3 = string2.toLowerCase();
        boolean bl = string3.endsWith(".jar");
        boolean bl2 = p.b(file);
        String string4 = "";
        String string5 = "";
        if (bl2) {
            String string6;
            string4 = !bl ? I18n.a("yes") : I18n.a("no");
            d.a a2 = d.a(file, null, false);
            string5 = a2 != null && a2.a != null ? ((string6 = a2.a.getObfuscation()) != null ? string6 : I18n.a("obf.unknown")) : I18n.a("obf.unknown");
        } else if (bl) {
            String string7;
            string4 = I18n.a("no");
            d.a a3 = d.a(file, null, false);
            string5 = a3 != null && a3.a != null ? ((string7 = a3.a.getObfuscation()) != null ? string7 : I18n.a("obf.unknown")) : I18n.a("obf.unknown");
        }
        return new a(string5, string4);
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    public static boolean b(File file) {
        try (RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r");){
            if (randomAccessFile.length() < 4L) {
                boolean bl = false;
                return bl;
            }
            byte[] byArray = new byte[4];
            randomAccessFile.readFully(byArray);
            boolean bl = byArray[0] == 80 && byArray[1] == 75 && byArray[2] == 3 && byArray[3] == 4;
            return bl;
        }
        catch (Exception exception) {
            return false;
        }
    }

    private static /* synthetic */ String _uac(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xC7;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1490886005 + 1118345463 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static class a {
        public final String a;
        public final String b;

        public a(String string, String string2) {
            this.a = string;
            this.b = string2;
        }
    }
}


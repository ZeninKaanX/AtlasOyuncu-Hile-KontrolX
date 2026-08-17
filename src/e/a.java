/*
 * Decompiled with CFR 0.152.
 */
package e;

import java.io.File;

public class a {
    public static String a(String string) {
        int n2;
        if (string == null) {
            return null;
        }
        int n3 = -1;
        String string2 = string.toUpperCase();
        if (string2.startsWith("\\DEVICE\\")) {
            n2 = string.indexOf(92, 1);
            if (n2 != -1) {
                n3 = string.indexOf(92, n2 + 1);
            }
        } else if (string2.startsWith("\\VOLUME{") && (n2 = string.indexOf("}\\")) != -1) {
            n3 = n2 + 1;
        }
        if (n3 != -1 && n3 < string.length()) {
            File file;
            String string3 = string.substring(n3);
            String string4 = System.getenv("SystemDrive");
            if (string4 == null) {
                string4 = "C:";
            }
            if ((file = new File(string4 + string3)).exists()) {
                return file.getAbsolutePath();
            }
            File[] fileArray = File.listRoots();
            if (fileArray != null) {
                for (File file2 : fileArray) {
                    String string5;
                    String string6 = file2.getAbsolutePath();
                    if (string6.toUpperCase().startsWith(string4.toUpperCase()) || !(file = new File((string5 = string6.substring(0, 2)) + string3)).exists()) continue;
                    return file.getAbsolutePath();
                }
            }
            return string4 + string3;
        }
        return string;
    }

    private static /* synthetic */ String _oh(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x23;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1960674901 + 340681443 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


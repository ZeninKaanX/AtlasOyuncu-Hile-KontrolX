/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.c;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import util.I18n;

public class d {
    public static List<c> a() {
        ArrayList<c> arrayList = new ArrayList<c>();
        String string = System.getenv("LOCALAPPDATA");
        if (string == null) {
            return arrayList;
        }
        File file = new File(string, "CrashDumps");
        if (!file.exists() || !file.isDirectory()) {
            return arrayList;
        }
        File[] fileArray = file.listFiles();
        if (fileArray == null) {
            return arrayList;
        }
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        for (File file2 : fileArray) {
            if (!file2.isFile() || !file2.getName().toLowerCase().endsWith(".dmp")) continue;
            String string2 = simpleDateFormat.format(new Date(file2.lastModified()));
            String string3 = file2.length() / 1024L + " KB";
            String string4 = file2.isHidden() ? I18n.a("yes") : I18n.a("no");
            arrayList.add(new c(file2.getName(), file2.getAbsolutePath(), string2, string3, string4));
        }
        return arrayList;
    }

    private static /* synthetic */ String _egso(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 7;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1226768773 + 1871808829 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


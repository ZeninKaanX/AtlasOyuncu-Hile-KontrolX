/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import util.I18n;

public class JavaLauncher {
    public static List<String> a() {
        ArrayList<String> arrayList = new ArrayList<String>();
        File file2 = new File(System.getProperty("java.io.tmpdir"));
        arrayList.add(String.format(I18n.a("detect.folderHeader"), file2.getAbsolutePath()));
        arrayList.add("");
        File[] fileArray = file2.listFiles((file, string) -> string.toLowerCase().startsWith("JavaLauncher".toLowerCase() + "."));
        if (fileArray == null || fileArray.length == 0) {
            arrayList.add(I18n.a("cli.notFound"));
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
                    if (!string3.contains("-jar") && !string3.contains("succeeded")) continue;
                    arrayList.add(string3);
                    bl = true;
                }
                if (!bl) {
                    arrayList.add(String.format(I18n.a("cli.noMatchInFile"), string2));
                }
            }
            catch (IOException iOException) {
                arrayList.add(String.format(I18n.a("cli.readError"), string2, iOException.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    public static List<String> b() {
        ArrayList<String> arrayList = new ArrayList<String>();
        File file2 = new File(System.getProperty("java.io.tmpdir"));
        arrayList.add(String.format(I18n.a("detect.folderHeader"), file2.getAbsolutePath()));
        arrayList.add("");
        File[] fileArray = file2.listFiles((file, string) -> string.toLowerCase().startsWith("JavaLauncher".toLowerCase() + "."));
        if (fileArray == null || fileArray.length == 0) {
            arrayList.add(I18n.a("cli.notFound"));
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
                arrayList.add(String.format(I18n.a("cli.readError"), file3.getName(), iOException.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    private static /* synthetic */ String _viz(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x5A;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 421108329 + 1176642659 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


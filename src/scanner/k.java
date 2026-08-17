/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.o;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import scanner.p;

public class k {
    private static final DateTimeFormatter a = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static List<o> a() {
        ArrayList<o> arrayList = new ArrayList<o>();
        for (File file : File.listRoots()) {
            File[] fileArray;
            File file2 = new File(file, "$Recycle.Bin");
            if (!file2.exists() || !file2.isDirectory() || (fileArray = file2.listFiles(File::isDirectory)) == null) continue;
            for (File file3 : fileArray) {
                String string = file.getAbsolutePath();
                if (string.endsWith("\\")) {
                    string = string.substring(0, string.length() - 1);
                }
                k.a(file3, string, arrayList);
            }
        }
        arrayList.sort((o2, o3) -> o3.getDeletionTime().compareTo(o2.getDeletionTime()));
        return arrayList;
    }

    private static void a(File file2, String string2, List<o> list) {
        String string3 = file2.getName();
        File[] fileArray = file2.listFiles((file, string) -> string.startsWith("$I"));
        if (fileArray == null) {
            return;
        }
        for (File file3 : fileArray) {
            try {
                o o2 = k.a(file3, string2, string3);
                if (o2 == null) continue;
                list.add(o2);
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
    }

    private static o a(File file, String string, String string2) throws Exception {
        try (RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r");){
            if (randomAccessFile.length() < 28L) {
                o o2 = null;
                return o2;
            }
            byte[] byArray = new byte[28];
            randomAccessFile.readFully(byArray);
            ByteBuffer byteBuffer = ByteBuffer.wrap(byArray).order(ByteOrder.LITTLE_ENDIAN);
            long l2 = byteBuffer.getLong();
            long l3 = byteBuffer.getLong();
            long l4 = byteBuffer.getLong();
            int n2 = byteBuffer.getInt();
            if (l2 != 2L) {
                o o3 = null;
                return o3;
            }
            if (n2 <= 0 || n2 > 4096) {
                o o4 = null;
                return o4;
            }
            byte[] byArray2 = new byte[n2 * 2];
            if (randomAccessFile.length() < (long)(28 + byArray2.length)) {
                o o5 = null;
                return o5;
            }
            randomAccessFile.readFully(byArray2);
            String string3 = new String(byArray2, StandardCharsets.UTF_16LE);
            int n3 = string3.indexOf(0);
            if (n3 >= 0) {
                string3 = string3.substring(0, n3);
            }
            String string4 = k.a(l4);
            String string5 = k.b(l3);
            boolean bl = false;
            String string6 = "";
            String string7 = "";
            String string8 = "$R" + file.getName().substring(2);
            File file2 = new File(file.getParentFile(), string8);
            if (file2.exists()) {
                bl = file2.isHidden();
                int n4 = Math.max(string3.lastIndexOf(92), string3.lastIndexOf(47));
                String string9 = n4 >= 0 ? string3.substring(n4 + 1) : string3;
                p.a a2 = p.a(file2, string9);
                string6 = a2.b;
                string7 = a2.a;
            }
            o o6 = new o(string3, string4, string5, string, string2, bl, string6, string7, file2.exists() ? file2.getAbsolutePath() : null);
            return o6;
        }
    }

    private static String a(long l2) {
        if (l2 <= 0L) {
            return "Unknown";
        }
        try {
            long l3 = 116444736000000000L;
            long l4 = (l2 - l3) / 10000000L;
            LocalDateTime localDateTime = LocalDateTime.ofInstant(Instant.ofEpochSecond(l4), ZoneId.systemDefault());
            return localDateTime.format(a);
        }
        catch (Exception exception) {
            return "Invalid";
        }
    }

    private static String b(long l2) {
        if (l2 < 1024L) {
            return l2 + " B";
        }
        double d2 = (double)l2 / 1024.0;
        if (d2 < 1024.0) {
            return String.format(Locale.US, "%.1f KB", d2);
        }
        double d3 = d2 / 1024.0;
        if (d3 < 1024.0) {
            return String.format(Locale.US, "%.2f MB", d3);
        }
        double d4 = d3 / 1024.0;
        return String.format(Locale.US, "%.2f GB", d4);
    }

    private static /* synthetic */ String _kqq(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x60;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 333257161 + 1427011125 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


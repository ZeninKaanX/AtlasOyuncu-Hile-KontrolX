/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.s;
import com.sun.jna.Memory;
import com.sun.jna.Pointer;
import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.platform.win32.WinNT;
import com.sun.jna.ptr.IntByReference;
import java.io.File;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.StringJoiner;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import util.WinNative;

public class q {
    private static final int[] a = new int[]{1, 2, 4, 16, 32, 64, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 0x100000, 0x200000, Integer.MIN_VALUE};
    private static final String[] b = new String[]{"Data Overwrite", "Data Extend", "Data Truncation", "Named Data Overwrite", "Named Data Extend", "Named Data Truncation", "File Create", "File Delete", "EA Change", "Security Change", "Rename: Old Name", "Rename: New Name", "Indexable Change", "Basic Info Change", "Hard Link Change", "Compression Change", "Encryption Change", "Object ID Change", "Reparse Point Change", "Stream Change", "Close"};
    private static final DateTimeFormatter c = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    public static String a(int n2) {
        StringJoiner stringJoiner = new StringJoiner(" | ");
        for (int i2 = 0; i2 < a.length; ++i2) {
            if ((n2 & a[i2]) == 0) continue;
            stringJoiner.add(b[i2]);
        }
        return stringJoiner.toString();
    }

    private static String b(int n2) {
        StringJoiner stringJoiner = new StringJoiner(" | ");
        if ((n2 & 0x10) != 0) {
            stringJoiner.add("Directory");
        }
        if ((n2 & 0x20) != 0) {
            stringJoiner.add("Archive");
        }
        if ((n2 & 2) != 0) {
            stringJoiner.add("Hidden");
        }
        if ((n2 & 1) != 0) {
            stringJoiner.add("Read Only");
        }
        if ((n2 & 4) != 0) {
            stringJoiner.add("System");
        }
        if (stringJoiner.length() == 0) {
            return "Normal";
        }
        return stringJoiner.toString();
    }

    private static String a(long l2) {
        if (l2 <= 0L) {
            return "";
        }
        try {
            long l3 = (l2 - 116444736000000000L) * 100L;
            Instant instant = Instant.ofEpochSecond(l3 / 1000000000L, l3 % 1000000000L);
            LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            return localDateTime.format(c);
        }
        catch (Exception exception) {
            return "";
        }
    }

    public static void a(char c2, Consumer<s> consumer) {
        q.a(c2, consumer, null);
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static void a(char c2, Consumer<s> consumer, BiConsumer<Long, Long> biConsumer) {
        String string = "\\\\.\\" + c2 + ":";
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.CreateFile(string, Integer.MIN_VALUE, 3, null, 3, 0, null);
        if (Kernel32.INVALID_HANDLE_VALUE.equals(hANDLE)) {
            return;
        }
        try {
            WinNative.USN_JOURNAL_DATA uSN_JOURNAL_DATA = new WinNative.USN_JOURNAL_DATA();
            IntByReference intByReference = new IntByReference();
            boolean bl = WinNative.INSTANCE.DeviceIoControl(hANDLE, 590068, null, 0, uSN_JOURNAL_DATA.getPointer(), uSN_JOURNAL_DATA.size(), intByReference, null);
            if (!bl) {
                return;
            }
            uSN_JOURNAL_DATA.read();
            HashMap<Long, b> hashMap = new HashMap<Long, b>();
            WinNative.MFT_ENUM_DATA_V0 mFT_ENUM_DATA_V0 = new WinNative.MFT_ENUM_DATA_V0();
            mFT_ENUM_DATA_V0.StartUsn = 0L;
            mFT_ENUM_DATA_V0.LowUsn = 0L;
            mFT_ENUM_DATA_V0.HighUsn = uSN_JOURNAL_DATA.NextUsn;
            mFT_ENUM_DATA_V0.write();
            Memory memory = new Memory(0x100000L);
            while (WinNative.INSTANCE.DeviceIoControl(hANDLE, 590003, mFT_ENUM_DATA_V0.getPointer(), mFT_ENUM_DATA_V0.size(), memory, (int)memory.size(), intByReference, null)) {
                WinNative.USN_RECORD_V2 uSN_RECORD_V2;
                int n2 = intByReference.getValue();
                if (n2 <= 8) break;
                for (long i2 = 8L; i2 < (long)n2; i2 += (long)uSN_RECORD_V2.RecordLength) {
                    Pointer pointer = memory.share(i2);
                    uSN_RECORD_V2 = new WinNative.USN_RECORD_V2(pointer);
                    if (uSN_RECORD_V2.RecordLength == 0) break;
                    if ((uSN_RECORD_V2.FileAttributes & 0x10) == 0) continue;
                    hashMap.put(uSN_RECORD_V2.FileReferenceNumber, new b(uSN_RECORD_V2.getFileName(), uSN_RECORD_V2.ParentFileReferenceNumber));
                }
                mFT_ENUM_DATA_V0.StartUsn = memory.getLong(0L);
                mFT_ENUM_DATA_V0.write();
            }
            WinNative.READ_USN_JOURNAL_DATA_V0 rEAD_USN_JOURNAL_DATA_V0 = new WinNative.READ_USN_JOURNAL_DATA_V0();
            rEAD_USN_JOURNAL_DATA_V0.StartUsn = uSN_JOURNAL_DATA.FirstUsn;
            rEAD_USN_JOURNAL_DATA_V0.ReasonMask = -1;
            rEAD_USN_JOURNAL_DATA_V0.ReturnOnlyOnClose = 0;
            rEAD_USN_JOURNAL_DATA_V0.Timeout = 0L;
            rEAD_USN_JOURNAL_DATA_V0.BytesToWaitFor = 0L;
            rEAD_USN_JOURNAL_DATA_V0.UsnJournalID = uSN_JOURNAL_DATA.UsnJournalID;
            rEAD_USN_JOURNAL_DATA_V0.write();
            long l2 = uSN_JOURNAL_DATA.NextUsn - uSN_JOURNAL_DATA.FirstUsn;
            long l3 = 0L;
            Memory memory2 = new Memory(0x100000L);
            while (WinNative.INSTANCE.DeviceIoControl(hANDLE, 590011, rEAD_USN_JOURNAL_DATA_V0.getPointer(), rEAD_USN_JOURNAL_DATA_V0.size(), memory2, (int)memory2.size(), intByReference, null)) {
                long l4;
                long l5;
                WinNative.USN_RECORD_V2 uSN_RECORD_V2;
                int n3 = intByReference.getValue();
                if (n3 <= 8) {
                    break;
                }
                for (long i3 = 8L; i3 < (long)n3; i3 += (long)uSN_RECORD_V2.RecordLength) {
                    Pointer pointer = memory2.share(i3);
                    uSN_RECORD_V2 = new WinNative.USN_RECORD_V2(pointer);
                    if (uSN_RECORD_V2.RecordLength == 0) break;
                    String string2 = uSN_RECORD_V2.getFileName();
                    long l6 = uSN_RECORD_V2.Usn;
                    String string3 = q.a(uSN_RECORD_V2.TimeStamp);
                    String string4 = q.a(uSN_RECORD_V2.Reason);
                    String string5 = q.a(c2, uSN_RECORD_V2.ParentFileReferenceNumber, hashMap);
                    String string6 = q.b(uSN_RECORD_V2.FileAttributes);
                    consumer.accept(new s(l6, string2, string3, string4, string5, string6, uSN_RECORD_V2.FileReferenceNumber));
                }
                if ((l5 = memory2.getLong(0L)) >= uSN_JOURNAL_DATA.NextUsn) {
                    break;
                }
                rEAD_USN_JOURNAL_DATA_V0.StartUsn = l5;
                rEAD_USN_JOURNAL_DATA_V0.write();
                if (biConsumer == null || (l4 = System.nanoTime()) - l3 < 100000000L) continue;
                l3 = l4;
                long l7 = l5 - uSN_JOURNAL_DATA.FirstUsn;
                biConsumer.accept(l7, l2);
            }
        }
        finally {
            Kernel32.INSTANCE.CloseHandle(hANDLE);
        }
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static void a(char c2, String string, Consumer<File> consumer) {
        String string2 = "\\\\.\\" + c2 + ":";
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.CreateFile(string2, Integer.MIN_VALUE, 3, null, 3, 0, null);
        if (Kernel32.INVALID_HANDLE_VALUE.equals(hANDLE)) {
            return;
        }
        try {
            WinNative.USN_JOURNAL_DATA uSN_JOURNAL_DATA = new WinNative.USN_JOURNAL_DATA();
            IntByReference intByReference = new IntByReference();
            boolean bl = WinNative.INSTANCE.DeviceIoControl(hANDLE, 590068, null, 0, uSN_JOURNAL_DATA.getPointer(), uSN_JOURNAL_DATA.size(), intByReference, null);
            if (!bl) {
                return;
            }
            uSN_JOURNAL_DATA.read();
            WinNative.MFT_ENUM_DATA_V0 mFT_ENUM_DATA_V0 = new WinNative.MFT_ENUM_DATA_V0();
            mFT_ENUM_DATA_V0.StartUsn = 0L;
            mFT_ENUM_DATA_V0.LowUsn = 0L;
            mFT_ENUM_DATA_V0.HighUsn = uSN_JOURNAL_DATA.NextUsn;
            mFT_ENUM_DATA_V0.write();
            HashMap<Long, b> hashMap = new HashMap<Long, b>();
            ArrayList<a> arrayList = new ArrayList<a>();
            Memory memory = new Memory(0x100000L);
            while (WinNative.INSTANCE.DeviceIoControl(hANDLE, 590003, mFT_ENUM_DATA_V0.getPointer(), mFT_ENUM_DATA_V0.size(), memory, (int)memory.size(), intByReference, null)) {
                WinNative.USN_RECORD_V2 uSN_RECORD_V2;
                int n2 = intByReference.getValue();
                if (n2 <= 8) break;
                for (long i2 = 8L; i2 < (long)n2; i2 += (long)uSN_RECORD_V2.RecordLength) {
                    Pointer pointer = memory.share(i2);
                    uSN_RECORD_V2 = new WinNative.USN_RECORD_V2(pointer);
                    if (uSN_RECORD_V2.RecordLength == 0) break;
                    String string3 = uSN_RECORD_V2.getFileName();
                    if ((uSN_RECORD_V2.FileAttributes & 0x10) != 0) {
                        hashMap.put(uSN_RECORD_V2.FileReferenceNumber, new b(string3, uSN_RECORD_V2.ParentFileReferenceNumber));
                        continue;
                    }
                    if (!q.a(string3, string)) continue;
                    arrayList.add(new a(string3, uSN_RECORD_V2.ParentFileReferenceNumber));
                }
                mFT_ENUM_DATA_V0.StartUsn = memory.getLong(0L);
                mFT_ENUM_DATA_V0.write();
            }
            for (a a2 : arrayList) {
                String string4 = q.a(c2, a2.b, hashMap);
                consumer.accept(new File(string4 + "\\" + a2.a));
            }
        }
        finally {
            Kernel32.INSTANCE.CloseHandle(hANDLE);
        }
    }

    private static boolean a(String string, String string2) {
        String[] stringArray;
        if ("*".equals(string2)) {
            return true;
        }
        if (string2 == null || string2.isEmpty()) {
            return false;
        }
        String string3 = string.toLowerCase();
        for (String string4 : stringArray = string2.toLowerCase().split("\\|")) {
            String string5 = string4.trim();
            if (string5.isEmpty() || !string3.contains(string5)) continue;
            return true;
        }
        return false;
    }

    private static String a(char c2, long l2, Map<Long, b> map) {
        if ((l2 & 0xFFFFFFFFFFFFL) == 5L) {
            return c2 + ":";
        }
        b b2 = map.get(l2);
        if (b2 == null) {
            return c2 + ":";
        }
        return q.a(c2, b2.b, map) + "\\" + b2.a;
    }

    private static /* synthetic */ String _ej(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xBF;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 58158975 + 587639975 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    private static class b {
        String a;
        long b;

        b(String string, long l2) {
            this.a = string;
            this.b = l2;
        }
    }

    private static class a {
        String a;
        long b;

        a(String string, long l2) {
            this.a = string;
            this.b = l2;
        }
    }
}


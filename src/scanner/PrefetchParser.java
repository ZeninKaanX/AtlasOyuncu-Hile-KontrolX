/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import com.sun.jna.Library;
import com.sun.jna.Memory;
import com.sun.jna.Native;
import com.sun.jna.Pointer;
import com.sun.jna.ptr.IntByReference;
import com.sun.jna.win32.W32APIOptions;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class PrefetchParser {
    public static a a(File file) {
        a a2 = new a();
        try {
            byte[] byArray;
            byte[] byArray2 = PrefetchParser.b(file);
            if (byArray2 == null || byArray2.length < 8) {
                a2.h = "File too small or unreadable";
                return a2;
            }
            ByteBuffer byteBuffer = ByteBuffer.wrap(byArray2, 0, 8).order(ByteOrder.LITTLE_ENDIAN);
            int n2 = byteBuffer.getInt(0);
            if (n2 == 0x44D414D) {
                int n3 = byteBuffer.getInt(4);
                byArray = PrefetchParser.a(byArray2, n3);
                if (byArray == null) {
                    a2.h = "MAM decompression failed";
                    return a2;
                }
            } else {
                byArray = byArray2;
            }
            if (byArray.length < 84) {
                a2.h = "Decompressed data too small for header";
                return a2;
            }
            ByteBuffer byteBuffer2 = ByteBuffer.wrap(byArray).order(ByteOrder.LITTLE_ENDIAN);
            int n4 = byteBuffer2.getInt(0);
            int n5 = byteBuffer2.getInt(4);
            if (n5 != 1094927187) {
                a2.h = "Invalid SCCA signature";
                return a2;
            }
            a2.b = n4;
            byte[] byArray3 = new byte[60];
            System.arraycopy(byArray, 16, byArray3, 0, Math.min(60, byArray.length - 16));
            a2.a = new String(byArray3, StandardCharsets.UTF_16LE).trim();
            int n6 = a2.a.indexOf(0);
            if (n6 >= 0) {
                a2.a = a2.a.substring(0, n6);
            }
            int n7 = byteBuffer2.getInt(76);
            a2.c = String.format("%08X", n7);
            PrefetchParser.a(byteBuffer2, byArray, n4, a2);
        }
        catch (Exception exception) {
            a2.h = exception.getMessage();
        }
        return a2;
    }

    private static void a(ByteBuffer byteBuffer, byte[] byArray, int n2, a a2) {
        block8: {
            try {
                int n3 = 84;
                switch (n2) {
                    case 17: {
                        PrefetchParser.b(byteBuffer, byArray, n3, a2);
                        break;
                    }
                    case 23: {
                        PrefetchParser.c(byteBuffer, byArray, n3, a2);
                        break;
                    }
                    case 26: {
                        PrefetchParser.d(byteBuffer, byArray, n3, a2);
                        break;
                    }
                    case 30: 
                    case 31: {
                        PrefetchParser.a(byteBuffer, byArray, n3, a2, n2);
                        break;
                    }
                    default: {
                        a2.h = "Unsupported version: " + n2;
                        break;
                    }
                }
            }
            catch (Exception exception) {
                if (a2.h != null) break block8;
                a2.h = "Parse error: " + exception.getMessage();
            }
        }
    }

    private static void b(ByteBuffer byteBuffer, byte[] byArray, int n2, a a2) {
        if (byArray.length < n2 + 68) {
            return;
        }
        int n3 = byteBuffer.getInt(n2 + 16);
        int n4 = byteBuffer.getInt(n2 + 20);
        long l2 = byteBuffer.getLong(n2 + 48);
        a2.e = PrefetchParser.a(l2);
        if (a2.e != null) {
            a2.f.add(a2.e);
        }
        a2.d = byteBuffer.getInt(n2 + 60);
        PrefetchParser.a(byArray, n3, n4, a2);
    }

    private static void c(ByteBuffer byteBuffer, byte[] byArray, int n2, a a2) {
        if (byArray.length < n2 + 156) {
            return;
        }
        int n3 = byteBuffer.getInt(n2 + 36);
        int n4 = byteBuffer.getInt(n2 + 40);
        long l2 = byteBuffer.getLong(n2 + 128);
        a2.e = PrefetchParser.a(l2);
        if (a2.e != null) {
            a2.f.add(a2.e);
        }
        a2.d = byteBuffer.getInt(n2 + 152);
        PrefetchParser.a(byArray, n3, n4, a2);
    }

    private static void d(ByteBuffer byteBuffer, byte[] byArray, int n2, a a2) {
        if (byArray.length < n2 + 224) {
            return;
        }
        int n3 = byteBuffer.getInt(n2 + 16);
        int n4 = byteBuffer.getInt(n2 + 20);
        long l2 = byteBuffer.getLong(n2 + 68);
        a2.e = PrefetchParser.a(l2);
        for (int i2 = 0; i2 < 8; ++i2) {
            long l3 = byteBuffer.getLong(n2 + 68 + i2 * 8);
            Date date = PrefetchParser.a(l3);
            if (date == null) continue;
            a2.f.add(date);
        }
        a2.d = byteBuffer.getInt(n2 + 124);
        PrefetchParser.a(byArray, n3, n4, a2);
    }

    private static void a(ByteBuffer byteBuffer, byte[] byArray, int n2, a a2, int n3) {
        if (byArray.length < n2 + 212) {
            return;
        }
        int n4 = byteBuffer.getInt(n2 + 16);
        int n5 = byteBuffer.getInt(n2 + 20);
        long l2 = byteBuffer.getLong(n2 + 44);
        a2.e = PrefetchParser.a(l2);
        for (int i2 = 0; i2 < 8; ++i2) {
            long l3 = byteBuffer.getLong(n2 + 44 + i2 * 8);
            Date date = PrefetchParser.a(l3);
            if (date == null) continue;
            a2.f.add(date);
        }
        a2.d = n3 == 31 ? byteBuffer.getInt(n2 + 116) : byteBuffer.getInt(n2 + 124);
        PrefetchParser.a(byArray, n4, n5, a2);
    }

    private static void a(byte[] byArray, int n2, int n3, a a2) {
        if (n2 <= 0 || n3 <= 0 || n2 + n3 > byArray.length) {
            return;
        }
        int n4 = n2 + n3;
        int n5 = n2;
        while (n5 < n4 - 1) {
            String string;
            int n6;
            int n7 = n5;
            while (n5 < n4 - 1) {
                n6 = (short)(byArray[n5] & 0xFF | (byArray[n5 + 1] & 0xFF) << 8);
                n5 += 2;
                if (n6 != 0) continue;
                break;
            }
            if ((n6 = n5 - n7 - 2) <= 0 || (string = new String(byArray, n7, n6, StandardCharsets.UTF_16LE)).isBlank()) continue;
            a2.g.add(string);
        }
    }

    private static byte[] a(byte[] byArray, int n2) {
        try {
            if (n2 <= 0 || n2 > 0x3200000) {
                return null;
            }
            int n3 = 8;
            int n4 = byArray.length - n3;
            IntByReference intByReference = new IntByReference();
            IntByReference intByReference2 = new IntByReference();
            int n5 = Ntdll.INSTANCE.RtlGetCompressionWorkSpaceSize(4, intByReference, intByReference2);
            if (n5 != 0) {
                return null;
            }
            Memory memory = new Memory(n4);
            memory.write(0L, byArray, n3, n4);
            Memory memory2 = new Memory(n2);
            Memory memory3 = new Memory(intByReference2.getValue());
            IntByReference intByReference3 = new IntByReference();
            n5 = Ntdll.INSTANCE.RtlDecompressBufferEx(4, memory2, n2, memory, n4, intByReference3, memory3);
            if (n5 != 0) {
                return null;
            }
            byte[] byArray2 = new byte[intByReference3.getValue()];
            memory2.read(0L, byArray2, 0, intByReference3.getValue());
            return byArray2;
        }
        catch (Exception exception) {
            System.err.println("MAM decompression error: " + exception.getMessage());
            return null;
        }
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    private static byte[] b(File file) {
        try (RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r");){
            long l2 = randomAccessFile.length();
            if (l2 > 0x3200000L) {
                byte[] byArray = null;
                return byArray;
            }
            byte[] byArray = new byte[(int)l2];
            randomAccessFile.readFully(byArray);
            byte[] byArray2 = byArray;
            return byArray2;
        }
        catch (IOException iOException) {
            return null;
        }
    }

    private static Date a(long l2) {
        if (l2 <= 0L) {
            return null;
        }
        long l3 = (l2 - 116444736000000000L) / 10000L;
        if (l3 < 0L) {
            return null;
        }
        return new Date(l3);
    }

    private static /* synthetic */ String _ki(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xDC;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 356111175 + 1139047295 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static class a {
        public String a;
        public int b;
        public String c;
        public int d;
        public Date e;
        public List<Date> f = new ArrayList<Date>();
        public List<String> g = new ArrayList<String>();
        public String h;

        public boolean a() {
            return this.h != null;
        }
    }

    public static interface Ntdll
    extends Library {
        public static final Ntdll INSTANCE = Native.load("ntdll", Ntdll.class, W32APIOptions.DEFAULT_OPTIONS);

        public int RtlGetCompressionWorkSpaceSize(int var1, IntByReference var2, IntByReference var3);

        public int RtlDecompressBufferEx(int var1, Pointer var2, int var3, Pointer var4, int var5, IntByReference var6, Pointer var7);
    }
}


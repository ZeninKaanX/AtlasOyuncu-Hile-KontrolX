/*
 * Decompiled with CFR 0.152.
 */
package util;

import com.sun.jna.Library;
import com.sun.jna.Memory;
import com.sun.jna.Native;
import com.sun.jna.Pointer;
import com.sun.jna.platform.win32.BaseTSD;
import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.platform.win32.WinNT;
import com.sun.jna.ptr.IntByReference;
import java.util.List;

public final class ProcessMemoryScanner {
    public static void a(WinNT.HANDLE hANDLE, b b2, List<a> list) {
        BaseTSD.SIZE_T sIZE_T;
        WinNT.MEMORY_BASIC_INFORMATION mEMORY_BASIC_INFORMATION = new WinNT.MEMORY_BASIC_INFORMATION();
        long l2 = 0L;
        Memory memory = new Memory(0x3200000L);
        while ((sIZE_T = Kernel32.INSTANCE.VirtualQueryEx(hANDLE, new Pointer(l2), mEMORY_BASIC_INFORMATION, new BaseTSD.SIZE_T((long)mEMORY_BASIC_INFORMATION.size()))).intValue() != 0) {
            long l3;
            long l4 = Pointer.nativeValue(mEMORY_BASIC_INFORMATION.baseAddress);
            long l5 = mEMORY_BASIC_INFORMATION.regionSize.longValue();
            int n2 = mEMORY_BASIC_INFORMATION.protect.intValue();
            int n3 = mEMORY_BASIC_INFORMATION.state.intValue();
            int n4 = mEMORY_BASIC_INFORMATION.type.intValue();
            if (n3 == 4096 && (n2 & 0xEE) != 0 && (n2 & 0x101) == 0 && l5 > 0L) {
                if (list != null && n4 == 262144) {
                    ProcessMemoryScanner.a(hANDLE, l4, l5, list);
                }
                for (l3 = 0L; l3 < l5; l3 += 0x3200000L) {
                    int n5;
                    IntByReference intByReference;
                    int n6 = (int)Math.min(0x3200000L, l5 - l3);
                    if (memory.size() < (long)n6) {
                        memory.close();
                        memory = new Memory(n6);
                    }
                    if (!Kernel32.INSTANCE.ReadProcessMemory(hANDLE, new Pointer(l4 + l3), memory, n6, intByReference = new IntByReference()) || (n5 = intByReference.getValue()) <= 0) continue;
                    byte[] byArray = new byte[n5];
                    memory.read(0L, byArray, 0, n5);
                    b2.visit(byArray, n5, l4 + l3, n2, n4);
                }
            }
            if ((l3 = l4 + l5) <= l2) break;
            l2 = l3;
        }
        memory.close();
    }

    private static void a(WinNT.HANDLE hANDLE, long l2, long l3, List<a> list) {
        try {
            char[] cArray = new char[512];
            int n2 = PsapiMapped.INSTANCE.GetMappedFileNameW(hANDLE, new Pointer(l2), cArray, cArray.length);
            if (n2 > 0) {
                String string = new String(cArray, 0, n2);
                String string2 = e.a.a(string);
                list.add(new a(l2, l3, string2));
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    @FunctionalInterface
    public static interface b {
        public void visit(byte[] var1, int var2, long var3, int var5, int var6);
    }

    public static interface PsapiMapped
    extends Library {
        public static final PsapiMapped INSTANCE = Native.load("psapi", PsapiMapped.class);

        public int GetMappedFileNameW(WinNT.HANDLE var1, Pointer var2, char[] var3, int var4);
    }

    public static final class a {
        public final long a;
        public final long b;
        public final String c;

        public a(long l2, long l3, String string) {
            this.a = l2;
            this.b = l3;
            this.c = string;
        }
    }
}


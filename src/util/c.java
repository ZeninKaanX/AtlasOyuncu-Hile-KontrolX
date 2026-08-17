/*
 * Decompiled with CFR 0.152.
 */
package util;

import com.sun.jna.Native;
import com.sun.jna.platform.win32.Advapi32;
import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.platform.win32.Tlhelp32;
import com.sun.jna.platform.win32.WinBase;
import com.sun.jna.platform.win32.WinDef;
import com.sun.jna.platform.win32.WinNT;
import com.sun.jna.platform.win32.WinReg;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class c {
    private static final String[] a = new String[]{"SOFTWARE\\VMware, Inc.\\VMware Tools", "SOFTWARE\\Oracle\\VirtualBox Guest Additions", "SOFTWARE\\Microsoft\\Virtual Machine\\Guest\\Parameters", "SOFTWARE\\Parallels\\Parallels Tools", "SYSTEM\\CurrentControlSet\\Services\\vmtoolsd", "SYSTEM\\CurrentControlSet\\Services\\vboxguest", "SYSTEM\\CurrentControlSet\\Services\\VBoxMouse", "SYSTEM\\CurrentControlSet\\Services\\vmhgfs", "SYSTEM\\CurrentControlSet\\Services\\prl_strg", "SYSTEM\\CurrentControlSet\\Services\\xenevtchn"};
    private static final byte[][] b = new byte[][]{{0, 12, 41}, {0, 80, 86}, {0, 5, 105}, {8, 0, 39}, {82, 84, 0}, {0, 28, 66}, {0, 22, 62}};
    private static final String[] c = new String[]{"vmtoolsd.exe", "vmwaretray.exe", "vmwareuser.exe", "vmacthlp.exe", "vboxservice.exe", "vboxtray.exe", "prl_tools.exe", "prl_cc.exe", "qemu-ga.exe", "xenservice.exe"};

    public static a a() {
        if (util.c.b()) {
            return new a(true);
        }
        if (util.c.c()) {
            return new a(true);
        }
        if (util.c.d()) {
            return new a(true);
        }
        if (util.c.e()) {
            return new a(true);
        }
        return new a(false);
    }

    private static boolean b() {
        for (String string : a) {
            WinReg.HKEYByReference hKEYByReference = new WinReg.HKEYByReference();
            int n2 = Advapi32.INSTANCE.RegOpenKeyEx(WinReg.HKEY_LOCAL_MACHINE, string, 0, 131097, hKEYByReference);
            if (n2 != 0) continue;
            Advapi32.INSTANCE.RegCloseKey(hKEYByReference.getValue());
            return true;
        }
        return false;
    }

    private static boolean c() {
        try {
            Enumeration<NetworkInterface> enumeration = NetworkInterface.getNetworkInterfaces();
            if (enumeration == null) {
                return false;
            }
            while (enumeration.hasMoreElements()) {
                byte[] byArray = enumeration.nextElement().getHardwareAddress();
                if (byArray == null || byArray.length < 3) continue;
                for (byte[] byArray2 : b) {
                    if (byArray[0] != byArray2[0] || byArray[1] != byArray2[1] || byArray[2] != byArray2[2]) continue;
                    return true;
                }
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        return false;
    }

    private static boolean d() {
        HashSet<String> hashSet = new HashSet<String>();
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.CreateToolhelp32Snapshot(Tlhelp32.TH32CS_SNAPPROCESS, new WinDef.DWORD(0L));
        if (hANDLE != null && !hANDLE.equals(WinBase.INVALID_HANDLE_VALUE)) {
            try {
                Tlhelp32.PROCESSENTRY32.ByReference byReference = new Tlhelp32.PROCESSENTRY32.ByReference();
                byReference.write();
                if (Kernel32.INSTANCE.Process32First(hANDLE, byReference)) {
                    do {
                        hashSet.add(Native.toString(byReference.szExeFile).toLowerCase(Locale.ROOT));
                    } while (Kernel32.INSTANCE.Process32Next(hANDLE, byReference));
                }
            }
            finally {
                Kernel32.INSTANCE.CloseHandle(hANDLE);
            }
        }
        for (String string : c) {
            if (!hashSet.contains(string.toLowerCase(Locale.ROOT))) continue;
            return true;
        }
        return false;
    }

    private static boolean e() {
        try {
            Process process = new ProcessBuilder("wmic", "computersystem", "get", "Manufacturer,Model", "/format:csv").redirectErrorStream(true).start();
            String string = new String(process.getInputStream().readAllBytes()).toLowerCase(Locale.ROOT);
            if (!process.waitFor(5L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
            return string.contains("vmware") || string.contains("virtualbox") || string.contains("innotek") || string.contains("qemu") || string.contains("parallels") || string.contains("xen") || string.contains("microsoft corporation") && string.contains("virtual machine") && !string.contains("surface");
        }
        catch (Exception exception) {
            return false;
        }
    }

    private static /* synthetic */ String _xzfw(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xCC;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 851140797 + 2006669947 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public record a(boolean a) {}
}


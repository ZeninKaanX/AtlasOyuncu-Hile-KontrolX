/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.q;
import com.sun.jna.platform.win32.Advapi32;
import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;
import com.sun.jna.platform.win32.Winsvc;
import com.sun.jna.ptr.IntByReference;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import util.I18n;

public class m {
    private static final String[][] a = new String[][]{{"SysMain", "SysMain (Superfetch)"}, {"PcaSvc", "Program Compatibility Assistant Service"}, {"DPS", "Diagnostic Policy Service"}, {"EventLog", "Windows Event Log"}, {"Schedule", "Task Scheduler"}, {"bam", "Background Activity Moderator"}, {"Dusmsvc", "Data Usage"}, {"Appinfo", "Application Information"}, {"CDPSvc", "Connected Devices Platform Service"}, {"DcomLaunch", "DCOM Server Process Launcher"}, {"PlugPlay", "Plug and Play"}, {"wsearch", "Windows Search"}, {"WinDefend", "Windows Defender Antivirus"}};
    private static final DateTimeFormatter b = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static List<q> a() {
        ArrayList<q> arrayList = new ArrayList<q>();
        Winsvc.SC_HANDLE sC_HANDLE = Advapi32.INSTANCE.OpenSCManager(null, null, 4);
        try {
            for (String[] stringArray : a) {
                String string = stringArray[0];
                String string2 = stringArray[1];
                if (sC_HANDLE == null) {
                    arrayList.add(m.a(string, string2));
                    continue;
                }
                Winsvc.SC_HANDLE sC_HANDLE2 = Advapi32.INSTANCE.OpenService(sC_HANDLE, string, 5);
                if (sC_HANDLE2 == null) {
                    arrayList.add(new q(string, string2, I18n.a("services.notFound"), "", "N/A"));
                    continue;
                }
                try {
                    Object object;
                    Winsvc.SERVICE_STATUS_PROCESS sERVICE_STATUS_PROCESS = new Winsvc.SERVICE_STATUS_PROCESS();
                    IntByReference intByReference = new IntByReference();
                    boolean bl = Advapi32.INSTANCE.QueryServiceStatusEx(sC_HANDLE2, 0, sERVICE_STATUS_PROCESS, sERVICE_STATUS_PROCESS.size(), intByReference);
                    String string3 = "";
                    if (bl) {
                        int n2 = sERVICE_STATUS_PROCESS.dwCurrentState;
                        object = n2 == 4 ? I18n.a("services.running") : (n2 == 1 ? I18n.a("services.stopped") : (n2 == 2 ? "START_PENDING" : (n2 == 3 ? "STOP_PENDING" : "State=" + n2)));
                        if (sERVICE_STATUS_PROCESS.dwProcessId != 0) {
                            string3 = String.valueOf(sERVICE_STATUS_PROCESS.dwProcessId);
                        }
                    } else {
                        object = I18n.a("services.notFound");
                    }
                    String string4 = string2;
                    String string5 = "N/A";
                    if (!string3.isEmpty()) {
                        string5 = m.a(string3);
                    }
                    arrayList.add(new q(string, string4, (String)object, string3, string5));
                }
                finally {
                    Advapi32.INSTANCE.CloseServiceHandle(sC_HANDLE2);
                }
            }
        }
        finally {
            if (sC_HANDLE != null) {
                Advapi32.INSTANCE.CloseServiceHandle(sC_HANDLE);
            }
        }
        arrayList.add(m.b());
        arrayList.add(m.c());
        return arrayList;
    }

    private static q a(String string, String string2) {
        try {
            String string3;
            ProcessBuilder processBuilder = new ProcessBuilder("sc", "queryex", string);
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String string4 = string2;
            String string5 = I18n.a("services.notFound");
            String string6 = "";
            while ((string3 = bufferedReader.readLine()) != null) {
                String string7;
                int n2;
                if ((string3 = string3.trim()).startsWith("DISPLAY_NAME")) {
                    n2 = string3.indexOf(58);
                    if (n2 == -1) continue;
                    string4 = string3.substring(n2 + 1).trim();
                    continue;
                }
                if (string3.startsWith("STATE")) {
                    if (string3.contains("RUNNING")) {
                        string5 = I18n.a("services.running");
                        continue;
                    }
                    if (string3.contains("STOPPED")) {
                        string5 = I18n.a("services.stopped");
                        continue;
                    }
                    n2 = string3.indexOf(58);
                    if (n2 == -1) continue;
                    string7 = string3.substring(n2 + 1).trim().replaceFirst("^\\d+\\s+", "");
                    string5 = string7.isEmpty() ? I18n.a("services.stopped") : string7;
                    continue;
                }
                if (!string3.startsWith("PID") || (n2 = string3.indexOf(58)) == -1 || (string7 = string3.substring(n2 + 1).trim()).equals("0")) continue;
                string6 = string7;
            }
            bufferedReader.close();
            if (!process.waitFor(30L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
            String string8 = string6.isEmpty() ? "N/A" : m.a(string6);
            return new q(string, string4, string5, string6, string8);
        }
        catch (Exception exception) {
            return new q(string, string2, I18n.a("services.notFound"), "", "N/A");
        }
    }

    private static q b() {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder("fsutil", "usn", "queryjournal", "C:");
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            StringBuilder stringBuilder = new StringBuilder();
            try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()));){
                String string;
                while ((string = bufferedReader.readLine()) != null) {
                    stringBuilder.append(string).append(" ");
                }
            }
            if (!process.waitFor(30L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return new q("USN Journal", "NTFS Change Journal", I18n.a("services.notFound"), "", "Timeout");
            }
            String string2 = stringBuilder.toString();
            if (process.exitValue() != 0 || string2.toLowerCase().contains("error") || string2.toLowerCase().contains("hata")) {
                return new q("USN Journal", "NTFS Change Journal", I18n.a("services.notFound"), "", "DELETED!");
            }
            return new q("USN Journal", "NTFS Change Journal", I18n.a("services.running"), "", "Active");
        }
        catch (Exception exception) {
            return new q("USN Journal", "NTFS Change Journal", I18n.a("services.notFound"), "", "N/A");
        }
    }

    private static q c() {
        try {
            String string = "SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters";
            if (!Advapi32Util.registryKeyExists(WinReg.HKEY_LOCAL_MACHINE, string)) {
                return new q("Prefetch Registry", "EnablePrefetcher", I18n.a("services.notFound"), "", "N/A");
            }
            if (!Advapi32Util.registryValueExists(WinReg.HKEY_LOCAL_MACHINE, string, "EnablePrefetcher")) {
                return new q("Prefetch Registry", "EnablePrefetcher", I18n.a("services.notFound"), "", "N/A");
            }
            int n2 = Advapi32Util.registryGetIntValue(WinReg.HKEY_LOCAL_MACHINE, string, "EnablePrefetcher");
            if (n2 == 0) {
                return new q("Prefetch Registry", "EnablePrefetcher", I18n.a("services.stopped"), "", "DISABLED (0)");
            }
            if (n2 == 3) {
                return new q("Prefetch Registry", "EnablePrefetcher", I18n.a("services.running"), "", "Full (3)");
            }
            return new q("Prefetch Registry", "EnablePrefetcher", I18n.a("services.running"), "", "Partial (" + n2 + ")");
        }
        catch (Exception exception) {
            return new q("Prefetch Registry", "EnablePrefetcher", I18n.a("services.notFound"), "", "N/A");
        }
    }

    private static String a(String string) {
        try {
            Optional<Instant> optional;
            long l2 = Long.parseLong(string);
            Optional<ProcessHandle> optional2 = ProcessHandle.of(l2);
            if (optional2.isPresent() && (optional = optional2.get().info().startInstant()).isPresent()) {
                return b.format(optional.get());
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        return "N/A";
    }

    private static /* synthetic */ String _kj(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xC3;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1676518143 + 738345231 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


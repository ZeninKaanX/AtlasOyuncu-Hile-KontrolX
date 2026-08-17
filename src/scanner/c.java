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

public class c {
    private static final List<String> a = List.of("invoke-expression", "iex", "invoke-webrequest", "iwr", "invoke-command", "invoke-mimikatz", "start-process", "downloadstring", "downloadfile", "openread", "webclient", "net.webclient", "system.net.webclient", "certutil", "bitsadmin", "start-bitstransfer", "wget", "curl", "-encodedcommand", "-enc ", "frombase64string", "tobase64string", "base64", "[convert]::from", "[system.text.encoding]", "[char]", "-join", "[string]::join", "-w hidden", "-windowstyle hidden", "-noprofile", "-nop", "bypass", "unrestricted", "system.reflection.assembly", "[reflection.assembly]", "add-type", "loadwithpartialname", "load(", "[runtime.interopservices.marshal]", "virtualalloc", "writeprocessmemory", "createthread", "openprocess", "shellcode", "payload", "amsiutils", "amsicontext", "amsiscanstring", "[ref].assembly.gettype", "unmanagedfunctionpointer", "set-mppreference", "-disablerealtimemonitoring", "add-mppreference", "-exclusionpath", "remove-item", "clear-history", "clear-eventlog", "wevtutil", "fsutil", "cipher /w", "del /f", "reg delete", "reg add", "schtasks /create", "schtasks /delete", "new-scheduledtask", "register-scheduledtask", "set-itemproperty", "sc stop", "sc config", "mimikatz", "sekurlsa", "lsass", "meterpreter", "pastebin", "discordapp", "githubusercontent", "raw.github", "$args[0]", "hidden", "github");

    public static List<String> a() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string2 = System.getenv("APPDATA");
        File file2 = new File(string2, "Microsoft\\Windows\\PowerShell\\PSReadLine");
        arrayList.add(String.format(I18n.a("detect.folderHeader"), file2.getAbsolutePath()));
        arrayList.add("");
        if (!file2.exists() || !file2.isDirectory()) {
            arrayList.add(I18n.a("powershell.notFound"));
            return arrayList;
        }
        File[] fileArray = file2.listFiles((file, string) -> string.toLowerCase().startsWith("ConsoleHost_history".toLowerCase() + "."));
        if (fileArray == null || fileArray.length == 0) {
            arrayList.add(I18n.a("powershell.notFound"));
            return arrayList;
        }
        for (File file3 : fileArray) {
            if (!file3.isFile()) continue;
            String string3 = file3.getName();
            arrayList.add("[" + string3 + "]");
            try {
                List<String> list = Files.readAllLines(file3.toPath());
                boolean bl = false;
                for (String string4 : list) {
                    String string5 = string4.toLowerCase();
                    boolean bl2 = false;
                    for (String string6 : a) {
                        if (!string5.contains(string6)) continue;
                        bl2 = true;
                        break;
                    }
                    if (!bl2) continue;
                    arrayList.add(string4);
                    bl = true;
                }
                if (!bl) {
                    arrayList.add(String.format(I18n.a("powershell.noMatchInFile"), string3));
                }
            }
            catch (IOException iOException) {
                arrayList.add(String.format(I18n.a("powershell.readError"), string3, iOException.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    public static List<String> b() {
        ArrayList<String> arrayList = new ArrayList<String>();
        String string2 = System.getenv("APPDATA");
        File file2 = new File(string2, "Microsoft\\Windows\\PowerShell\\PSReadLine");
        arrayList.add(String.format(I18n.a("detect.folderHeader"), file2.getAbsolutePath()));
        arrayList.add("");
        if (!file2.exists() || !file2.isDirectory()) {
            arrayList.add(I18n.a("powershell.notFound"));
            return arrayList;
        }
        File[] fileArray = file2.listFiles((file, string) -> string.toLowerCase().startsWith("ConsoleHost_history".toLowerCase() + "."));
        if (fileArray == null || fileArray.length == 0) {
            arrayList.add(I18n.a("powershell.notFound"));
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
                arrayList.add(String.format(I18n.a("powershell.readError"), file3.getName(), iOException.getMessage()));
            }
            arrayList.add("");
        }
        return arrayList;
    }

    private static /* synthetic */ String _aitd(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xD4;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 954972029 + 560860901 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


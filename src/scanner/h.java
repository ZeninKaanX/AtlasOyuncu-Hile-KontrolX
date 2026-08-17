/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.k;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

public class h {
    private static final List<String> a = Arrays.asList("invoke-expression", "iex", "downloadstring", "downloadfile", "webclient", "bitstransfer", "frombase64string", "-encodedcommand", "invoke-webrequest", "invoke-restmethod", "new-object", "start-process", "add-type", "virtualalloc", "writeprocessmemory", "amsiutils", "amsicontext", "[ref].assembly.gettype", "-windowstyle hidden", "bypass", "set-mppreference", "-disablerealtimemonitoring", "wevtutil cl", "clear-eventlog", "schtasks /create", "new-scheduledtask", "mimikatz", "sekurlsa", "lsass", "pastebin", "discordapp", "githubusercontent");

    public static a a() {
        ArrayList<k> arrayList = new ArrayList<k>();
        ArrayList<k> arrayList2 = new ArrayList<k>();
        LinkedHashSet<String> linkedHashSet = new LinkedHashSet<String>();
        h.a(arrayList, arrayList2, linkedHashSet);
        h.b(arrayList, arrayList2, linkedHashSet);
        return new a(arrayList, arrayList2);
    }

    private static void a(List<k> list, List<k> list2, Set<String> set) {
        String string = "Windows PowerShell";
        try {
            String string2;
            ProcessBuilder processBuilder = new ProcessBuilder("wevtutil", "qe", string, "/q:*[System[EventID=400]]", "/f:text", "/rd:true", "/c:500");
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream(), h.b()));
            String string3 = "";
            String string4 = null;
            boolean bl = false;
            while ((string2 = bufferedReader.readLine()) != null) {
                String string5 = string2.trim();
                if (string5.startsWith("Event[")) {
                    h.a(list, list2, set, "400", string, string3, string4);
                    string3 = "";
                    string4 = null;
                    bl = false;
                    continue;
                }
                if (string5.startsWith("Date:")) {
                    string3 = string5.substring(5).trim();
                    continue;
                }
                if (string5.equalsIgnoreCase("Details:")) {
                    bl = true;
                    continue;
                }
                if (!bl || !string5.startsWith("HostApplication=")) continue;
                string4 = h.b(string5.substring("HostApplication=".length()));
            }
            h.a(list, list2, set, "400", string, string3, string4);
            if (!process.waitFor(30L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
        }
        catch (Exception exception) {
            System.err.println("Error querying [" + string + "]: " + exception.getMessage());
        }
    }

    private static void b(List<k> list, List<k> list2, Set<String> set) {
        String string = "Microsoft-Windows-PowerShell/Operational";
        try {
            String string2;
            ProcessBuilder processBuilder = new ProcessBuilder("wevtutil", "qe", string, "/q:*[System[EventID=4104]]", "/f:text", "/rd:true", "/c:500");
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream(), h.b()));
            String string3 = "";
            StringBuilder stringBuilder = null;
            boolean bl = false;
            boolean bl2 = false;
            boolean bl3 = false;
            while ((string2 = bufferedReader.readLine()) != null) {
                String string4 = string2.trim();
                if (string4.startsWith("Event[")) {
                    if (stringBuilder != null) {
                        h.a(list, list2, set, "4104", string, string3, stringBuilder.toString().trim());
                    }
                    string3 = "";
                    stringBuilder = null;
                    bl = false;
                    bl2 = false;
                    bl3 = false;
                    continue;
                }
                if (string4.startsWith("Date:")) {
                    string3 = string4.substring(5).trim();
                    continue;
                }
                if (string4.equalsIgnoreCase("Description:")) {
                    bl = true;
                    bl2 = true;
                    continue;
                }
                if (bl && bl2) {
                    if (string4.isEmpty()) continue;
                    bl2 = false;
                    bl3 = true;
                    stringBuilder = new StringBuilder();
                    continue;
                }
                if (!bl3) continue;
                if (string4.startsWith("ScriptBlock ID:") || string4.startsWith("Path:")) {
                    bl3 = false;
                    continue;
                }
                if (stringBuilder.length() > 0) {
                    stringBuilder.append("\n");
                }
                stringBuilder.append(string2);
            }
            if (stringBuilder != null) {
                h.a(list, list2, set, "4104", string, string3, stringBuilder.toString().trim());
            }
            if (!process.waitFor(30L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
        }
        catch (Exception exception) {
            System.err.println("Error querying [" + string + "]: " + exception.getMessage());
        }
    }

    private static void a(List<k> list, List<k> list2, Set<String> set, String string, String string2, String string3, String string4) {
        if (string4 == null || string4.isEmpty() || set.contains(string4)) {
            return;
        }
        set.add(string4);
        String string5 = h.c(string3);
        String string6 = string4.length() > 150 ? string4.substring(0, 150) + "..." : string4;
        k k2 = new k(string, string2, string5, string6, string4);
        list.add(k2);
        if (h.a(string4)) {
            list2.add(k2);
        }
    }

    private static boolean a(String string) {
        if (string == null || string.isEmpty()) {
            return false;
        }
        String string2 = string.toLowerCase();
        for (String string3 : a) {
            if (!string2.contains(string3)) continue;
            return true;
        }
        return false;
    }

    private static String b(String string) {
        if (string == null) {
            return null;
        }
        if (!string.isEmpty() && string.charAt(0) == '\"') {
            string = string.substring(1);
        }
        if (!string.isEmpty() && string.charAt(string.length() - 1) == '\"') {
            string = string.substring(0, string.length() - 1);
        }
        return string;
    }

    private static String c(String string) {
        if (string == null || string.isEmpty()) {
            return "";
        }
        String string2 = string.replace("T", " ");
        int n2 = string2.indexOf(46);
        if (n2 != -1) {
            string2 = string2.substring(0, n2);
        } else if (string2.endsWith("Z")) {
            string2 = string2.substring(0, string2.length() - 1);
        }
        return string2;
    }

    private static Charset b() {
        String string = System.getProperty("stdout.encoding", System.getProperty("sun.stdout.encoding", "UTF-8"));
        try {
            return Charset.forName(string);
        }
        catch (Exception exception) {
            return Charset.forName("UTF-8");
        }
    }

    private static /* synthetic */ String _gbq(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xB8;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2007760677 + 1813782085 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static class a {
        public final List<k> a;
        public final List<k> b;

        a(List<k> list, List<k> list2) {
            this.a = list;
            this.b = list2;
        }
    }
}


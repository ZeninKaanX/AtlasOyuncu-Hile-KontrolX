/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.e;
import b.g;
import static b.e.b.CRITICAL;
import static b.e.b.SUSPICIOUS;
import static b.e.c.JVM;
import static b.e.builder;
import com.sun.jna.Library;
import com.sun.jna.Memory;
import com.sun.jna.Native;
import com.sun.jna.Pointer;
import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.platform.win32.Psapi;
import com.sun.jna.platform.win32.Tlhelp32;
import com.sun.jna.platform.win32.WinBase;
import com.sun.jna.platform.win32.WinDef;
import com.sun.jna.platform.win32.WinNT;
import com.sun.jna.ptr.IntByReference;
import com.sun.jna.win32.W32APIOptions;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import util.ProcessMemoryScanner;

public class FindJVM {
    private static final String[] a;
    private static final byte[][] b;
    private static final String[] c;
    private static final byte[] d;
    private static final String[][] e;
    private static final String[][] f;
    private static final long[][] g;
    private static final long[][] h;
    private static final long[][] i;
    private static final long[][] j;
    private static final long[][] k;
    private static final long[][] l;
    private static final long[][] m;
    private static final long[][] n;
    private static final long[][] o;
    private static final long[][] p;
    private static final long[][] q;
    private static final long[][] r;
    private static final long[][] s;
    private static final long[][] t;
    private static final long[][] u;
    private static final long[][] v;
    private static final long[][] w;
    private static final long[][] x;
    private static final long[][] y;
    private static final long[][] z;
    private static final long[][] A;
    private static final long[][] B;
    private static final long[][] C;
    private static final long[][] D;
    private static final Map<Byte, List<long[]>> E;
    private static final String[] F;
    private static volatile List<String> G;

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static List<g> a(List<e> list, Consumer<g> consumer) {
        Map<Integer, String> map = FindJVM.a();
        if (map.isEmpty()) {
            return Collections.emptyList();
        }
        long l2 = ProcessHandle.current().pid();
        int n2 = Math.min(map.size(), Runtime.getRuntime().availableProcessors());
        ExecutorService executorService = Executors.newFixedThreadPool(n2, runnable -> {
            Thread thread = new Thread(runnable, "jvm-scan");
            thread.setDaemon(true);
            return thread;
        });
        try {
            Object object;
            ExecutorCompletionService<g> executorCompletionService = new ExecutorCompletionService<g>(executorService);
            int n3 = 0;
            for (Map.Entry<Integer, String> entry : map.entrySet()) {
                int n4 = entry.getKey();
                if ((long)n4 == l2) continue;
                String value = entry.getValue();
                executorCompletionService.submit(() -> FindJVM.b(n4, value, list));
                ++n3;
            }
            ArrayList<g> arrayList = new ArrayList<g>();
            for (int i2 = 0; i2 < n3; ++i2) {
                try {
                    Future<g> future = executorCompletionService.poll(300L, TimeUnit.SECONDS);
                    if (future == null || (object = (g)future.get()) == null) continue;
                    arrayList.add((g)object);
                    if (consumer == null) continue;
                    consumer.accept((g)object);
                    continue;
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
            return arrayList;
        }
        finally {
            executorService.shutdown();
        }
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static Map<Integer, String> a() {
        LinkedHashMap<Integer, String> linkedHashMap = new LinkedHashMap<Integer, String>();
        HashMap<Integer, Integer> hashMap = new HashMap<Integer, Integer>();
        HashMap<Integer, String> hashMap2 = new HashMap<Integer, String>();
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.CreateToolhelp32Snapshot(Tlhelp32.TH32CS_SNAPPROCESS, new WinDef.DWORD(0L));
        if (hANDLE != null && !hANDLE.equals(WinBase.INVALID_HANDLE_VALUE)) {
            try {
                Tlhelp32.PROCESSENTRY32.ByReference byReference = new Tlhelp32.PROCESSENTRY32.ByReference();
                byReference.write();
                if (Kernel32.INSTANCE.Process32First(hANDLE, byReference)) {
                    do {
                        int n2 = byReference.th32ProcessID.intValue();
                        String string = Native.toString(byReference.szExeFile);
                        hashMap2.put(n2, string);
                        hashMap.put(n2, byReference.th32ParentProcessID.intValue());
                    } while (Kernel32.INSTANCE.Process32Next(hANDLE, byReference));
                }
            }
            finally {
                Kernel32.INSTANCE.CloseHandle(hANDLE);
            }
        }
        for (Map.Entry entry : hashMap2.entrySet()) {
            String string;
            String string2;
            int n3 = (Integer)entry.getKey();
            if (n3 == 0 || !(string2 = (string = (String)entry.getValue()).toLowerCase()).endsWith("javaw.exe") && !string2.endsWith("java.exe")) continue;
            Integer n4 = (Integer)hashMap.get(n3);
            String string3 = "Unknown";
            if (n4 != null && n4 != 0) {
                string3 = hashMap2.getOrDefault(n4, FindJVM.a(n4));
            }
            linkedHashMap.put(n3, String.format("%s (%s)", string, string3));
        }
        return linkedHashMap;
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static String a(int n2) {
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.OpenProcess(1040, false, n2);
        if (hANDLE == null) {
            return "Unknown";
        }
        try {
            char[] cArray = new char[260];
            int n3 = PsapiEx.INSTANCE.GetModuleFileNameExW(hANDLE, null, cArray, 260);
            if (n3 > 0) {
                String string = FindJVM.e(new String(cArray, 0, n3));
                return string;
            }
        }
        finally {
            Kernel32.INSTANCE.CloseHandle(hANDLE);
        }
        return "Unknown";
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static g a(int n5, String string, List<e> list) {
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.OpenProcess(1040, false, n5);
        if (hANDLE == null) {
            return new g(String.valueOf(n5), string, "", "", false, "Could not open process");
        }
        try {
            long[] lArray = FindJVM.a(hANDLE);
            if (lArray == null) {
                g g2 = new g(String.valueOf(n5), string, "", "", false, "jvm.dll not found");
                return g2;
            }
            long l2 = lArray[0];
            long l3 = lArray[1];
            a a2 = new a();
            ProcessMemoryScanner.a(hANDLE, (byte[] byArray, int n2, long l4, int n3, int n4) -> {
                boolean bl;
                boolean bl2 = bl = l4 >= l2 && l4 < l3;
                if (bl) {
                    int n7 = 0;
                    while (n7 + 4 <= n2) {
                        int n8 = byArray[n7] & 0xFF | (byArray[n7 + 1] & 0xFF) << 8 | (byArray[n7 + 2] & 0xFF) << 16 | (byArray[n7 + 3] & 0xFF) << 24;
                        if (n8 == 524294) {
                            a2.a = true;
                        }
                        if (n8 == -52420967) {
                            a2.b = true;
                        }
                        n7 += 4;
                    }
                }
                if (!a2.c) {
                    a2.c = FindJVM.a(byArray, n2);
                }
                FindJVM.a(byArray, n2, a2.d);
            }, a2.e);
            StringBuilder stringBuilder = new StringBuilder();
            boolean bl = false;
            if (a2.a && a2.b) {
                bl = true;
                stringBuilder.append(a2.c ? "Injection detected." : "Injection detected (untested game client)");
            } else {
                stringBuilder.append("No suspicious java agents loaded");
            }
            if (!a2.d.isEmpty()) {
                stringBuilder.append(" ");
                for (int i2 = 0; i2 < a2.d.size(); ++i2) {
                    stringBuilder.append("+");
                }
                stringBuilder.append(" Suspect Detected");
                bl = true;
            }
            for (ProcessMemoryScanner.a object22 : a2.e) {
                String string2 = object22.c.toLowerCase();
                if (!string2.endsWith(".jar") && !string2.endsWith(".dll") && !string2.endsWith(".class")) continue;
                stringBuilder.append(" | MappedFile: ").append(object22.c);
                bl = true;
            }
            Map<String, Integer> map = FindJVM.a(n5, string);
            if (!map.isEmpty()) {
                bl = true;
                for (Map.Entry entry : map.entrySet()) {
                    stringBuilder.append(" | ").append((String)entry.getKey());
                }
            }
            if (list != null && bl) {
                b.e.a a3 = builder().source(JVM).title("Suspicious JVM process").detail(stringBuilder.toString()).evidence("PID " + n5 + ", " + string).put("pid", String.valueOf(n5)).put("process", string);
                if (!a2.d.isEmpty()) {
                    a3.severity(CRITICAL).put("signatures", String.join((CharSequence)",", a2.d));
                } else {
                    a3.severity(SUSPICIOUS);
                }
                List<e> list2 = list;
                synchronized (list2) {
                    list.add(a3.build());
                }
            }
            g g2 = new g(String.valueOf(n5), string, "", "", bl, stringBuilder.toString());
            return g2;
        }
        finally {
            Kernel32.INSTANCE.CloseHandle(hANDLE);
        }
    }

    private static boolean a(String string) {
        for (String string2 : c) {
            if (!string.contains(string2)) continue;
            return true;
        }
        return false;
    }

    private static boolean b(String string) {
        String string2 = string.trim();
        int n2 = string2.lastIndexOf("  ");
        if (n2 < 0) {
            return false;
        }
        String string3 = string2.substring(n2).trim();
        int n3 = 0;
        for (int i2 = 0; i2 < string3.length(); ++i2) {
            char c2 = string3.charAt(i2);
            if (c2 <= '\u0000' || c2 >= ' ') continue;
            ++n3;
        }
        return n3 >= 3;
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static String b(int n2) {
        int n3 = 4096;
        int n4 = 60;
        WinNT.HANDLE hANDLE = Kernel32.INSTANCE.OpenProcess(4096, false, n2);
        if (hANDLE == null) {
            return null;
        }
        try {
            IntByReference intByReference = new IntByReference();
            NtDll.INSTANCE.NtQueryInformationProcess(hANDLE, 60, null, 0, intByReference);
            int n5 = intByReference.getValue();
            if (n5 <= 0) {
                String string = null;
                return string;
            }
            Memory memory = new Memory(n5);
            int n6 = NtDll.INSTANCE.NtQueryInformationProcess(hANDLE, 60, memory, n5, intByReference);
            if (n6 < 0) {
                String string = null;
                return string;
            }
            int n7 = Native.POINTER_SIZE == 8 ? 8 : 4;
            short s2 = memory.getShort(0L);
            if (s2 <= 0) {
                String string = null;
                return string;
            }
            long l2 = Native.POINTER_SIZE == 8 ? memory.getLong(n7) : (long)memory.getInt(n7) & 0xFFFFFFFFL;
            long l3 = Pointer.nativeValue(memory);
            long l4 = l2 - l3;
            int n8 = s2 & 0xFFFF;
            if (l4 < 0L || l4 + (long)n8 > (long)n5) {
                String string = null;
                return string;
            }
            String string = new String(memory.getByteArray(l4, n8), StandardCharsets.UTF_16LE);
            return string;
        }
        finally {
            Kernel32.INSTANCE.CloseHandle(hANDLE);
        }
    }

    private static String c(int n2) {
        String string = ProcessHandle.of(n2).flatMap(processHandle -> processHandle.info().commandLine()).orElse(null);
        if (string == null || string.isEmpty()) {
            string = FindJVM.b(n2);
        }
        if (string == null) {
            return null;
        }
        StringBuilder stringBuilder = new StringBuilder(string);
        int n3 = 0;
        while ((n3 = string.indexOf(64, n3)) >= 0) {
            int n4;
            int n5;
            if (n3 > 0 && !Character.isWhitespace(string.charAt(n3 - 1))) {
                ++n3;
                continue;
            }
            int n6 = n3 + 1;
            boolean bl = n6 < string.length() && string.charAt(n6) == '\"';
            int n7 = n5 = bl ? n6 + 1 : n6;
            if (bl) {
                n4 = string.indexOf(34, n5);
                if (n4 < 0) {
                    n4 = string.length();
                }
            } else {
                for (n4 = n5; n4 < string.length() && !Character.isWhitespace(string.charAt(n4)); ++n4) {
                }
            }
            try {
                String string2 = new String(Files.readAllBytes(Paths.get(string.substring(n5, n4), new String[0])), StandardCharsets.UTF_8);
                stringBuilder.append(' ').append(string2);
            }
            catch (Exception exception) {
                // empty catch block
            }
            n3 = n4;
        }
        return stringBuilder.toString();
    }

    private static boolean a(Throwable throwable) {
        while (throwable != null) {
            String string = throwable.getMessage();
            if (string != null && string.contains("does not support the attach mechanism")) {
                return true;
            }
            throwable = throwable.getCause();
        }
        return false;
    }

    private static boolean a(String string, String string2) {
        String string3;
        if (string != null) {
            if (string.contains("com.moonsworth.lunar.genesis.Genesis") || string.contains(".lunarclient")) {
                return true;
            }
            if (string.contains("--badlionToken") || string.contains("badlion_js.dll")) {
                return true;
            }
        }
        return string2 != null && ((string3 = string2.toLowerCase()).contains("lunar") || string3.contains("badlion"));
    }

    private static boolean c(String string) {
        return FindJVM.a(string, null);
    }

    private static List<String> d(String string) {
        ArrayList<String> arrayList = new ArrayList<String>();
        if (string == null || string.isEmpty()) {
            return arrayList;
        }
        if (string.contains("-XX:+DisableAttachMechanism") && !FindJVM.c(string)) {
            arrayList.add("Bypass Detected");
        }
        return arrayList;
    }

    private static Map<String, Integer> a(int n2, String string) {
        String string2;
        LinkedHashMap<String, Integer> linkedHashMap;
        block7: {
            linkedHashMap = new LinkedHashMap<String, Integer>();
            string2 = FindJVM.c(n2);
            for (String object : FindJVM.d(string2)) {
                linkedHashMap.put(object, 1);
            }
            try {
                Map<String, Integer> map = FindJVM.d(n2);
                for (Map.Entry entry : map.entrySet()) {
                    linkedHashMap.putIfAbsent((String)entry.getKey(), (Integer)entry.getValue());
                }
            }
            catch (Throwable throwable) {
                if (!FindJVM.a(throwable) || FindJVM.a(string2, string)) break block7;
                linkedHashMap.putIfAbsent("Bypass Detected", 1);
            }
        }
        for (String string3 : FindJVM.b()) {
            Map<String, Integer> map = FindJVM.b(n2, string3);
            for (Map.Entry<String, Integer> entry : map.entrySet()) {
                linkedHashMap.putIfAbsent(entry.getKey(), entry.getValue());
            }
        }
        if (FindJVM.a(string2, string)) {
            linkedHashMap.remove("Bypass Detected");
        }
        return linkedHashMap;
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static Map<String, Integer> d(int n2) throws Exception {
        LinkedHashMap<String, Integer> linkedHashMap = new LinkedHashMap<String, Integer>();
        Class<?> clazz = Class.forName("com.sun.tools.attach.VirtualMachine");
        Object object = clazz.getMethod("attach", String.class).invoke(null, String.valueOf(n2));
        try {
            Method method = object.getClass().getMethod("executeJCmd", String.class);
            try (InputStream inputStream = (InputStream)method.invoke(object, "GC.class_histogram");){
                String string;
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
                while ((string = bufferedReader.readLine()) != null) {
                    String string2 = string.trim();
                    for (String[] stringArray : f) {
                        if (!string2.contains(stringArray[0]) || "Wurst".equals(stringArray[1]) && FindJVM.a(string2)) continue;
                        linkedHashMap.merge(stringArray[1], 1, Integer::sum);
                    }
                    if (!FindJVM.b(string)) continue;
                    linkedHashMap.merge("Doomsday", 1, Integer::sum);
                }
            }
        }
        finally {
            clazz.getMethod("detach", new Class[0]).invoke(object, new Object[0]);
        }
        return linkedHashMap;
    }

    private static Map<String, Integer> b(int n2, String string) {
        LinkedHashMap<String, Integer> linkedHashMap = new LinkedHashMap<String, Integer>();
        try {
            String string2;
            ProcessBuilder processBuilder = new ProcessBuilder(string, String.valueOf(n2), "GC.class_histogram");
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
            while ((string2 = bufferedReader.readLine()) != null) {
                String string3 = string2.trim();
                if (string3.contains("does not support the attach mechanism")) {
                    linkedHashMap.putIfAbsent("Bypass Detected", 1);
                    break;
                }
                for (String[] stringArray : f) {
                    if (!string3.contains(stringArray[0]) || "Wurst".equals(stringArray[1]) && FindJVM.a(string3)) continue;
                    linkedHashMap.merge(stringArray[1], 1, Integer::sum);
                }
                if (!FindJVM.b(string2)) continue;
                linkedHashMap.merge("Doomsday", 1, Integer::sum);
            }
            if (!process.waitFor(15L, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        return linkedHashMap;
    }

    private static List<String> b() {
        String[] stringArray;
        String string;
        List<String> list = G;
        if (list != null) {
            return list;
        }
        int n2 = 3;
        LinkedHashSet<String> linkedHashSet = new LinkedHashSet<String>();
        String string2 = System.getProperty("java.home");
        if (string2 != null) {
            FindJVM.a(linkedHashSet, FindJVM.a(Paths.get(string2, new String[0])));
            FindJVM.a(linkedHashSet, FindJVM.a(Paths.get(string2, new String[0]).getParent()));
        }
        if ((string = System.getenv("JAVA_HOME")) != null) {
            FindJVM.a(linkedHashSet, FindJVM.a(Paths.get(string, new String[0])));
        }
        if (linkedHashSet.size() < n2) {
            for (String string3 : stringArray = new String[]{System.getenv("ProgramFiles") + "\\Java", System.getenv("ProgramFiles(x86)") + "\\Java", System.getenv("ProgramFiles") + "\\Eclipse Adoptium", System.getenv("ProgramFiles") + "\\Microsoft\\jdk", System.getenv("ProgramFiles") + "\\Zulu", System.getenv("ProgramFiles") + "\\BellSoft", System.getenv("ProgramFiles") + "\\JetBrains", System.getenv("LOCALAPPDATA") + "\\.jdks", System.getenv("LOCALAPPDATA") + "\\JetBrains\\Toolbox", System.getProperty("user.home") + "\\.jdks", System.getProperty("user.home") + "\\.antigravity"}) {
                if (linkedHashSet.size() >= n2) break;
                if (string3 == null || string3.startsWith("null")) continue;
                FindJVM.a(linkedHashSet, FindJVM.a(new File(string3), 4));
            }
        }
        if (linkedHashSet.size() < n2) {
            try {
                Process process = new ProcessBuilder("jcmd", "-l").redirectErrorStream(true).start();
                if (process.waitFor(5L, TimeUnit.SECONDS) && process.exitValue() == 0) {
                    FindJVM.a(linkedHashSet, "jcmd");
                }
                process.destroyForcibly();
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        List<String> result = new ArrayList<String>(linkedHashSet);
        G = result;
        return result;
    }

    private static void a(Set<String> set, String string) {
        if (string != null) {
            set.add(string);
        }
    }

    private static String a(Path path) {
        Path[] pathArray;
        if (path == null) {
            return null;
        }
        for (Path path2 : pathArray = new Path[]{path.resolve("bin").resolve("jcmd.exe"), path.resolve("jbr").resolve("bin").resolve("jcmd.exe"), path.resolve("jre").resolve("bin").resolve("jcmd.exe")}) {
            if (!FindJVM.b(path2)) continue;
            return path2.toString();
        }
        return null;
    }

    private static String a(File file, int n2) {
        if (file == null || !file.isDirectory() || n2 <= 0) {
            return null;
        }
        File file2 = new File(file, "bin" + File.separator + "jcmd.exe");
        if (FindJVM.b(file2.toPath())) {
            return file2.getAbsolutePath();
        }
        File[] fileArray = file.listFiles();
        if (fileArray == null) {
            return null;
        }
        for (File file3 : fileArray) {
            String string;
            if (!file3.isDirectory() || (string = FindJVM.a(file3, n2 - 1)) == null) continue;
            return string;
        }
        return null;
    }

    private static boolean b(Path path) {
        try {
            if (!Files.isExecutable(path) || Files.size(path) <= 1024L) {
                return false;
            }
            Process process = new ProcessBuilder(path.toString(), "-l").redirectErrorStream(true).start();
            boolean bl = process.waitFor(5L, TimeUnit.SECONDS);
            if (!bl) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        }
        catch (Exception exception) {
            return false;
        }
    }

    private static long[] a(WinNT.HANDLE hANDLE) {
        WinDef.HMODULE[] hMODULEArray = new WinDef.HMODULE[1024];
        IntByReference intByReference = new IntByReference();
        if (!PsapiEx.INSTANCE.EnumProcessModules(hANDLE, hMODULEArray, hMODULEArray.length * Native.POINTER_SIZE, intByReference)) {
            return null;
        }
        int n2 = intByReference.getValue() / Native.POINTER_SIZE;
        char[] cArray = new char[260];
        for (int i2 = 0; i2 < n2; ++i2) {
            Memory memory;
            IntByReference intByReference2;
            Memory memory2;
            String string;
            int n3;
            if (hMODULEArray[i2] == null || (n3 = PsapiEx.INSTANCE.GetModuleFileNameExW(hANDLE, hMODULEArray[i2], cArray, 260)) <= 0 || !(string = new String(cArray, 0, n3)).toLowerCase().contains("jvm.dll")) continue;
            long l2 = Pointer.nativeValue(hMODULEArray[i2].getPointer());
            if (!Kernel32.INSTANCE.ReadProcessMemory(hANDLE, new Pointer(l2), memory2 = new Memory(64L), 64, intByReference2 = new IntByReference())) {
                return null;
            }
            short s2 = memory2.getShort(0L);
            if (s2 != 23117) {
                return null;
            }
            int n4 = memory2.getInt(60L);
            if (!Kernel32.INSTANCE.ReadProcessMemory(hANDLE, new Pointer(l2 + (long)n4), memory = new Memory(264L), 264, intByReference2)) {
                return null;
            }
            int n5 = memory.getInt(80L);
            return new long[]{l2, l2 + (long)n5};
        }
        return null;
    }

    private static long a(byte[] byArray, int n2, int n3) {
        long l2 = 4945864136018390804L;
        for (int i2 = 0; i2 < n3; ++i2) {
            l2 ^= (long)byArray[n2 + i2] & 0xFFL;
            l2 *= 1099511628211L;
        }
        return l2;
    }

    private static void a(byte[] byArray, int n2, Set<String> set) {
        for (int i2 = 0; i2 < n2; ++i2) {
            List<long[]> list = E.get(byArray[i2]);
            if (list == null) continue;
            for (long[] lArray : list) {
                long l2;
                byte by = (byte)(lArray[0] ^ 0x3CL);
                int n3 = (int)lArray[2];
                if (i2 + n3 > n2 || i2 + 1 < n2 && byArray[i2 + 1] != by || (l2 = FindJVM.a(byArray, i2, n3)) != lArray[1]) continue;
                String string = F[(int)lArray[3]];
                set.add(string);
            }
        }
    }

    private static boolean a(byte[] byArray, int n2) {
        for (byte[] byArray2 : b) {
            if (FindJVM.a(byArray, n2, byArray2) < 0) continue;
            return true;
        }
        return false;
    }

    private static int a(byte[] byArray, int n2, byte[] byArray2) {
        int n3 = byArray2.length;
        if (n3 == 0 || n3 > n2) {
            return -1;
        }
        byte by = byArray2[0];
        int n4 = n2 - n3;
        for (int i2 = 0; i2 <= n4; ++i2) {
            if (byArray[i2] != by) continue;
            boolean bl = true;
            for (int i3 = 1; i3 < n3; ++i3) {
                if (byArray[i2 + i3] == byArray2[i3]) continue;
                bl = false;
                break;
            }
            if (!bl) continue;
            return i2;
        }
        return -1;
    }

    private static String e(String string) {
        int n2 = Math.max(string.lastIndexOf(92), string.lastIndexOf(47));
        return n2 >= 0 ? string.substring(n2 + 1) : string;
    }

    private static /* synthetic */ g b(int n2, String string, List list) throws Exception {
        return FindJVM.a(n2, string, list);
    }

    static {
        int n2;
        a = new String[]{"javaagent", "-javaagent", "premain", "agentmain", "Instrumentation", "VirtualMachine.attach", "com.sun.tools.attach"};
        b = new byte[a.length][];
        for (n2 = 0; n2 < a.length; ++n2) {
            FindJVM.b[n2] = a[n2].getBytes(StandardCharsets.US_ASCII);
        }
        c = new String[]{"net.wurstclient.zoom"};
        d = new byte[]{77, 97, 110, 100, 114, 105, 110};
        e = new String[][]{{"IwQaSgUcHD4VDQgbDAA5", "Wurst"}, {"OQkbChYMHGMJDwcZ", "ThunderHack"}, {"IAQaAR0bCigXCwgdGQMoDxpKHwwaKA4c", "Meteor"}, {"PhRABxMdAigAAA==", "Catlean"}, {"IhEdShcKQCwRBw==", "Grim"}, {"IARAABcPGjoAHAFcCBwkEhoLGxo=", "Aristois"}, {"IARAABcPGjoAHAFcCgIkBAAQXA8cLAwLEx0bBQ==", "Aristois"}, {"IhMJShAFCywCBgwTCgU=", "BleachHack"}, {"KQQYSh4fHTkTAANcCBwqDgA=", "Argon"}, {"IwQaShEKDCEUCxxcBQc8FAcAEAYbIwIL", "LiquidBounce"}, {"JA8LFgYAD2MgJAAk", "Inertia"}, {"JA8LFgYAD2MUKSA5", "Inertia"}, {"JA8LFgYAD2MAKCsA", "Inertia"}, {"JA8LFgYAD2M1Igs5", "Inertia"}, {"JA8LFgYAD2MvNz4l", "Inertia"}, {"JA8LFgYAD2MEBBE+", "Inertia"}, {"JA8LFgYAD2MrCSkT", "Inertia"}, {"JA8LFgYAD2MmFAgQ", "Inertia"}, {"JA8LFgYAD2M0PjEe", "Inertia"}, {"JA8LFgYAD2M5PSU2", "Inertia"}, {"KQQYSggZHCgSGg0VDEA9EwsXBgAJKE8NCBsMADlPPhYXGhokBgs=", "Prestige"}, {"KQQYSggZHCgSGg0VDEA9EwsXBgAJKE8NCBsMADlPPhYXGhokBgtAMQYDPQAADR0H", "Prestige"}, {"IQ4CSh4eCz4=", "Phantom"}, {"KQQYSjQmPAhPIwUbBw==", "Krypton"}, {"KQQYSjQmPAhPAwsWHAIo", "Krypton"}, {"KQQYSjQmPAhPGxAbBR0=", "Krypton"}, {"NRgUSgMeCz8UQBQHBR0oTw0IGwwAOQ==", "PulseClient"}, {"NRgUSgMeCz8UQBQHBR0o", "PulseClient"}, {"NwQADQYBQDcOGA==", "Zenith"}, {"PxRACBcfByM=", "StupidClient"}, {"KQQYSgIGGiwVAUoeHA0kBQ==", "LucidArgon"}, {"KQQYSgIGGiwVAQ==", "LucidArgon"}, {"Hg0HChkQLSUAAAoXBSYsDwoIFxs=", "Slinky"}};
        f = new String[e.length][2];
        for (n2 = 0; n2 < e.length; ++n2) {
            byte[] byArray3 = Base64.getDecoder().decode(e[n2][0]);
            byte[] byArray = new byte[byArray3.length];
            for (int i2 = 0; i2 < byArray3.length; ++i2) {
                byArray[i2] = (byte)(byArray3[i2] ^ d[i2 % d.length]);
            }
            FindJVM.f[n2][0] = new String(byArray, StandardCharsets.US_ASCII);
            FindJVM.f[n2][1] = e[n2][1];
        }
        g = new long[][]{{85L, 104L, 7718434496001671876L, 10L}, {26L, 125L, -4589800544288527338L, 13L}, {111L, 121L, -1952542801931274036L, 19L}, {29L, 2L, 721515521163084931L, 10L}, {29L, 89L, 1758035900724189102L, 11L}, {29L, 84L, 8935865537471977868L, 11L}, {77L, 13L, 1507689790192216519L, 10L}, {30L, 113L, 3242700010392120286L, 10L}, {31L, 17L, -8874180077780708839L, 10L}, {31L, 88L, 1862159304034789729L, 15L}, {25L, 31L, -8395062721016110880L, 18L}, {25L, 124L, -3273123498745055946L, 16L}, {119L, 100L, 115596976295162389L, 18L}, {119L, 80L, 6883511749584629103L, 16L}, {112L, 114L, 1481529932268538607L, 15L}, {25L, 31L, 692772192488292788L, 13L}, {29L, 77L, 3539658734283412549L, 13L}, {25L, 31L, 1040035902308374698L, 13L}, {25L, 124L, 5806795783698449326L, 15L}, {29L, 77L, -2733791122989505720L, 12L}, {29L, 77L, 2269516919000457213L, 14L}, {29L, 77L, -4841591390921209880L, 15L}, {25L, 124L, 4190396603934383014L, 18L}, {29L, 84L, 247198466718287732L, 12L}, {29L, 84L, 5139507542470676079L, 13L}, {29L, 77L, 6595910736562600643L, 13L}, {25L, 124L, -2319720714896805846L, 14L}, {29L, 84L, -5833084018628955373L, 18L}};
        h = new long[][]{{83L, 76L, 7128656231586004596L, 31L}, {83L, 76L, -2784445435397361073L, 31L}, {83L, 76L, -6034271924895194553L, 31L}, {83L, 76L, 7205768886202671724L, 31L}, {83L, 76L, -2821991713265138028L, 40L}, {83L, 76L, 7470537295083628555L, 31L}, {83L, 76L, -9071378734408475811L, 31L}, {83L, 76L, -41121956937413209L, 25L}, {83L, 76L, -3158046231671591542L, 34L}, {83L, 76L, 7077874557501836341L, 25L}, {83L, 76L, 8238255835410082865L, 25L}};
        i = new long[][]{{82L, 89L, 9077948809097170088L, 48L}, {82L, 89L, -8695205341184720327L, 39L}, {82L, 89L, 4989497410086843691L, 51L}, {82L, 89L, 1382466004667999978L, 53L}, {82L, 89L, 600903708961464893L, 34L}, {82L, 89L, 326921586150947449L, 42L}, {82L, 89L, 2702729500388466497L, 38L}, {82L, 89L, -5188254517848645721L, 35L}, {82L, 89L, -6592033556574073118L, 49L}, {82L, 89L, 8151086347222891388L, 59L}, {82L, 89L, -6924436278962250678L, 50L}};
        j = new long[][]{{81L, 89L, 95708892258542548L, 62L}, {81L, 89L, -1655777455682570076L, 61L}, {81L, 89L, 7525928330586768900L, 60L}, {81L, 89L, -1084599130933840844L, 54L}, {81L, 89L, -631009558794749016L, 57L}};
        k = new long[][]{{103L, 23L, 3260654019191808798L, 9L}};
        l = new long[][]{{72L, 84L, 5048371838790445898L, 46L}, {72L, 84L, 2918926128585382132L, 41L}, {72L, 84L, 1424208321384368826L, 47L}, {72L, 84L, -3827788519772429932L, 38L}, {72L, 84L, -1290946547408029297L, 38L}, {72L, 84L, -5906656879434990208L, 45L}, {72L, 84L, 2934995050385808538L, 34L}, {19L, 93L, 3528348956395500504L, 55L}, {19L, 93L, 1744419570574615510L, 54L}, {104L, 84L, -6950725895618892633L, 36L}};
        m = new long[][]{{79L, 73L, -3606624381028047359L, 19L}, {79L, 73L, 3360126688509594098L, 19L}, {79L, 73L, 953574836784015699L, 21L}, {79L, 73L, 6628819092298115094L, 21L}, {79L, 73L, 4670348978124868818L, 29L}, {79L, 73L, -1393634205018939501L, 48L}, {79L, 73L, 4226406048453639804L, 51L}, {79L, 73L, 5855021587478433438L, 48L}, {79L, 73L, 5159986051809274812L, 48L}, {79L, 73L, 7163575903047619929L, 44L}};
        n = new long[][]{{81L, 89L, 5749899287675086176L, 51L}, {81L, 89L, 2881827062031871141L, 41L}, {81L, 89L, -7692775171662090651L, 44L}, {81L, 89L, 268153612618732443L, 37L}, {81L, 89L, 6624560087357088059L, 38L}, {81L, 89L, 2885134344182458443L, 52L}, {81L, 89L, -3933649189756508916L, 36L}, {81L, 89L, 8544528991210290371L, 53L}, {81L, 89L, 2238961795143587694L, 49L}, {81L, 89L, 4392474137790895001L, 47L}};
        o = new long[][]{{83L, 78L, -5607600016961579273L, 39L}, {83L, 78L, 1191506467597965908L, 41L}, {83L, 78L, -5291339660670762123L, 41L}, {83L, 78L, -8722943984994315996L, 43L}, {83L, 78L, 4074161619783099859L, 34L}, {83L, 78L, -1772588383093976584L, 34L}, {83L, 78L, 4897281074431455082L, 35L}, {83L, 78L, -4183923128168320984L, 45L}, {83L, 78L, 1683643964170378260L, 35L}, {83L, 78L, 3964977221258729158L, 36L}};
        p = new long[][]{{88L, 89L, -6933477195236069920L, 39L}, {88L, 89L, 8469487826900466902L, 44L}, {88L, 89L, 5613735286744993854L, 37L}, {88L, 89L, -4081837689216800588L, 35L}, {88L, 89L, -8904771959483665821L, 34L}, {88L, 89L, 2590245492350240963L, 40L}, {88L, 89L, -4075616356514962462L, 39L}, {88L, 89L, -288764729518355822L, 30L}, {88L, 89L, 487504389536020486L, 45L}, {88L, 89L, -61091345384728564L, 52L}};
        q = new long[][]{{82L, 89L, 221796241893040746L, 49L}, {82L, 89L, 5945751237852842592L, 76L}, {82L, 89L, -1399883660843675085L, 51L}, {82L, 89L, 4873417838528841861L, 50L}, {82L, 89L, 8327911516254352417L, 39L}, {82L, 89L, 5099808756223655530L, 45L}, {82L, 89L, 2147013421027704386L, 59L}, {82L, 89L, 6445288086729663385L, 59L}, {82L, 89L, -5554623569956654967L, 59L}, {82L, 89L, 3539184674612666449L, 55L}};
        r = new long[][]{{88L, 89L, 2666939430170770698L, 46L}, {88L, 89L, 2860953334243797687L, 38L}, {88L, 89L, -6627408105134978074L, 47L}, {88L, 89L, -5179594367574482955L, 47L}, {88L, 89L, -3890481181552901094L, 51L}, {88L, 89L, -4804877749635368380L, 53L}, {88L, 89L, -1838338897640477613L, 54L}, {88L, 89L, 874158061999974889L, 48L}, {88L, 89L, -1091310700582224516L, 44L}, {88L, 89L, 7469314875756505084L, 52L}};
        s = new long[][]{{85L, 82L, -8875081738513768418L, 12L}, {85L, 82L, 5280927086041479143L, 12L}, {85L, 82L, -3651963901091212801L, 17L}, {85L, 82L, 4800126761658954977L, 12L}, {85L, 82L, -287604575604393722L, 12L}, {85L, 82L, -3314263992880516387L, 12L}, {85L, 82L, -8186901294185093116L, 12L}, {85L, 82L, 1355510356673069307L, 12L}, {85L, 82L, -3592623027264767734L, 12L}, {85L, 82L, -6434277564964833843L, 12L}};
        t = new long[][]{{80L, 83L, 9157045901894092567L, 15L}, {80L, 83L, 8610258664853936391L, 21L}, {80L, 83L, 4849949299497751380L, 15L}};
        u = new long[][]{{88L, 89L, 2252414887231632876L, 35L}, {88L, 89L, 8721373998315985425L, 28L}, {88L, 89L, -2645628077650051008L, 29L}, {88L, 89L, -4713594772887931560L, 33L}, {88L, 89L, 1944540619669504291L, 43L}, {88L, 89L, 1897315687066504067L, 29L}, {88L, 89L, -7145981716200739052L, 41L}, {88L, 89L, -3527063377460875894L, 43L}, {88L, 89L, 8546813415745723848L, 43L}, {88L, 89L, 3729938387727564363L, 45L}};
        v = new long[][]{{68L, 69L, 7206883864067044896L, 59L}, {68L, 69L, 4688943901056931696L, 59L}, {68L, 69L, 2632872427913406743L, 52L}, {68L, 69L, 4111444863265300715L, 52L}, {68L, 69L, 6788052740017328611L, 34L}, {68L, 69L, -5659307540963696726L, 50L}, {68L, 69L, 7520341015052495613L, 33L}, {68L, 69L, 7083689702570417076L, 47L}, {68L, 69L, -3722465377132494863L, 34L}, {68L, 69L, 4822902404265206634L, 41L}};
        w = new long[][]{{70L, 89L, -389322662861944961L, 48L}, {70L, 89L, 8541707743026514891L, 50L}, {70L, 89L, 2919549361207746961L, 17L}, {70L, 89L, 3192170485471619511L, 59L}, {70L, 89L, 7413280896255569142L, 50L}, {70L, 89L, -2901549869866022758L, 25L}, {70L, 89L, -2815110335568270507L, 27L}, {70L, 89L, -8058430432539028759L, 55L}, {70L, 89L, -4903842461416997567L, 51L}, {70L, 89L, -8015766593272794447L, 64L}};
        x = new long[][]{{101L, 94L, 4209258621641451450L, 15L}, {124L, 76L, -7657028967567701192L, 19L}, {88L, 113L, -8150147204551036163L, 16L}, {77L, 92L, -2878875083496783953L, 18L}, {97L, 68L, -8880801129469915505L, 15L}, {74L, 83L, -8075681648356418319L, 15L}, {126L, 104L, -4058873224012696076L, 14L}, {10L, 24L, -7206217097425317751L, 13L}, {75L, 121L, 3654530386238995758L, 16L}, {124L, 94L, 6889602108553416777L, 15L}, {103L, 110L, -3309014846289812514L, 14L}, {1L, 79L, 1461563867341578565L, 15L}, {85L, 112L, -5661351673478599065L, 15L}, {68L, 80L, 8458085473430345819L, 14L}, {22L, 95L, -1732803242639518512L, 18L}, {85L, 75L, -7657705761452442758L, 18L}, {111L, 23L, 1951360187779250115L, 18L}, {107L, 127L, 4931959153177716988L, 18L}, {113L, 27L, -1404915370970861100L, 13L}, {73L, 112L, 228396260634517744L, 16L}, {113L, 107L, 730855780242372148L, 16L}, {108L, 127L, 9015266601911202561L, 14L}, {100L, 75L, -8579764346808893361L, 13L}, {6L, 23L, 2152017021247693234L, 16L}, {93L, 5L, -464638265831788787L, 13L}};
        y = new long[][]{{87L, 112L, -1909370197089281935L, 13L}, {30L, 89L, -3926156483006687424L, 14L}, {81L, 125L, 4335367241289200767L, 15L}, {125L, 95L, 1756496727002875765L, 15L}, {113L, 75L, 3070381738293008233L, 15L}, {27L, 112L, 8337016467115399107L, 14L}, {95L, 13L, -2511596833506464646L, 13L}, {0L, 15L, -4513327603667137800L, 14L}, {77L, 83L, 7883889653915208028L, 18L}, {120L, 109L, 6967928326976581631L, 14L}, {113L, 94L, -1319787110367346639L, 15L}, {0L, 114L, 3540829816545835302L, 14L}, {22L, 82L, 5012168422966139334L, 18L}, {31L, 109L, -8703820697768542939L, 13L}, {84L, 127L, -8473463397943056527L, 14L}, {98L, 88L, 20686360046862114L, 14L}, {112L, 127L, -2469648088368702660L, 19L}, {121L, 95L, -4405974102973681852L, 16L}, {81L, 101L, -9009700545544855230L, 19L}, {83L, 73L, 1966172285489547454L, 15L}, {123L, 2L, 2357576115802154906L, 14L}, {126L, 86L, 6975002784357916685L, 13L}, {113L, 72L, 7832991040309534696L, 16L}, {94L, 90L, 6795275399568163449L, 14L}, {91L, 79L, 3412149970483734335L, 15L}};
        z = new long[][]{{12L, 103L, 414991354899383144L, 16L}, {80L, 96L, -7754866835472443479L, 13L}, {126L, 85L, 18375969678001899L, 14L}, {127L, 118L, -226397194825916494L, 17L}, {68L, 123L, 992112393343981897L, 18L}, {27L, 25L, 3850075539787181146L, 18L}, {107L, 110L, 7551272438423340125L, 17L}, {11L, 109L, 490705798378585419L, 18L}, {19L, 122L, -4303610284082364543L, 16L}, {110L, 29L, 5189856670447664124L, 14L}, {112L, 75L, -8820559327194825955L, 16L}, {0L, 31L, 7904377864150919362L, 17L}, {101L, 121L, 5467874510070170489L, 16L}, {92L, 113L, 5614268696957972584L, 14L}, {81L, 106L, -4462429507620390309L, 16L}, {15L, 109L, -8663217212564229399L, 16L}, {106L, 19L, -727487919022011705L, 13L}, {21L, 27L, -3649764490141534979L, 15L}, {123L, 15L, -8503461449920510364L, 16L}, {79L, 101L, -287904690749949265L, 13L}, {21L, 117L, 230517336926132959L, 18L}, {82L, 17L, 4716166169433994651L, 14L}, {102L, 91L, 9133200400051715419L, 14L}, {101L, 116L, 4379219038355754243L, 15L}, {92L, 95L, 6231997049929559408L, 13L}};
        A = new long[][]{{109L, 119L, 3579182922115978335L, 17L}, {75L, 17L, -3234238595009856144L, 18L}, {85L, 10L, -5732821260701238636L, 13L}, {17L, 93L, 3047009276063114044L, 16L}, {100L, 22L, -4135194792960339386L, 16L}, {110L, 107L, 4886077844560257507L, 17L}, {107L, 81L, -3154839597144820997L, 16L}, {73L, 87L, 3579850532195411951L, 18L}, {74L, 26L, 2120359383946590375L, 14L}, {106L, 100L, -5027715056418142965L, 16L}, {107L, 25L, 4256835786336450936L, 16L}, {22L, 107L, 1479461552523413678L, 19L}, {91L, 103L, -5987568050041288601L, 17L}, {97L, 79L, 4892691432433920494L, 13L}, {77L, 119L, -4541918640156236358L, 19L}, {29L, 9L, 3999501252919557186L, 15L}, {95L, 123L, -659949714285625235L, 16L}, {116L, 80L, -7968411070778471264L, 16L}, {121L, 79L, -5301344850610085672L, 15L}, {109L, 121L, 6627559469341902197L, 18L}, {117L, 24L, -6603205840901868917L, 18L}, {84L, 119L, -2216697821181351799L, 18L}, {117L, 120L, 8860540541213504883L, 14L}, {112L, 101L, -8267011717833774604L, 14L}, {110L, 29L, -7138227964651696211L, 18L}};
        B = new long[][]{{78L, 73L, 3092918115710934898L, 41L}, {78L, 73L, 655458377648375445L, 43L}, {78L, 73L, 1011773947002820482L, 34L}, {78L, 73L, -2070374126392839733L, 35L}, {78L, 73L, 4819549464905729853L, 34L}, {78L, 73L, 2876362789697114173L, 47L}, {78L, 73L, -7294166560414126684L, 49L}, {78L, 73L, -2920814546009678940L, 40L}, {78L, 73L, 6738011272150770570L, 35L}, {78L, 73L, 70846429711434409L, 41L}};
        C = new long[][]{{88L, 89L, 6933742933758896073L, 50L}, {88L, 89L, -8234642793546888799L, 37L}, {88L, 89L, -8631118454783829617L, 24L}, {88L, 89L, -8631116255760573195L, 24L}, {88L, 89L, -8631140445016393837L, 24L}, {88L, 89L, -2966454176722764200L, 24L}, {88L, 89L, -9008695554393144474L, 27L}, {88L, 89L, 3701249928899345412L, 33L}, {88L, 89L, 7534190137445761735L, 31L}, {88L, 89L, 459511890122522327L, 51L}};
        D = new long[][]{{111L, 80L, -3234910739096369523L, 20L}, {127L, 83L, 2945764520616861295L, 88L}, {127L, 83L, 4764173450705592046L, 95L}};
        F = new String[]{"TX", "GL", "WB", "MD", "NV", "TM", "CT", "AP", "BW", "RA", "LP", "IS", "PV", "CB", "SH", "VB", "ZN", "CU", "SO", "DE", "SP", "KW", "FR", "SW"};
        long[][][] lArrayArray = new long[][][]{g, h, i, j, k, l, m, n, o, p, q, s, r, t, u, v, w, x, y, z, A, B, C, D};
        Map<Byte, List<long[]>> map = new HashMap<Byte, List<long[]>>();
        for (int i3 = 0; i3 < lArrayArray.length; ++i3) {
            for (long[] lArray : lArrayArray[i3]) {
                byte by2 = (byte)(lArray[0] ^ 0x3CL);
                map.computeIfAbsent(by2, by -> new ArrayList<long[]>()).add(new long[]{lArray[1], lArray[2], lArray[3], i3});
            }
        }
        E = map;
    }

    private static /* synthetic */ String _qlc(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xFE;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2052971103 + 1050969307 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static interface PsapiEx
    extends Psapi {
        public static final PsapiEx INSTANCE = Native.load("psapi", PsapiEx.class, W32APIOptions.DEFAULT_OPTIONS);

        @Override
        public boolean EnumProcesses(int[] var1, int var2, IntByReference var3);

        @Override
        public boolean EnumProcessModules(WinNT.HANDLE var1, WinDef.HMODULE[] var2, int var3, IntByReference var4);

        public int GetModuleFileNameExW(WinNT.HANDLE var1, WinDef.HMODULE var2, char[] var3, int var4);
    }

    private static final class a {
        boolean a;
        boolean b;
        boolean c;
        final Set<String> d = new LinkedHashSet<String>();
        final List<ProcessMemoryScanner.a> e = new ArrayList<ProcessMemoryScanner.a>();

        private a() {
        }
    }

    private static interface NtDll
    extends Library {
        public static final NtDll INSTANCE = Native.load("ntdll", NtDll.class);

        public int NtQueryInformationProcess(WinNT.HANDLE var1, int var2, Pointer var3, int var4, IntByReference var5);
    }
}


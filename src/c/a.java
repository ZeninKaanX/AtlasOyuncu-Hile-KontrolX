/*
 * Decompiled with CFR 0.152.
 */
package c;

import b.j;
import c.d;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.FileAttribute;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import scanner.q;
import util.I18n;

public class a {
    private final ForkJoinPool a;
    private final ExecutorService executor;
    private volatile boolean cancelled;
    private final ConcurrentLinkedQueue<CompletableFuture<Void>> futures = new ConcurrentLinkedQueue();
    private static final byte[] e = new byte[]{80, 75, 3, 4};
    private static final Set<String> f = Set.of(".tmp", ".dat", ".bin", ".bak", ".old", ".cfg", ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".txt", ".log", ".pdf", ".doc", ".docx", ".xlsx", ".mp3", ".mp4", ".avi", ".wav", ".ogg", ".flac", ".html", ".css", ".js", ".xml", ".json", ".ini", ".dll", ".exe", ".sys", ".rar", ".7z", ".tar", ".gz", ".class");

    public a() {
        this.a = new ForkJoinPool(Math.max(1, Runtime.getRuntime().availableProcessors()));
        this.executor = Executors.newCachedThreadPool(runnable -> {
            Thread thread = new Thread(runnable, "discovery-io");
            thread.setDaemon(true);
            return thread;
        });
    }

    public void a() {
        this.cancelled = true;
        this.futures.clear();
    }

    public void a(File file, String string, boolean bl, boolean bl2, boolean bl3, boolean bl4, Listener a2, AtomicInteger atomicInteger, AtomicInteger atomicInteger2, List<j> list, List<b.b> list2) {
        boolean bl5;
        if (this.cancelled) {
            atomicInteger.incrementAndGet();
            return;
        }
        String string2 = file == null ? "" : file.getName().toLowerCase();
        boolean bl6 = string2.endsWith(".jar");
        boolean bl7 = string2.endsWith(".zip");
        boolean bl8 = bl5 = !bl6 && !bl7 && bl3 && c.a.a(string2);
        if (!(file != null && file.isFile() && (bl6 || bl7 && bl2 || bl5))) {
            int n2 = atomicInteger.incrementAndGet();
            int n3 = atomicInteger2.get();
            if (a2 != null) {
                a2.a(n2, n3);
            }
            return;
        }
        CompletableFuture<Void> completableFuture = CompletableFuture.runAsync(() -> {
            block19: {
                if (this.cancelled) {
                    atomicInteger.incrementAndGet();
                    return;
                }
                try {
                    Object object;
                    d.a a3;
                    if (bl5) {
                        if (!c.a.a(file) || (a3 = c.d.a(file, string, bl, bl4)) == null || this.cancelled) break block19;
                        object = new j(a3.a.getFileName(), a3.a.getPath(), a3.a.getSize(), a3.a.getDetails(), a3.a.getObfuscation(), I18n.a("yes"));
                        for (b.b b2 : a3.b) {
                            b2.setExtensionChanged(I18n.a("yes"));
                        }
                        List list3 = list;
                        synchronized (list3) {
                            list.add((j)object);
                            if (!a3.b.isEmpty()) {
                                list2.addAll(a3.b);
                            }
                            break block19;
                        }
                    }
                    if (string2.endsWith(".zip")) {
                        this.a(file, string, bl, bl4, list, list2, 0);
                        break block19;
                    }
                    a3 = c.d.a(file, string, bl, bl4);
                    if (a3 != null && !this.cancelled) {
                        object = list;
                        synchronized (object) {
                            list.add(a3.a);
                            if (!a3.b.isEmpty()) {
                                list2.addAll(a3.b);
                            }
                        }
                    }
                    this.a(file, string, bl, bl4, list, list2, 0);
                }
                catch (Exception exception) {
                }
                finally {
                    int n2 = atomicInteger.incrementAndGet();
                    int n3 = atomicInteger2.get();
                    if (a2 != null && !this.cancelled) {
                        a2.a(n2, n3);
                    }
                }
            }
        }, this.a);
        this.futures.add(completableFuture);
    }

    public static boolean a(String string) {
        int n2 = string.lastIndexOf(46);
        if (n2 == -1) {
            return false;
        }
        return f.contains(string.substring(n2));
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    private static boolean a(File file) {
        try (FileInputStream fileInputStream = new FileInputStream(file);){
            byte[] byArray = new byte[4];
            if (fileInputStream.read(byArray) != 4) return false;
            boolean bl = byArray[0] == e[0] && byArray[1] == e[1] && byArray[2] == e[2] && byArray[3] == e[3];
            return bl;
        }
        catch (Exception exception) {
            // empty catch block
        }
        return false;
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private void a(File file, String string, boolean bl, boolean bl2, List<j> list, List<b.b> list2, int n2) {
        if (n2 >= 3) {
            return;
        }
        try (ZipFile zipFile = new ZipFile(file);){
            Enumeration<? extends ZipEntry> enumeration = zipFile.entries();
            while (enumeration.hasMoreElements() && !this.cancelled) {
                ZipEntry zipEntry = enumeration.nextElement();
                String string2 = zipEntry.getName();
                if (zipEntry.isDirectory()) continue;
                String string3 = string2.toLowerCase();
                boolean bl3 = string3.endsWith(".jar");
                boolean bl4 = string3.endsWith(".zip");
                if (!bl3 && !bl4) continue;
                String string4 = string2.contains("/") ? string2.substring(string2.lastIndexOf(47) + 1) : string2;
                try {
                    InputStream inputStream = zipFile.getInputStream(zipEntry);
                    try {
                        Path path = Files.createTempFile("atlas-inner-", ".jar", new FileAttribute[0]);
                        try {
                            Files.copy(inputStream, path, StandardCopyOption.REPLACE_EXISTING);
                            d.a a2 = c.d.a(path.toFile(), string, bl, bl2);
                            if (a2 == null || this.cancelled) continue;
                            String string5 = file.getAbsolutePath() + "!/" + string2;
                            String string6 = file.getName() + "!/" + string4;
                            j j2 = new j(string6, string5, a2.a.getSize(), a2.a.getDetails(), a2.a.getObfuscation());
                            for (b.b b2 : a2.b) {
                                b2.setFileName(string6);
                                b2.setFilePath(string5);
                            }
                            List<j> list3 = list;
                            synchronized (list3) {
                                list.add(j2);
                                if (!a2.b.isEmpty()) {
                                    list2.addAll(a2.b);
                                }
                            }
                            this.a(path.toFile(), string, bl, bl2, list, list2, n2 + 1);
                        }
                        finally {
                            Files.deleteIfExists(path);
                        }
                    }
                    finally {
                        if (inputStream == null) continue;
                        inputStream.close();
                    }
                }
                catch (Exception exception) {}
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    public void a(List<File> list, Map<File, Boolean> map, String string, boolean bl, boolean bl2, boolean bl3, Listener a2) {
        if (list == null || list.isEmpty()) {
            if (a2 != null) {
                a2.a();
            }
            return;
        }
        this.cancelled = false;
        boolean bl4 = string != null && !string.trim().isEmpty();
        AtomicInteger atomicInteger = new AtomicInteger(0);
        AtomicInteger atomicInteger2 = new AtomicInteger(-1);
        List list2 = Collections.synchronizedList(new ArrayList());
        List list3 = Collections.synchronizedList(new ArrayList());
        CompletableFuture.runAsync(() -> this.a(list, map, string, bl, bl2, bl3, bl4, a2, atomicInteger, atomicInteger2, (List<j>)list2, list3));
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private void a(List<File> list, Map<File, Boolean> map, String string, boolean bl, boolean bl2, boolean bl3, boolean bl4, Listener a2, AtomicInteger atomicInteger, AtomicInteger atomicInteger2, List<j> list2, List<b.b> list3) {
        ScheduledExecutorService scheduledExecutorService = Executors.newSingleThreadScheduledExecutor();
        try {
            CompletableFuture<Void> completableFuture;
            scheduledExecutorService.scheduleAtFixedRate(() -> {
                if (this.cancelled) {
                    return;
                }
                ArrayList<j> arrayList = new ArrayList<j>();
                ArrayList<b.b> arrayList2 = new ArrayList<b.b>();
                synchronized (list2) {
                    if (!list2.isEmpty()) {
                        arrayList.addAll(list2);
                        list2.clear();
                    }
                }
                synchronized (list3) {
                    if (!list3.isEmpty()) {
                        arrayList2.addAll(list3);
                        list3.clear();
                    }
                }
                if (a2 != null) {
                    if (!arrayList.isEmpty()) {
                        a2.a(arrayList);
                    }
                    if (!arrayList2.isEmpty()) {
                        a2.b(arrayList2);
                    }
                }
            }, 250L, 250L, TimeUnit.MILLISECONDS);
            AtomicInteger atomicInteger3 = new AtomicInteger(0);
            ArrayList<CompletableFuture<Void>> arrayList = new ArrayList<CompletableFuture<Void>>();
            for (File serializable2 : list) {
                boolean completableFuture2 = map.getOrDefault(serializable2, false);
                CompletableFuture<Void> exception = CompletableFuture.runAsync(() -> {
                    if (serializable2.getPath().equals("__ALL_DISKS__") && System.getProperty("os.name").toLowerCase().contains("win")) {
                        for (File file3 : File.listRoots()) {
                            String string2 = file3.getPath();
                            if (string2.length() < 2 || string2.charAt(1) != ':') continue;
                            String string3 = bl3 ? ".jar|.zip|.tmp|.dat|.bin|.bak|.old|.cfg|.png|.jpg|.jpeg|.gif|.bmp|.ico|.txt|.log|.pdf|.doc|.docx|.xlsx|.mp3|.mp4|.avi|.wav|.ogg|.flac|.html|.css|.js|.xml|.json|.ini|.dll|.exe|.sys|.rar|.7z|.tar|.gz|.class" : ".jar|.zip";
                            q.a(string2.charAt(0), string3, file -> {
                                if (this.cancelled) {
                                    return;
                                }
                                atomicInteger3.incrementAndGet();
                                this.a((File)file, string, bl, bl2, bl3, bl4, a2, atomicInteger, atomicInteger2, list2, list3);
                            });
                        }
                    } else {
                        util.b.a(serializable2, completableFuture2, bl3, file -> {
                            if (this.cancelled) {
                                return;
                            }
                            atomicInteger3.incrementAndGet();
                            this.a((File)file, string, bl, bl2, bl3, bl4, a2, atomicInteger, atomicInteger2, list2, list3);
                        });
                    }
                }, this.executor);
                arrayList.add(exception);
            }
            CompletableFuture[] completableFutureArray = arrayList.toArray(new CompletableFuture[0]);
            CompletableFuture.allOf(completableFutureArray).join();
            atomicInteger2.set(atomicInteger3.get());
            ArrayList<CompletableFuture<Void>> arrayList2 = new ArrayList<CompletableFuture<Void>>();
            while ((completableFuture = this.futures.poll()) != null) {
                arrayList2.add(completableFuture);
            }
            if (!arrayList2.isEmpty() && !this.cancelled) {
                try {
                    CompletableFuture.allOf(arrayList2.toArray(new CompletableFuture[0])).join();
                }
                catch (Exception exception) {
                    // empty catch block
                }
            }
            this.futures.clear();
        }
        catch (Exception exception) {
            exception.printStackTrace();
        }
        finally {
            scheduledExecutorService.shutdown();
            if (a2 != null) {
                if (this.cancelled) {
                    a2.b();
                } else {
                    if (!list2.isEmpty()) {
                        a2.a(new ArrayList<j>(list2));
                    }
                    if (!list3.isEmpty()) {
                        a2.b(new ArrayList<b.b>(list3));
                    }
                    a2.a();
                }
            }
        }
    }

    public void b() {
        this.cancelled = true;
        this.a.shutdown();
        this.executor.shutdown();
    }

    private static /* synthetic */ String _rxvd(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xE2;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 468689721 + 1418262839 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static interface Listener {
        public void a(int var1, int var2);

        public void a(List<j> var1);

        public void b(List<b.b> var1);

        public void a();

        public void b();
    }
}


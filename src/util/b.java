/*
 * Decompiled with CFR 0.152.
 */
package util;

import c.a;
import java.io.File;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.FileVisitResult;
import java.nio.file.FileVisitor;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.function.Consumer;
import util.I18n;

public class b {
    private static boolean a(String string) {
        String string2 = string.toLowerCase();
        return string2.endsWith(".jar") || string2.endsWith(".zip");
    }

    private static boolean b(String string) {
        String string2 = string.toLowerCase();
        return a.a(string2);
    }

    private static boolean a(String string, boolean bl) {
        return b.a(string) || bl && b.b(string);
    }

    public static void a(File file, boolean bl, final boolean bl2, final Consumer<File> consumer) {
        block13: {
            if (file == null || !file.exists() || !file.isDirectory()) {
                return;
            }
            Path path = file.toPath();
            try {
                if (bl) {
                    Files.walkFileTree(path, (FileVisitor<? super Path>)new SimpleFileVisitor<Path>(){

                        @Override
                        public FileVisitResult visitFile(Path path, BasicFileAttributes basicFileAttributes) {
                            if (b.a(path.toString(), bl2)) {
                                consumer.accept(path.toFile());
                            }
                            return FileVisitResult.CONTINUE;
                        }

                        @Override
                        public FileVisitResult visitFileFailed(Path path, IOException iOException) {
                            return FileVisitResult.CONTINUE;
                        }
                    });
                    break block13;
                }
                try (DirectoryStream<Path> directoryStream = Files.newDirectoryStream(path);){
                    for (Path path2 : directoryStream) {
                        try {
                            if (!Files.isRegularFile(path2, new LinkOption[0]) || !b.a(path2.toString(), bl2)) continue;
                            consumer.accept(path2.toFile());
                        }
                        catch (Exception exception) {}
                    }
                }
            }
            catch (IOException iOException) {
                System.err.println(String.format(I18n.a("scanner.error.directory"), file.getAbsolutePath(), iOException.getMessage()));
            }
        }
    }

    private static /* synthetic */ String _gukt(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x4C;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 273248565 + 505403787 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


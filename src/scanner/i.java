/*
 * Decompiled with CFR 0.152.
 */
package scanner;

import b.l;
import b.m;
import e.a;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javafx.embed.swing.SwingFXUtils;
import javafx.scene.image.Image;
import javafx.scene.image.WritableImage;
import javax.swing.Icon;
import javax.swing.filechooser.FileSystemView;
import scanner.PrefetchParser;
import scanner.p;
import util.I18n;
import util.SignatureChecker;

public class i {
    private static final Object a = new Object();
    private static Map<String, Image> b = Collections.synchronizedMap(new HashMap());
    private static Map<String, Image> c = Collections.synchronizedMap(new HashMap());

    public static List<l> a() {
        File file2 = new File(System.getenv("SystemRoot") + "\\Prefetch");
        if (!file2.exists() || !file2.isDirectory()) {
            return new ArrayList<l>();
        }
        File[] fileArray = file2.listFiles();
        if (fileArray == null) {
            System.err.println(I18n.a("prefetch.error.list"));
            return new ArrayList<l>();
        }
        return Arrays.stream(fileArray).parallel().filter(file -> file.getName().toLowerCase().endsWith(".pf")).map(file -> {
            try {
                return i.a(file);
            }
            catch (Exception exception) {
                System.err.println("Prefetch parse error: " + exception.getMessage());
                return null;
            }
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    /*
     * WARNING - void declaration
     */
    private static l a(File file) {
        Object object;
        String var16_22 = "";
        String string;
        Object object2;
        Object object3;
        String string2;
        boolean bl;
        ArrayList<m> arrayList;
        String string3;
        String string4;
        String string5;
        String string6;
        String string7 = file.getName().toLowerCase();
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        long l2 = file.length();
        String string8 = l2 / 1024L + " KB";
        String string9 = file.isHidden() ? I18n.a("yes") : I18n.a("no");
        PrefetchParser.a a2 = PrefetchParser.a(file);
        String string10 = simpleDateFormat.format(new Date(file.lastModified()));
        if (a2.a()) {
            string6 = file.getName();
            int n = string6.lastIndexOf("-");
            if (n != -1) {
                string6 = string6.substring(0, n);
            }
            string5 = string10;
            string4 = "-";
            string3 = "-";
            arrayList = new ArrayList<m>();
            bl = string7.startsWith("java.exe") || string7.startsWith("javaw.exe");
        } else {
            string6 = a2.a != null ? a2.a : file.getName();
            string5 = a2.e != null ? simpleDateFormat.format(a2.e) : string10;
            string4 = String.valueOf(a2.d);
            bl = string6.toLowerCase().contains("java.exe") || string6.toLowerCase().contains("javaw.exe");
            arrayList = new ArrayList();
            for (String object52 : a2.g) {
                String var20_29 = "";
                string2 = e.a.a(object52);
                File file2 = new File(string2);
                object3 = I18n.a("no");
                String string11 = I18n.a("yes");
                object2 = "0 KB";
                if (file2.exists()) {
                    String string12 = I18n.a("no");
                    object3 = file2.isHidden() ? I18n.a("yes") : I18n.a("no");
                    long l3 = file2.length();
                    object2 = l3 / 1024L + " KB";
                    if (l3 < 1024L && l3 > 0L) {
                        object2 = "< 1 KB";
                    }
                }
                String string13 = "";
                string = "";
                if (bl && file2.exists()) {
                    p.a a3 = p.a(file2);
                    string13 = a3.a;
                    string = a3.b;
                }
                arrayList.add(new m(file2.getName(), string2, (String)object3, string13, string, (String)object2, (String)var20_29, string6, "", ""));
                if (!file2.exists()) continue;
                ((m)arrayList.get(arrayList.size() - 1)).setFileIcon(i.b(file2));
            }
            string3 = String.valueOf(arrayList.size());
        }
        for (m m2 : arrayList) {
            string2 = m2.getPath();
            int n = string2.lastIndexOf(58);
            if (n > 2) {
                string2 = string2.substring(0, n);
            }
            if (!((File)(object3 = new File(string2))).exists()) continue;
            try {
                SignatureChecker.a a4 = SignatureChecker.a((File)object3);
                m2.setSignature(a4.a);
                m2.setSignatureStyle(a4.b);
            }
            catch (Exception exception) {}
        }
        Object object6 = file.getAbsolutePath();
        String string14 = "";
        string2 = "";
        if (string6 != null) {
            String string15 = string6.toLowerCase();
            for (m m3 : arrayList) {
                object2 = m3.getPath().toLowerCase();
                int n = ((String)object2).lastIndexOf(58);
                if (n > 2) {
                    object2 = ((String)object2).substring(0, n);
                }
                if (!((String)object2).endsWith("\\" + string15)) continue;
                string = m3.getPath();
                int n2 = string.lastIndexOf(58);
                if (n2 > 2) {
                    string = string.substring(0, n2);
                }
                object6 = string;
                String string16 = m3.getSignature();
                string2 = m3.getSignatureStyle();
                break;
            }
        }
        Object object4 = "-";
        object3 = new File((String)object6);
        if (((File)object3).exists()) {
            long l4 = ((File)object3).length();
            object4 = l4 / 1024L + " KB";
        }
        String string17 = string8 + " / " + (String)object4;
        object2 = new l(string6, (String)object6, string5, string17, string9, string4, string3, string10, (String)var16_22, arrayList, bl);
        ((l)object2).setSignatureStyle(string2);
        ((l)object2).setPfFileName(file.getName());
        ((l)object2).setPfFilePath(file.getAbsolutePath());
        double d2 = (double)file.length() / 1024.0;
        ((l)object2).setPfSize(d2 >= 1024.0 ? String.format("%.2f MB", d2 / 1024.0) : String.format("%.2f KB", d2));
        Path path = file.toPath();
        try {
            BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class, new LinkOption[0]);
            ((l)object2).setPfCreated(simpleDateFormat.format(new Date(attrs.creationTime().toMillis())));
            ((l)object2).setPfModified(simpleDateFormat.format(new Date(attrs.lastModifiedTime().toMillis())));
        }
        catch (Exception exception) {
            ((l)object2).setPfCreated("-");
            ((l)object2).setPfModified(string10);
        }
        object = new File((String)object6);
        if (((File)object).exists() && !((String)object6).equals(file.getAbsolutePath())) {
            double d3 = (double)((File)object).length() / 1024.0;
            ((l)object2).setExeSize(d3 >= 1024.0 ? String.format("%.2f MB", d3 / 1024.0) : String.format("%.2f KB", d3));
            try {
                BasicFileAttributes basicFileAttributes = Files.readAttributes(((File)object).toPath(), BasicFileAttributes.class, new LinkOption[0]);
                ((l)object2).setExeCreated(simpleDateFormat.format(new Date(basicFileAttributes.creationTime().toMillis())));
                ((l)object2).setExeModified(simpleDateFormat.format(new Date(basicFileAttributes.lastModifiedTime().toMillis())));
            }
            catch (Exception exception) {
                ((l)object2).setExeCreated("-");
                ((l)object2).setExeModified("-");
            }
        } else {
            ((l)object2).setExeSize("-");
            ((l)object2).setExeCreated("-");
            ((l)object2).setExeModified("-");
        }
        ArrayList<String> arrayList2 = new ArrayList<String>();
        if (!a2.a() && a2.f != null) {
            for (Date date : a2.f) {
                arrayList2.add(simpleDateFormat.format(date));
            }
        }
        ((l)object2).setRunTimes(arrayList2);
        ((l)object2).setProgramIcon(i.a(string6, arrayList));
        if (((l)object2).getProgramIcon() != null) {
            for (m m4 : arrayList) {
                m4.setParentIcon(((l)object2).getProgramIcon());
            }
        }
        try {
            boolean bl2 = false;
            try {
                bl2 = (Boolean)Files.getAttribute(file.toPath(), "dos:readonly", new LinkOption[0]);
            }
            catch (Exception exception) {
                boolean bl3 = bl2 = !file.canWrite();
            }
            if (bl2) {
                ((l)object2).setIntegrityStatus(I18n.a("yes"));
                ((l)object2).setIsReadOnly(true);
            } else {
                ((l)object2).setIntegrityStatus(I18n.a("no"));
                ((l)object2).setIsReadOnly(false);
            }
        }
        catch (Exception exception) {
            ((l)object2).setIntegrityStatus("-");
        }
        return (l)object2;
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static Image a(String string, List<m> list) {
        Object object;
        if (string == null) {
            return null;
        }
        String string2 = string.toLowerCase();
        if (b.containsKey(string2)) {
            return b.get(string2);
        }
        File file = null;
        for (m object2 : list) {
            String n = object2.getPath().toLowerCase();
            if (!n.endsWith("\\" + string2) && !n.equals(string2) || !((File)(object = new File(object2.getPath()))).exists()) continue;
            file = (File)object;
            break;
        }
        if (file != null) {
            try {
                Object object3 = file;
                String string3 = file.getAbsolutePath();
                int n = string3.lastIndexOf(58);
                if (n > 2) {
                    object3 = new File(string3.substring(0, n));
                }
                Object object2 = a;
                Icon icon;
                synchronized (object2) {
                    icon = FileSystemView.getFileSystemView().getSystemIcon((File)object3);
                }
                if (icon != null) {
                    BufferedImage bufferedImage = new BufferedImage(icon.getIconWidth(), icon.getIconHeight(), 2);
                    Graphics graphics = bufferedImage.getGraphics();
                    icon.paintIcon(null, graphics, 0, 0);
                    graphics.dispose();
                    WritableImage writableImage = SwingFXUtils.toFXImage(bufferedImage, null);
                    b.put(string2, writableImage);
                    return writableImage;
                }
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        b.put(string2, null);
        return null;
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    private static Image b(File file) {
        String string;
        String string2 = file.getName().toLowerCase();
        int n = string2.indexOf(58);
        String string3 = n > 0 ? string2.substring(0, n) : string2;
        int n2 = string3.lastIndexOf(46);
        String string4 = string = n2 >= 0 ? string3.substring(n2) : "_noext";
        if (c.containsKey(string)) {
            return c.get(string);
        }
        try {
            Icon icon;
            File file2 = file;
            String string5 = file.getAbsolutePath();
            int n3 = string5.lastIndexOf(58);
            if (n3 > 2) {
                file2 = new File(string5.substring(0, n3));
            }
            Object object = a;
            synchronized (object) {
                icon = FileSystemView.getFileSystemView().getSystemIcon(file2);
            }
            if (icon != null) {
                object = new BufferedImage(icon.getIconWidth(), icon.getIconHeight(), 2);
                Graphics2D graphics2D = ((BufferedImage)object).createGraphics();
                icon.paintIcon(null, graphics2D, 0, 0);
                graphics2D.dispose();
                WritableImage writableImage = SwingFXUtils.toFXImage((BufferedImage)object, null);
                c.put(string, writableImage);
                return writableImage;
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        c.put(string, null);
        return null;
    }

    private static /* synthetic */ String _jno(String string, int n) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n2 = n ^ 0x6A;
            int n3 = 0;
            while (n3 < cArray.length) {
                n2 = n2 * 1189057431 + 1651060987 & Integer.MAX_VALUE;
                int n4 = n3++;
                cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}

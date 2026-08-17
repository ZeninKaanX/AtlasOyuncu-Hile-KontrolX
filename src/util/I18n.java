/*
 * Decompiled with CFR 0.152.
 */
package util;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.prefs.Preferences;

public class I18n {
    private static ResourceBundle a;
    private static Locale b;
    private static final Preferences c;
    private static final List<Runnable> d;

    public static void a(Locale locale) {
        if (b != null && b.equals(locale)) {
            return;
        }
        b = locale;
        c.put("locale", locale.getLanguage());
        I18n.b();
        I18n.c();
    }

    public static Locale a() {
        return b;
    }

    private static void b() {
        try {
            a = ResourceBundle.getBundle("assets/Bundle", b);
        }
        catch (Exception exception) {
            a = ResourceBundle.getBundle("assets/Bundle", Locale.ENGLISH);
        }
    }

    public static String a(String string) {
        try {
            return a.getString(string);
        }
        catch (Exception exception) {
            return string;
        }
    }

    public static void a(Runnable runnable) {
        d.add(runnable);
    }

    public static void b(Runnable runnable) {
        d.remove(runnable);
    }

    private static void c() {
        for (Runnable runnable : d) {
            runnable.run();
        }
    }

    static {
        c = Preferences.userNodeForPackage(I18n.class);
        d = new ArrayList<Runnable>();
        String string = c.get("locale", "en");
        b = Locale.forLanguageTag(string);
        I18n.b();
    }

    private static /* synthetic */ String _pflt(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xFB;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2138419073 + 2033185085 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


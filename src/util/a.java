/*
 * Decompiled with CFR 0.152.
 */
package util;

public final class a {
    public static final String a = util.a.b("#ff79c6");
    public static final String b = util.a.b("#50fa7b");
    public static final String c = util.a.b("#50fa7b");
    public static final String d = util.a.b("#f1fa8c");
    public static final String e = util.a.b("#ff79c6");
    public static final String f = util.a.a("#6272a4");
    public static final String g = util.a.c("rgba(255, 121, 198, 0.15)");

    public static String a(String string) {
        return "-fx-text-fill: " + string + ";";
    }

    public static String b(String string) {
        return "-fx-text-fill: " + string + "; -fx-font-weight: bold;";
    }

    public static String c(String string) {
        return "-fx-background-color: " + string + ";";
    }

    private static /* synthetic */ String _gb(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x2D;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1978599439 + 108559359 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


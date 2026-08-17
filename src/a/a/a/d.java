/*
 * Decompiled with CFR 0.152.
 */
package a.a.a;

public final class d {
    public String a() {
        return "/atlantafx/base/theme/nord-dark.css";
    }

    private static /* synthetic */ String _ac(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 8;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 174715229 + 1857841571 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


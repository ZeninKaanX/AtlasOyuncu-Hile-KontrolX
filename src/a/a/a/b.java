/*
 * Decompiled with CFR 0.152.
 */
package a.a.a;

public class b {
    public String a() {
        return "/atlantafx/base/theme/cupertino-light.css";
    }

    private static /* synthetic */ String _ubqv(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x4A;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1367021227 + 1811587873 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


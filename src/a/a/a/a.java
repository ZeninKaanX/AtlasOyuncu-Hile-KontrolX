/*
 * Decompiled with CFR 0.152.
 */
package a.a.a;

public class a {
    public String a() {
        return "/atlantafx/base/theme/cupertino-dark.css";
    }

    private static /* synthetic */ String _qmyp(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x39;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1357769383 + 1100510393 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


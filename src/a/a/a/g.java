/*
 * Decompiled with CFR 0.152.
 */
package a.a.a;

public final class g {
    public String a() {
        return "/atlantafx/base/theme/primer-light.css";
    }

    private static /* synthetic */ String _im(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xDE;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 451220633 + 591574621 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


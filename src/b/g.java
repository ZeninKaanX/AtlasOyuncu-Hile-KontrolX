/*
 * Decompiled with CFR 0.152.
 */
package b;

public class g {
    private final String a;
    private final String b;
    private final String c;
    private final String d;
    private final boolean e;
    private final String f;

    public g(String string, String string2, String string3, String string4, boolean bl, String string5) {
        this.a = string;
        this.b = string2;
        this.c = string3;
        this.d = string4;
        this.e = bl;
        this.f = string5;
    }

    public String getPid() {
        return this.a;
    }

    public String getDisplayName() {
        return this.b;
    }

    public String getMainClass() {
        return this.c;
    }

    public String getJvmArgs() {
        return this.d;
    }

    public boolean isSuspicious() {
        return this.e;
    }

    public String getDetectionDetails() {
        return this.f;
    }
}


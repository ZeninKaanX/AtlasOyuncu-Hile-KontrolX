/*
 * Decompiled with CFR 0.152.
 */
package b;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import static b.e.b.SUSPICIOUS;
import static b.e.c.OTHER;

public final class e {
    private final c a;
    private final b b;
    private final String c;
    private final String d;
    private final String e;
    private final Instant f;
    private final Map<String, String> g;

    private e(a a2) {
        this.a = a2.a;
        this.b = a2.b;
        this.c = a2.c;
        this.d = a2.d;
        this.e = a2.e;
        this.f = a2.f != null ? a2.f : Instant.now();
        this.g = Collections.unmodifiableMap(new LinkedHashMap<String, String>(a2.g));
    }

    public c getSource() {
        return this.a;
    }

    public b getSeverity() {
        return this.b;
    }

    public String getTitle() {
        return this.c;
    }

    public String getDetail() {
        return this.d;
    }

    public String getEvidence() {
        return this.e;
    }

    public Instant getTimestamp() {
        return this.f;
    }

    public Map<String, String> getMetadata() {
        return this.g;
    }

    public String getMetadata(String string) {
        return this.g.getOrDefault(string, "");
    }

    public static a builder() {
        return new a();
    }

    public String toString() {
        return String.format("[%s] %s: %s \u2014 %s", new Object[]{this.b, this.a, this.c, this.d});
    }

    private static /* synthetic */ String _mxmk(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x36;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2026500369 + 958948319 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }

    public static final class a {
        private c a = OTHER;
        private b b = SUSPICIOUS;
        private String c = "";
        private String d = "";
        private String e = "";
        private Instant f;
        private final Map<String, String> g = new LinkedHashMap<String, String>();

        public a source(c c2) {
            this.a = c2;
            return this;
        }

        public a severity(b b2) {
            this.b = b2;
            return this;
        }

        public a title(String string) {
            this.c = string;
            return this;
        }

        public a detail(String string) {
            this.d = string;
            return this;
        }

        public a evidence(String string) {
            this.e = string;
            return this;
        }

        public a timestamp(Instant instant) {
            this.f = instant;
            return this;
        }

        public a put(String string, String string2) {
            this.g.put(string, string2);
            return this;
        }

        public e build() {
            return new e(this);
        }
    }

    public enum c {
        JVM, USB, OTHER
    }

    public enum b {
        SUSPICIOUS, CRITICAL
    }
}


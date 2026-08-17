/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import util.I18n;

public class o {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;
    private final StringProperty f;
    private final StringProperty g;
    private final StringProperty h;
    private final StringProperty i;
    private final StringProperty j;

    public o(String string, String string2, String string3, String string4, String string5, boolean bl, String string6, String string7, String string8) {
        int n2 = Math.max(string.lastIndexOf(92), string.lastIndexOf(47));
        String string9 = n2 >= 0 ? string.substring(n2 + 1) : string;
        this.a = new SimpleStringProperty(string9);
        this.b = new SimpleStringProperty(string);
        this.c = new SimpleStringProperty(string4);
        this.d = new SimpleStringProperty(string5);
        this.e = new SimpleStringProperty(bl ? I18n.a("word.yes") : I18n.a("word.no"));
        this.f = new SimpleStringProperty(string2);
        this.g = new SimpleStringProperty(string3);
        this.h = new SimpleStringProperty(string6);
        this.i = new SimpleStringProperty(string7);
        this.j = new SimpleStringProperty(string8 == null ? "" : string8);
    }

    public String getFileName() {
        return (String)this.a.get();
    }

    public StringProperty fileNameProperty() {
        return this.a;
    }

    public String getOriginalPath() {
        return (String)this.b.get();
    }

    public StringProperty originalPathProperty() {
        return this.b;
    }

    public String getDrive() {
        return (String)this.c.get();
    }

    public StringProperty driveProperty() {
        return this.c;
    }

    public String getSid() {
        return (String)this.d.get();
    }

    public StringProperty sidProperty() {
        return this.d;
    }

    public String getHidden() {
        return (String)this.e.get();
    }

    public StringProperty hiddenProperty() {
        return this.e;
    }

    public String getDeletionTime() {
        return (String)this.f.get();
    }

    public StringProperty deletionTimeProperty() {
        return this.f;
    }

    public String getFileSize() {
        return (String)this.g.get();
    }

    public StringProperty fileSizeProperty() {
        return this.g;
    }

    public String getExtChanged() {
        return (String)this.h.get();
    }

    public StringProperty extChangedProperty() {
        return this.h;
    }

    public String getObfuscation() {
        return (String)this.i.get();
    }

    public StringProperty obfuscationProperty() {
        return this.i;
    }

    public String getRFilePath() {
        return (String)this.j.get();
    }

    public StringProperty rFilePathProperty() {
        return this.j;
    }

    private static /* synthetic */ String _qphz(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x32;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 620455179 + 1122153745 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


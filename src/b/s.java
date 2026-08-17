/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.LongProperty;
import javafx.beans.property.SimpleLongProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class s {
    private final LongProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;
    private final StringProperty f;
    private final LongProperty g;

    public s(long l2, String string, String string2, String string3, String string4, String string5, long l3) {
        this.a = new SimpleLongProperty(l2);
        this.b = new SimpleStringProperty(string);
        this.c = new SimpleStringProperty(string2);
        this.d = new SimpleStringProperty(string3);
        this.e = new SimpleStringProperty(string4);
        this.f = new SimpleStringProperty(string5);
        this.g = new SimpleLongProperty(l3);
    }

    public long getUsn() {
        return this.a.get();
    }

    public LongProperty usnProperty() {
        return this.a;
    }

    public String getFileName() {
        return (String)this.b.get();
    }

    public StringProperty fileNameProperty() {
        return this.b;
    }

    public String getTimestamp() {
        return (String)this.c.get();
    }

    public StringProperty timestampProperty() {
        return this.c;
    }

    public String getReason() {
        return (String)this.d.get();
    }

    public StringProperty reasonProperty() {
        return this.d;
    }

    public String getFolderPath() {
        return (String)this.e.get();
    }

    public StringProperty folderPathProperty() {
        return this.e;
    }

    public String getFileAttributes() {
        return (String)this.f.get();
    }

    public StringProperty fileAttributesProperty() {
        return this.f;
    }

    public long getFileReferenceNumber() {
        return this.g.get();
    }

    public LongProperty fileReferenceNumberProperty() {
        return this.g;
    }
}


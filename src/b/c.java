/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class c {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;

    public c(String string, String string2, String string3, String string4, String string5) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
    }

    public String getFileName() {
        return (String)this.a.get();
    }

    public StringProperty fileNameProperty() {
        return this.a;
    }

    public String getPath() {
        return (String)this.b.get();
    }

    public StringProperty pathProperty() {
        return this.b;
    }

    public String getCreationTime() {
        return (String)this.c.get();
    }

    public StringProperty creationTimeProperty() {
        return this.c;
    }

    public String getSize() {
        return (String)this.d.get();
    }

    public StringProperty sizeProperty() {
        return this.d;
    }

    public String getIsHidden() {
        return (String)this.e.get();
    }

    public StringProperty isHiddenProperty() {
        return this.e;
    }
}


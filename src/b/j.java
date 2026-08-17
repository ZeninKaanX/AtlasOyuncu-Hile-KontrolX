/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class j {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;
    private final StringProperty f;

    public j(String string, String string2, String string3, String string4, String string5) {
        this(string, string2, string3, string4, string5, "");
    }

    public j(String string, String string2, String string3, String string4, String string5, String string6) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
        this.f = new SimpleStringProperty(string6);
    }

    public String getFileName() {
        return (String)this.a.get();
    }

    public StringProperty fileNameProperty() {
        return this.a;
    }

    public void setFileName(String string) {
        this.a.set(string);
    }

    public String getPath() {
        return (String)this.b.get();
    }

    public StringProperty pathProperty() {
        return this.b;
    }

    public void setPath(String string) {
        this.b.set(string);
    }

    public String getSize() {
        return (String)this.c.get();
    }

    public StringProperty sizeProperty() {
        return this.c;
    }

    public void setSize(String string) {
        this.c.set(string);
    }

    public String getDetails() {
        return (String)this.d.get();
    }

    public StringProperty detailsProperty() {
        return this.d;
    }

    public void setDetails(String string) {
        this.d.set(string);
    }

    public String getObfuscation() {
        return (String)this.e.get();
    }

    public StringProperty obfuscationProperty() {
        return this.e;
    }

    public void setObfuscation(String string) {
        this.e.set(string);
    }

    public String getExtensionChanged() {
        return (String)this.f.get();
    }

    public StringProperty extensionChangedProperty() {
        return this.f;
    }

    public void setExtensionChanged(String string) {
        this.f.set(string);
    }
}


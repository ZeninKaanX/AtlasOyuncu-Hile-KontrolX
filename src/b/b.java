/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class b {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;
    private final StringProperty f;
    private final StringProperty g;

    public b(String string, String string2, String string3, String string4, String string5, String string6) {
        this(string, string2, string3, string4, string5, string6, "");
    }

    public b(String string, String string2, String string3, String string4, String string5, String string6, String string7) {
        this.c = new SimpleStringProperty(string);
        this.a = new SimpleStringProperty(string2);
        this.b = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
        this.f = new SimpleStringProperty(string6);
        this.g = new SimpleStringProperty(string7);
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

    public String getFilePath() {
        return (String)this.b.get();
    }

    public StringProperty filePathProperty() {
        return this.b;
    }

    public void setFilePath(String string) {
        this.b.set(string);
    }

    public String getMatchEntry() {
        return (String)this.c.get();
    }

    public StringProperty matchEntryProperty() {
        return this.c;
    }

    public void setMatchEntry(String string) {
        this.c.set(string);
    }

    public String getHidden() {
        return (String)this.d.get();
    }

    public StringProperty hiddenProperty() {
        return this.d;
    }

    public void setHidden(String string) {
        this.d.set(string);
    }

    public String getSize() {
        return (String)this.e.get();
    }

    public StringProperty sizeProperty() {
        return this.e;
    }

    public void setSize(String string) {
        this.e.set(string);
    }

    public String getObfuscation() {
        return (String)this.f.get();
    }

    public StringProperty obfuscationProperty() {
        return this.f;
    }

    public void setObfuscation(String string) {
        this.f.set(string);
    }

    public String getExtensionChanged() {
        return (String)this.g.get();
    }

    public StringProperty extensionChangedProperty() {
        return this.g;
    }

    public void setExtensionChanged(String string) {
        this.g.set(string);
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.scene.image.Image;

public class m {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;
    private final StringProperty f;
    private final StringProperty g;
    private final StringProperty h;
    private final StringProperty i;
    private String j = "";
    private Image k;
    private Image l;

    public m(String string, String string2, String string3, String string4, String string5, String string6, String string7, String string8, String string9, String string10) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
        this.f = new SimpleStringProperty(string6);
        this.g = new SimpleStringProperty(string7);
        this.h = new SimpleStringProperty(string8);
        this.i = new SimpleStringProperty(string9);
        this.j = string10;
    }

    public void setFileIcon(Image image) {
        this.k = image;
    }

    public Image getFileIcon() {
        return this.k;
    }

    public void setParentIcon(Image image) {
        this.l = image;
    }

    public Image getParentIcon() {
        return this.l;
    }

    public String getName() {
        return (String)this.a.get();
    }

    public StringProperty nameProperty() {
        return this.a;
    }

    public String getPath() {
        return (String)this.b.get();
    }

    public StringProperty pathProperty() {
        return this.b;
    }

    public String getHidden() {
        return (String)this.c.get();
    }

    public StringProperty hiddenProperty() {
        return this.c;
    }

    public String getJarObfuscation() {
        return (String)this.d.get();
    }

    public StringProperty jarObfuscationProperty() {
        return this.d;
    }

    public String getExtensionChanged() {
        return (String)this.e.get();
    }

    public StringProperty extensionChangedProperty() {
        return this.e;
    }

    public String getSize() {
        return (String)this.f.get();
    }

    public StringProperty sizeProperty() {
        return this.f;
    }

    public String getDeleted() {
        return (String)this.g.get();
    }

    public StringProperty deletedProperty() {
        return this.g;
    }

    public String getParentPfName() {
        return (String)this.h.get();
    }

    public StringProperty parentPfNameProperty() {
        return this.h;
    }

    public String getSignature() {
        return (String)this.i.get();
    }

    public void setSignature(String string) {
        this.i.set(string);
    }

    public StringProperty signatureProperty() {
        return this.i;
    }

    public void setSignatureStyle(String string) {
        this.j = string;
    }

    public String getSignatureStyle() {
        return this.j;
    }
}


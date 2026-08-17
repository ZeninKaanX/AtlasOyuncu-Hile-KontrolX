/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class r {
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
    private final StringProperty k;
    private final StringProperty l;
    private final StringProperty m;

    public r(String string, String string2, String string3, String string4, String string5, String string6, String string7, String string8, String string9, String string10, String string11, String string12, String string13) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
        this.f = new SimpleStringProperty(string6);
        this.g = new SimpleStringProperty(string7);
        this.h = new SimpleStringProperty(string8);
        this.i = new SimpleStringProperty(string9);
        this.j = new SimpleStringProperty(string10);
        this.k = new SimpleStringProperty(string11);
        this.l = new SimpleStringProperty(string12);
        this.m = new SimpleStringProperty(string13);
    }

    public String getDeviceName() {
        return (String)this.a.get();
    }

    public StringProperty deviceNameProperty() {
        return this.a;
    }

    public String getDescription() {
        return (String)this.b.get();
    }

    public StringProperty descriptionProperty() {
        return this.b;
    }

    public String getVendorName() {
        return (String)this.c.get();
    }

    public StringProperty vendorNameProperty() {
        return this.c;
    }

    public String getProductName() {
        return (String)this.d.get();
    }

    public StringProperty productNameProperty() {
        return this.d;
    }

    public String getSerialNumber() {
        return (String)this.e.get();
    }

    public StringProperty serialNumberProperty() {
        return this.e;
    }

    public String getVendorId() {
        return (String)this.f.get();
    }

    public StringProperty vendorIdProperty() {
        return this.f;
    }

    public String getProductId() {
        return (String)this.g.get();
    }

    public StringProperty productIdProperty() {
        return this.g;
    }

    public String getLastConnected() {
        return (String)this.h.get();
    }

    public StringProperty lastConnectedProperty() {
        return this.h;
    }

    public String getFirstConnected() {
        return (String)this.i.get();
    }

    public StringProperty firstConnectedProperty() {
        return this.i;
    }

    public String getCapacity() {
        return (String)this.j.get();
    }

    public StringProperty capacityProperty() {
        return this.j;
    }

    public String getFileSystem() {
        return (String)this.k.get();
    }

    public StringProperty fileSystemProperty() {
        return this.k;
    }

    public String getProductRevision() {
        return (String)this.l.get();
    }

    public StringProperty productRevisionProperty() {
        return this.l;
    }

    public String getDriveLetter() {
        return (String)this.m.get();
    }

    public StringProperty driveLetterProperty() {
        return this.m;
    }
}


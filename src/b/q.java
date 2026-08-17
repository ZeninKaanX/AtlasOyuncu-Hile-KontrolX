/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class q {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;

    public q(String string, String string2, String string3, String string4, String string5) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
    }

    public String getServiceName() {
        return (String)this.a.get();
    }

    public StringProperty serviceNameProperty() {
        return this.a;
    }

    public String getDisplayName() {
        return (String)this.b.get();
    }

    public StringProperty displayNameProperty() {
        return this.b;
    }

    public String getStatus() {
        return (String)this.c.get();
    }

    public StringProperty statusProperty() {
        return this.c;
    }

    public String getPid() {
        return (String)this.d.get();
    }

    public StringProperty pidProperty() {
        return this.d;
    }

    public String getStartTime() {
        return (String)this.e.get();
    }

    public StringProperty startTimeProperty() {
        return this.e;
    }
}


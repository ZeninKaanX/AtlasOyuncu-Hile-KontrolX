/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class k {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;

    public k(String string, String string2, String string3, String string4, String string5) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
    }

    public String getEventId() {
        return (String)this.a.get();
    }

    public StringProperty eventIdProperty() {
        return this.a;
    }

    public String getChannel() {
        return (String)this.b.get();
    }

    public StringProperty channelProperty() {
        return this.b;
    }

    public String getTimeCreated() {
        return (String)this.c.get();
    }

    public StringProperty timeCreatedProperty() {
        return this.c;
    }

    public String getMessage() {
        return (String)this.d.get();
    }

    public StringProperty messageProperty() {
        return this.d;
    }

    public String getScriptContent() {
        return (String)this.e.get();
    }

    public StringProperty scriptContentProperty() {
        return this.e;
    }
}


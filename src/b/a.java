/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class a {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;

    public a(String string, String string2, String string3) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
    }

    public String getUsername() {
        return (String)this.a.get();
    }

    public StringProperty usernameProperty() {
        return this.a;
    }

    public void setUsername(String string) {
        this.a.set(string);
    }

    public String getSource() {
        return (String)this.b.get();
    }

    public StringProperty sourceProperty() {
        return this.b;
    }

    public void setSource(String string) {
        this.b.set(string);
    }

    public String getType() {
        return (String)this.c.get();
    }

    public StringProperty typeProperty() {
        return this.c;
    }

    public void setType(String string) {
        this.c.set(string);
    }

    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (object == null || this.getClass() != object.getClass()) {
            return false;
        }
        a a2 = (a)object;
        return this.getUsername() != null ? this.getUsername().equals(a2.getUsername()) : a2.getUsername() == null;
    }

    public int hashCode() {
        return this.getUsername() != null ? this.getUsername().hashCode() : 0;
    }
}


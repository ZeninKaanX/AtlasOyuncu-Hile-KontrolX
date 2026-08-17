/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class n {
    private final StringProperty a;
    private final BooleanProperty b;

    public n(String string, boolean bl) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleBooleanProperty(bl);
    }

    public String getFileName() {
        return (String)this.a.get();
    }

    public StringProperty fileNameProperty() {
        return this.a;
    }

    public boolean isSuspicious() {
        return this.b.get();
    }

    public BooleanProperty suspiciousProperty() {
        return this.b;
    }
}


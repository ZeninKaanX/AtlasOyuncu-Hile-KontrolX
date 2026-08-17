/*
 * Decompiled with CFR 0.152.
 */
package b;

import javafx.beans.property.BooleanProperty;
import javafx.beans.property.LongProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleLongProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class h {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final LongProperty d;
    private final BooleanProperty e;

    public h(String string, String string2, String string3, long l2, boolean bl) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleLongProperty(l2);
        this.e = new SimpleBooleanProperty(bl);
    }

    public String getEntryName() {
        return (String)this.a.get();
    }

    public StringProperty entryNameProperty() {
        return this.a;
    }

    public String getType() {
        return (String)this.b.get();
    }

    public StringProperty typeProperty() {
        return this.b;
    }

    public String getSize() {
        return (String)this.c.get();
    }

    public StringProperty sizeProperty() {
        return this.c;
    }

    public long getRawSize() {
        return this.d.get();
    }

    public LongProperty rawSizeProperty() {
        return this.d;
    }

    public boolean isHidden() {
        return this.e.get();
    }

    public BooleanProperty hiddenProperty() {
        return this.e;
    }
}


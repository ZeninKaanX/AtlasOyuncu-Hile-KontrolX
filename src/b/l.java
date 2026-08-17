/*
 * Decompiled with CFR 0.152.
 */
package b;

import b.m;
import java.util.ArrayList;
import java.util.List;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.scene.image.Image;

public class l {
    private final StringProperty a;
    private final StringProperty b;
    private final StringProperty c;
    private final StringProperty d;
    private final StringProperty e;
    private final StringProperty f;
    private final StringProperty g;
    private final StringProperty h;
    private final StringProperty i;
    private final List<m> j;
    private final StringProperty k;
    private final StringProperty l;
    private final boolean m;
    private boolean n;
    private Image o;
    private String p;
    private String q;
    private String r;
    private String s;
    private String t;
    private String u;
    private String v;
    private String w;
    private List<String> x;
    private String y = "";

    public l(String string, String string2, String string3, String string4, String string5, String string6, String string7, String string8, String string9, List<m> arrayList, boolean bl) {
        this.a = new SimpleStringProperty(string);
        this.b = new SimpleStringProperty(string2);
        this.c = new SimpleStringProperty(string3);
        this.d = new SimpleStringProperty(string4);
        this.e = new SimpleStringProperty(string5);
        this.f = new SimpleStringProperty(string6);
        this.g = new SimpleStringProperty(string7);
        this.h = new SimpleStringProperty(string8);
        this.i = new SimpleStringProperty(string9);
        this.k = new SimpleStringProperty("-");
        this.l = new SimpleStringProperty("");
        this.j = arrayList != null ? arrayList : new ArrayList();
        this.m = bl;
        this.x = new ArrayList<String>();
    }

    public l(String string, String string2, String string3, String string4, String string5) {
        this(string, string2, string3, string4, string5, "-", "-", "-", "", new ArrayList<m>(), false);
    }

    public void setProgramIcon(Image image) {
        this.o = image;
    }

    public Image getProgramIcon() {
        return this.o;
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

    public String getLastUsedTime() {
        return (String)this.c.get();
    }

    public StringProperty lastUsedTimeProperty() {
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

    public String getRunCount() {
        return (String)this.f.get();
    }

    public StringProperty runCountProperty() {
        return this.f;
    }

    public String getRefFileCount() {
        return (String)this.g.get();
    }

    public StringProperty refFileCountProperty() {
        return this.g;
    }

    public String getModifiedTime() {
        return (String)this.h.get();
    }

    public StringProperty modifiedTimeProperty() {
        return this.h;
    }

    public String getSignature() {
        return (String)this.i.get();
    }

    public StringProperty signatureProperty() {
        return this.i;
    }

    public List<m> getReferencedFiles() {
        return this.j;
    }

    public boolean isJavaRelated() {
        return this.m;
    }

    public void setSignatureStyle(String string) {
        this.y = string;
    }

    public String getSignatureStyle() {
        return this.y;
    }

    public String getPfFileName() {
        return this.p;
    }

    public void setPfFileName(String string) {
        this.p = string;
    }

    public String getPfFilePath() {
        return this.q;
    }

    public void setPfFilePath(String string) {
        this.q = string;
    }

    public String getPfSize() {
        return this.r;
    }

    public void setPfSize(String string) {
        this.r = string;
    }

    public String getPfCreated() {
        return this.s;
    }

    public void setPfCreated(String string) {
        this.s = string;
    }

    public String getPfModified() {
        return this.t;
    }

    public void setPfModified(String string) {
        this.t = string;
    }

    public String getExeSize() {
        return this.u;
    }

    public void setExeSize(String string) {
        this.u = string;
    }

    public String getExeCreated() {
        return this.v;
    }

    public void setExeCreated(String string) {
        this.v = string;
    }

    public String getExeModified() {
        return this.w;
    }

    public void setExeModified(String string) {
        this.w = string;
    }

    public String getIntegrityStatus() {
        return (String)this.k.get();
    }

    public StringProperty integrityStatusProperty() {
        return this.k;
    }

    public void setIntegrityStatus(String string) {
        this.k.set(string);
    }

    public String getIntegrityStyle() {
        return (String)this.l.get();
    }

    public StringProperty integrityStyleProperty() {
        return this.l;
    }

    public void setIntegrityStyle(String string) {
        this.l.set(string);
    }

    public List<String> getRunTimes() {
        return this.x;
    }

    public void setRunTimes(List<String> list) {
        this.x = list;
    }

    public boolean isIsReadOnly() {
        return this.n;
    }

    public void setIsReadOnly(boolean bl) {
        this.n = bl;
    }

    private static /* synthetic */ String _rbh(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x8D;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1153669419 + 474445125 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


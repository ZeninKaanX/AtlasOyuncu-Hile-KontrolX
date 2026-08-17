package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class ModReport {
    public static final String CAT_VERIFIED = "VERIFIED";
    public static final String CAT_UNKNOWN = "UNKNOWN";
    public static final String CAT_SUSPICIOUS = "SUSPICIOUS";
    public static final String CAT_BYPASS = "BYPASS";
    public static final String CAT_OBFUSCATED = "OBFUSCATED";

    private final StringProperty fileName;
    private final StringProperty path;
    private final StringProperty category;
    private final StringProperty details;
    private final StringProperty source;

    public ModReport(String fileName, String path, String category, String details, String source) {
        this.fileName = new SimpleStringProperty(fileName);
        this.path = new SimpleStringProperty(path);
        this.category = new SimpleStringProperty(category);
        this.details = new SimpleStringProperty(details);
        this.source = new SimpleStringProperty(source);
    }

    public String getFileName() {
        return this.fileName.get();
    }

    public StringProperty fileNameProperty() {
        return this.fileName;
    }

    public String getPath() {
        return this.path.get();
    }

    public StringProperty pathProperty() {
        return this.path;
    }

    public String getCategory() {
        return this.category.get();
    }

    public StringProperty categoryProperty() {
        return this.category;
    }

    public String getDetails() {
        return this.details.get();
    }

    public StringProperty detailsProperty() {
        return this.details;
    }

    public String getSource() {
        return this.source.get();
    }

    public StringProperty sourceProperty() {
        return this.source;
    }
}

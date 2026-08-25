package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class DownloadHistoryEntry {
    private final StringProperty browser;
    private final StringProperty filename;
    private final StringProperty url;
    private final StringProperty size;
    private final StringProperty date;

    public DownloadHistoryEntry(String browser, String filename, String url, String size, String date) {
        this.browser = new SimpleStringProperty(browser);
        this.filename = new SimpleStringProperty(filename);
        this.url = new SimpleStringProperty(url);
        this.size = new SimpleStringProperty(size);
        this.date = new SimpleStringProperty(date);
    }

    public String getBrowser() { return browser.get(); }
    public StringProperty browserProperty() { return browser; }
    public String getFilename() { return filename.get(); }
    public StringProperty filenameProperty() { return filename; }
    public String getUrl() { return url.get(); }
    public StringProperty urlProperty() { return url; }
    public String getSize() { return size.get(); }
    public StringProperty sizeProperty() { return size; }
    public String getDate() { return date.get(); }
    public StringProperty dateProperty() { return date; }
}

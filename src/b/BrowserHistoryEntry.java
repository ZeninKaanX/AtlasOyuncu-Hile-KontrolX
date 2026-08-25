package b;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class BrowserHistoryEntry {
    private final StringProperty browser;
    private final StringProperty title;
    private final StringProperty url;
    private final StringProperty visitCount;
    private final StringProperty lastVisit;

    public BrowserHistoryEntry(String browser, String title, String url, String visitCount, String lastVisit) {
        this.browser = new SimpleStringProperty(browser);
        this.title = new SimpleStringProperty(title);
        this.url = new SimpleStringProperty(url);
        this.visitCount = new SimpleStringProperty(visitCount);
        this.lastVisit = new SimpleStringProperty(lastVisit);
    }

    public String getBrowser() { return browser.get(); }
    public StringProperty browserProperty() { return browser; }
    public String getTitle() { return title.get(); }
    public StringProperty titleProperty() { return title; }
    public String getUrl() { return url.get(); }
    public StringProperty urlProperty() { return url; }
    public String getVisitCount() { return visitCount.get(); }
    public StringProperty visitCountProperty() { return visitCount; }
    public String getLastVisit() { return lastVisit.get(); }
    public StringProperty lastVisitProperty() { return lastVisit; }
}

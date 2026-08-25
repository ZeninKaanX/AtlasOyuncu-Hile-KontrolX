package d;

import b.BrowserHistoryEntry;
import java.util.List;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.Label;
import javafx.scene.control.MenuItem;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import scanner.BrowserHistoryScanner;
import util.I18n;

public class BrowserHistoryTab extends VBox {
    private final ObservableList<BrowserHistoryEntry> data = FXCollections.observableArrayList();
    private final FilteredList<BrowserHistoryEntry> filtered;
    private final Button scanBtn;

    public BrowserHistoryTab() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));

        this.scanBtn = new Button(I18n.a("browser.btn"));
        this.scanBtn.getStyleClass().addAll("accent");

        Label searchIcon = new Label("\uD83D\uDD0D");
        TextField searchField = new TextField();
        searchField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(searchField, Priority.ALWAYS);

        HBox toolbar = new HBox(10.0, this.scanBtn, searchIcon, searchField);
        toolbar.setAlignment(Pos.CENTER_LEFT);

        TableView<BrowserHistoryEntry> table = new TableView<>();
        table.getStyleClass().addAll("striped", "bordered", "dense");
        table.setFixedCellSize(24.0);
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        VBox.setVgrow(table, Priority.ALWAYS);

        TableColumn<BrowserHistoryEntry, String> colBrowser = new TableColumn<>(I18n.a("browser.col.browser"));
        colBrowser.setCellValueFactory(new PropertyValueFactory<>("browser"));
        colBrowser.setPrefWidth(80);

        TableColumn<BrowserHistoryEntry, String> colTitle = new TableColumn<>(I18n.a("browser.col.title"));
        colTitle.setCellValueFactory(new PropertyValueFactory<>("title"));
        colTitle.setPrefWidth(250);

        TableColumn<BrowserHistoryEntry, String> colUrl = new TableColumn<>(I18n.a("browser.col.url"));
        colUrl.setCellValueFactory(new PropertyValueFactory<>("url"));

        TableColumn<BrowserHistoryEntry, String> colVisits = new TableColumn<>(I18n.a("browser.col.visits"));
        colVisits.setCellValueFactory(new PropertyValueFactory<>("visitCount"));
        colVisits.setPrefWidth(70);

        TableColumn<BrowserHistoryEntry, String> colDate = new TableColumn<>(I18n.a("browser.col.date"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("lastVisit"));
        colDate.setPrefWidth(130);

        table.getColumns().addAll(colBrowser, colTitle, colUrl, colVisits, colDate);

        this.filtered = new FilteredList<>(this.data, p -> true);
        SortedList<BrowserHistoryEntry> sorted = new SortedList<>(this.filtered);
        sorted.comparatorProperty().bind(table.comparatorProperty());
        table.setItems(sorted);

        searchField.textProperty().addListener((obs, old, val) -> {
            if (val == null || val.isEmpty()) {
                this.filtered.setPredicate(p -> true);
            } else {
                String lower = val.toLowerCase();
                this.filtered.setPredicate(e ->
                    (e.getBrowser() != null && e.getBrowser().toLowerCase().contains(lower)) ||
                    (e.getTitle() != null && e.getTitle().toLowerCase().contains(lower)) ||
                    (e.getUrl() != null && e.getUrl().toLowerCase().contains(lower))
                );
            }
        });

        ContextMenu ctx = new ContextMenu();
        MenuItem copyUrl = new MenuItem(I18n.a("mod.ctx.copyPath"));
        copyUrl.setOnAction(ev -> {
            BrowserHistoryEntry sel = table.getSelectionModel().getSelectedItem();
            if (sel != null) {
                ClipboardContent cc = new ClipboardContent();
                cc.putString(sel.getUrl());
                Clipboard.getSystemClipboard().setContent(cc);
            }
        });
        MenuItem copyTitle = new MenuItem(I18n.a("mod.ctx.copyName"));
        copyTitle.setOnAction(ev -> {
            BrowserHistoryEntry sel = table.getSelectionModel().getSelectedItem();
            if (sel != null) {
                ClipboardContent cc = new ClipboardContent();
                cc.putString(sel.getTitle());
                Clipboard.getSystemClipboard().setContent(cc);
            }
        });
        ctx.getItems().addAll(copyUrl, copyTitle);
        table.setContextMenu(ctx);

        Label status = new Label(I18n.a("script.statusReady"));
        status.setStyle(util.a.f);

        this.scanBtn.setOnAction(ev -> {
            this.scanBtn.setDisable(true);
            status.setText(I18n.a("browser.statusScanning"));
            this.data.clear();
            Task<List<BrowserHistoryEntry>> task = new Task<>() {
                @Override
                protected List<BrowserHistoryEntry> call() {
                    return BrowserHistoryScanner.scanAll();
                }
            };
            task.setOnSucceeded(e -> {
                List<BrowserHistoryEntry> result = task.getValue();
                this.data.addAll(result);
                status.setText(String.format(I18n.a("browser.statusFound"), result.size()));
                this.scanBtn.setDisable(false);
            });
            task.setOnFailed(e -> {
                status.setText(I18n.a("detect.statusError"));
                this.scanBtn.setDisable(false);
            });
            new Thread(task).start();
        });

        this.getChildren().addAll(toolbar, table, status);

        I18n.a(() -> {
            this.scanBtn.setText(I18n.a("browser.btn"));
            colBrowser.setText(I18n.a("browser.col.browser"));
            colTitle.setText(I18n.a("browser.col.title"));
            colUrl.setText(I18n.a("browser.col.url"));
            colVisits.setText(I18n.a("browser.col.visits"));
            colDate.setText(I18n.a("browser.col.date"));
            searchField.setPromptText(I18n.a("mod.searchPrompt"));
            if (!this.scanBtn.isDisabled()) {
                status.setText(I18n.a("script.statusReady"));
            }
            table.refresh();
        });
    }

    public void a() {
        this.scanBtn.fire();
    }

    public boolean b() {
        return this.scanBtn.isDisabled();
    }
}

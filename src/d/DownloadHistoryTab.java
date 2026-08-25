package d;

import b.DownloadHistoryEntry;
import java.util.List;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
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
import scanner.DownloadHistoryScanner;
import util.I18n;

public class DownloadHistoryTab extends VBox {
    private final ObservableList<DownloadHistoryEntry> data = FXCollections.observableArrayList();
    private final FilteredList<DownloadHistoryEntry> filtered;
    private final Button scanBtn;

    public DownloadHistoryTab() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));

        this.scanBtn = new Button(I18n.a("download.btn"));
        this.scanBtn.getStyleClass().addAll("accent");

        Label searchIcon = new Label("\uD83D\uDD0D");
        TextField searchField = new TextField();
        searchField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(searchField, Priority.ALWAYS);

        HBox toolbar = new HBox(10.0, this.scanBtn, searchIcon, searchField);
        toolbar.setAlignment(Pos.CENTER_LEFT);

        TableView<DownloadHistoryEntry> table = new TableView<>();
        table.getStyleClass().addAll("striped", "bordered", "dense");
        table.setFixedCellSize(24.0);
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        VBox.setVgrow(table, Priority.ALWAYS);

        TableColumn<DownloadHistoryEntry, String> colBrowser = new TableColumn<>(I18n.a("download.col.browser"));
        colBrowser.setCellValueFactory(new PropertyValueFactory<>("browser"));
        colBrowser.setPrefWidth(80);

        TableColumn<DownloadHistoryEntry, String> colFile = new TableColumn<>(I18n.a("download.col.filename"));
        colFile.setCellValueFactory(new PropertyValueFactory<>("filename"));
        colFile.setPrefWidth(250);

        TableColumn<DownloadHistoryEntry, String> colUrl = new TableColumn<>(I18n.a("download.col.url"));
        colUrl.setCellValueFactory(new PropertyValueFactory<>("url"));

        TableColumn<DownloadHistoryEntry, String> colSize = new TableColumn<>(I18n.a("download.col.size"));
        colSize.setCellValueFactory(new PropertyValueFactory<>("size"));
        colSize.setPrefWidth(80);

        TableColumn<DownloadHistoryEntry, String> colDate = new TableColumn<>(I18n.a("download.col.date"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("date"));
        colDate.setPrefWidth(130);

        table.getColumns().addAll(colBrowser, colFile, colUrl, colSize, colDate);

        this.filtered = new FilteredList<>(this.data, p -> true);
        SortedList<DownloadHistoryEntry> sorted = new SortedList<>(this.filtered);
        sorted.comparatorProperty().bind(table.comparatorProperty());
        table.setItems(sorted);

        searchField.textProperty().addListener((obs, old, val) -> {
            if (val == null || val.isEmpty()) {
                this.filtered.setPredicate(p -> true);
            } else {
                String lower = val.toLowerCase();
                this.filtered.setPredicate(e ->
                    (e.getBrowser() != null && e.getBrowser().toLowerCase().contains(lower)) ||
                    (e.getFilename() != null && e.getFilename().toLowerCase().contains(lower)) ||
                    (e.getUrl() != null && e.getUrl().toLowerCase().contains(lower))
                );
            }
        });

        ContextMenu ctx = new ContextMenu();
        MenuItem copyUrl = new MenuItem(I18n.a("mod.ctx.copyPath"));
        copyUrl.setOnAction(ev -> {
            DownloadHistoryEntry sel = table.getSelectionModel().getSelectedItem();
            if (sel != null) {
                ClipboardContent cc = new ClipboardContent();
                cc.putString(sel.getUrl());
                Clipboard.getSystemClipboard().setContent(cc);
            }
        });
        MenuItem copyName = new MenuItem(I18n.a("mod.ctx.copyName"));
        copyName.setOnAction(ev -> {
            DownloadHistoryEntry sel = table.getSelectionModel().getSelectedItem();
            if (sel != null) {
                ClipboardContent cc = new ClipboardContent();
                cc.putString(sel.getFilename());
                Clipboard.getSystemClipboard().setContent(cc);
            }
        });
        ctx.getItems().addAll(copyUrl, copyName);
        table.setContextMenu(ctx);

        Label status = new Label(I18n.a("script.statusReady"));
        status.setStyle(util.a.f);

        this.scanBtn.setOnAction(ev -> {
            this.scanBtn.setDisable(true);
            status.setText(I18n.a("download.statusScanning"));
            this.data.clear();
            Task<List<DownloadHistoryEntry>> task = new Task<>() {
                @Override
                protected List<DownloadHistoryEntry> call() {
                    return DownloadHistoryScanner.scanAll();
                }
            };
            task.setOnSucceeded(e -> {
                List<DownloadHistoryEntry> result = task.getValue();
                this.data.addAll(result);
                status.setText(String.format(I18n.a("download.statusFound"), result.size()));
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
            this.scanBtn.setText(I18n.a("download.btn"));
            colBrowser.setText(I18n.a("download.col.browser"));
            colFile.setText(I18n.a("download.col.filename"));
            colUrl.setText(I18n.a("download.col.url"));
            colSize.setText(I18n.a("download.col.size"));
            colDate.setText(I18n.a("download.col.date"));
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

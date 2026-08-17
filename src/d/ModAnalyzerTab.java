package d;

import b.ModReport;
import java.io.File;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Orientation;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.Label;
import javafx.scene.control.MenuItem;
import javafx.scene.control.SplitPane;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.DirectoryChooser;
import scanner.ModAnalyzer;
import util.I18n;

public class ModAnalyzerTab extends VBox {
    private final TableView<ModReport> table = new TableView<>();
    private final ObservableList<ModReport> items = FXCollections.observableArrayList();
    private final FilteredList<ModReport> filtered = new FilteredList<>(this.items, r -> true);
    private final TextField pathField = new TextField();
    private final TextField searchField = new TextField();
    private final Label status = new Label();
    private final Button analyzeBtn = new Button();
    private final TextArea details = new TextArea();
    private final ModAnalyzer analyzer = new ModAnalyzer();

    public ModAnalyzerTab() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));

        Label pathLabel = new Label(t("ma.pathLabel", "Mods Folder Path"));
        pathLabel.setStyle("-fx-font-weight: bold;");
        this.pathField.setPromptText(t("ma.pathPrompt", "Path to the mods folder"));
        HBox.setHgrow(this.pathField, Priority.ALWAYS);
        String defaultPath = System.getenv("APPDATA") != null
                ? System.getenv("APPDATA") + "\\.minecraft\\mods" : "";
        if (!defaultPath.isEmpty() && new File(defaultPath).isDirectory()) {
            this.pathField.setText(defaultPath);
        }
        Button browse = new Button(t("ma.browse", "Browse"));
        browse.getStyleClass().addAll("button-outlined");
        browse.setOnAction(e -> this.browse());

        this.analyzeBtn.setText(t("ma.analyze", "Analyze"));
        this.analyzeBtn.getStyleClass().addAll("accent");
        this.analyzeBtn.setOnAction(e -> this.run());

        Label searchLabel = new Label("\ud83d\udd0d");
        this.searchField.setPromptText(t("ma.search", "Search..."));
        HBox.setHgrow(this.searchField, Priority.ALWAYS);

        HBox top = new HBox(8.0, pathLabel, this.pathField, browse, this.analyzeBtn);
        top.setAlignment(Pos.CENTER_LEFT);
        HBox search = new HBox(8.0, searchLabel, this.searchField);
        search.setAlignment(Pos.CENTER_LEFT);

        this.table.getStyleClass().addAll("striped", "bordered", "dense");
        this.table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        this.table.setFixedCellSize(24.0);

        TableColumn<ModReport, String> colName = new TableColumn<>(t("ma.col.fileName", "File Name"));
        colName.setCellValueFactory(new PropertyValueFactory<>("fileName"));
        colName.setPrefWidth(240.0);

        TableColumn<ModReport, String> colCategory = new TableColumn<>(t("ma.col.category", "Category"));
        colCategory.setCellValueFactory(new PropertyValueFactory<>("category"));
        colCategory.setPrefWidth(120.0);
        colCategory.setCellFactory(col -> new TableCell<ModReport, String>() {
            @Override
            protected void updateItem(String value, boolean empty) {
                super.updateItem(value, empty);
                if (value == null || empty) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(value);
                    setStyle(categoryStyle(value));
                }
            }
        });

        TableColumn<ModReport, String> colSource = new TableColumn<>(t("ma.col.source", "Source"));
        colSource.setCellValueFactory(new PropertyValueFactory<>("source"));
        colSource.setPrefWidth(130.0);

        TableColumn<ModReport, String> colDetails = new TableColumn<>(t("ma.col.details", "Details"));
        colDetails.setCellValueFactory(new PropertyValueFactory<>("details"));

        this.table.getColumns().addAll(colName, colCategory, colSource, colDetails);

        SortedList<ModReport> sorted = new SortedList<>(this.filtered);
        sorted.comparatorProperty().bind(this.table.comparatorProperty());
        this.table.setItems(sorted);
        VBox.setVgrow(this.table, Priority.ALWAYS);

        this.table.setRowFactory(tv -> {
            TableRow<ModReport> row = new TableRow<ModReport>() {
                @Override
                protected void updateItem(ModReport item, boolean empty) {
                    super.updateItem(item, empty);
                    if (item == null || empty) {
                        setStyle("");
                    } else {
                        String c = item.getCategory();
                        if (ModReport.CAT_SUSPICIOUS.equals(c) || ModReport.CAT_BYPASS.equals(c)) {
                            setStyle("-fx-background-color: rgba(255,68,68,0.10);");
                        } else if (ModReport.CAT_OBFUSCATED.equals(c)) {
                            setStyle("-fx-background-color: rgba(227,179,65,0.08);");
                        } else {
                            setStyle("");
                        }
                    }
                }
            };
            ContextMenu menu = new ContextMenu();
            MenuItem copyName = new MenuItem(t("ma.ctx.copyName", "Copy Name"));
            copyName.setOnAction(e -> {
                ModReport r = row.getItem();
                if (r != null) {
                    ClipboardContent c = new ClipboardContent();
                    c.putString(r.getFileName());
                    Clipboard.getSystemClipboard().setContent(c);
                }
            });
            MenuItem copyPath = new MenuItem(t("ma.ctx.copyPath", "Copy Path"));
            copyPath.setOnAction(e -> {
                ModReport r = row.getItem();
                if (r != null) {
                    ClipboardContent c = new ClipboardContent();
                    c.putString(r.getPath());
                    Clipboard.getSystemClipboard().setContent(c);
                }
            });
            MenuItem copyDetails = new MenuItem(t("ma.ctx.copyDetails", "Copy Details"));
            copyDetails.setOnAction(e -> {
                ModReport r = row.getItem();
                if (r != null) {
                    ClipboardContent c = new ClipboardContent();
                    c.putString(r.getDetails());
                    Clipboard.getSystemClipboard().setContent(c);
                }
            });
            menu.getItems().addAll(copyName, copyPath, copyDetails);
            row.emptyProperty().addListener((o, wasEmpty, isEmpty) ->
                    row.setContextMenu(isEmpty ? null : menu));
            return row;
        });

        Label detailTitle = new Label(t("ma.details", "Details"));
        detailTitle.setStyle("-fx-font-weight: bold;");
        this.details.setEditable(false);
        this.details.setWrapText(true);
        this.details.setStyle("-fx-font-family: 'Consolas', 'Courier New', monospace; -fx-font-size: 12px;");
        VBox.setVgrow(this.details, Priority.ALWAYS);
        VBox detailPane = new VBox(6.0, detailTitle, this.details);
        VBox.setVgrow(detailPane, Priority.ALWAYS);

        SplitPane split = new SplitPane(this.table, detailPane);
        split.setOrientation(Orientation.VERTICAL);
        split.setDividerPositions(0.65);
        VBox.setVgrow(split, Priority.ALWAYS);

        this.table.getSelectionModel().selectedItemProperty().addListener((o, oldVal, sel) -> {
            if (sel != null) {
                this.details.setText(sel.getDetails());
            } else {
                this.details.clear();
            }
        });

        this.searchField.textProperty().addListener((o, oldVal, newVal) -> this.filtered.setPredicate(r -> {
            if (newVal == null || newVal.trim().isEmpty()) {
                return true;
            }
            String q = newVal.trim().toLowerCase();
            return r.getFileName().toLowerCase().contains(q)
                    || r.getCategory().toLowerCase().contains(q)
                    || r.getDetails().toLowerCase().contains(q);
        }));

        this.status.setStyle("-fx-text-fill: #999999;");
        this.status.setText(t("ma.statusReady", "Ready"));

        this.getChildren().addAll(top, search, split, this.status);
    }

    private void browse() {
        DirectoryChooser chooser = new DirectoryChooser();
        chooser.setTitle(t("ma.chooserTitle", "Select Mods Folder"));
        String current = this.pathField.getText();
        if (current != null && !current.trim().isEmpty() && new File(current).isDirectory()) {
            chooser.setInitialDirectory(new File(current));
        }
        File dir = chooser.showDialog(this.getScene().getWindow());
        if (dir != null) {
            this.pathField.setText(dir.getAbsolutePath());
        }
    }

    private void run() {
        String p = this.pathField.getText() == null ? "" : this.pathField.getText().trim();
        File dir = new File(p);
        if (p.isEmpty() || !dir.isDirectory()) {
            this.status.setText(t("ma.invalidPath", "Invalid path"));
            return;
        }
        this.analyzeBtn.setDisable(true);
        this.items.clear();
        this.details.clear();
        this.status.setText(t("ma.statusScanning", "Scanning..."));

        Task<Void> task = new Task<Void>() {
            @Override
            protected Void call() {
                analyzer.analyze(dir, report -> Platform.runLater(() -> {
                    items.add(report);
                    status.setText(t("ma.statusScanning", "Scanning...") + " (" + items.size() + ")");
                }));
                return null;
            }
        };
        task.setOnSucceeded(e -> {
            this.analyzeBtn.setDisable(false);
            if (this.items.isEmpty()) {
                this.status.setText(t("ma.noMods", "No JAR files found"));
            } else {
                this.status.setText(String.format(t("ma.statusDone", "Scan complete: %d mod(s)"), this.items.size()));
            }
        });
        task.setOnFailed(e -> {
            this.analyzeBtn.setDisable(false);
            this.status.setText(t("ma.statusError", "Scan failed"));
        });
        new Thread(task).start();
    }

    private static String t(String key, String fallback) {
        String v = I18n.a(key);
        return (v == null || v.equals(key)) ? fallback : v;
    }

    private static String categoryStyle(String category) {
        switch (category) {
            case ModReport.CAT_VERIFIED:
                return "-fx-text-fill: #3ddc84; -fx-font-weight: bold;";
            case ModReport.CAT_SUSPICIOUS:
            case ModReport.CAT_BYPASS:
                return "-fx-text-fill: #ff4444; -fx-font-weight: bold;";
            case ModReport.CAT_OBFUSCATED:
                return "-fx-text-fill: #e3b341; -fx-font-weight: bold;";
            default:
                return "-fx-text-fill: #999999;";
        }
    }
}

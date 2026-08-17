/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.l;
import java.io.File;
import java.io.InputStream;
import java.util.Collection;
import java.util.List;
import java.util.function.Consumer;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.geometry.Orientation;
import javafx.geometry.Pos;
import javafx.geometry.Rectangle2D;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.Label;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Separator;
import javafx.scene.control.SplitPane;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.stage.Screen;
import javafx.stage.Stage;
import scanner.i;
import util.I18n;
import util.a;

public class m
extends VBox {
    private final ObservableList<l> a = FXCollections.observableArrayList();
    private final FilteredList<l> b;
    private final ObservableList<b.m> c = FXCollections.observableArrayList();
    private final FilteredList<b.m> d;
    private Button e;
    private Consumer<File> f;
    private TableColumn<b.m, String> g;
    private TableColumn<b.m, String> h;
    private TableColumn<b.m, String> i;
    private TableColumn<b.m, String> j;
    private TableColumn<b.m, String> k;
    private TableColumn<b.m, String> l;
    private TableColumn<b.m, String> m;
    private TableColumn<b.m, String> n;
    private TableColumn<l, String> o;
    private Button p;

    public m() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.e = new Button(I18n.a("prefetch.btn"));
        this.e.getStyleClass().addAll((String[])new String[]{"accent"});
        Button button = new Button(I18n.a("btn.openFolder"));
        button.getStyleClass().addAll((String[])new String[]{"success"});
        button.setOnAction(actionEvent -> {
            File file = new File(System.getenv("SystemRoot") + "\\Prefetch");
            if (file.exists() && file.isDirectory()) {
                try {
                    Runtime.getRuntime().exec("explorer.exe \"" + file.getAbsolutePath() + "\"");
                }
                catch (Exception exception) {
                    exception.printStackTrace();
                }
            } else {
                Alert alert = new Alert(Alert.AlertType.WARNING);
                alert.setTitle(I18n.a("class.alert.warning"));
                alert.setHeaderText(null);
                alert.setContentText(String.format(I18n.a("alert.folderNotFound"), file.getAbsolutePath()));
                alert.showAndWait();
            }
        });
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("prefetch.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        this.p = new Button(I18n.a("prefetch.btn.globalSearch"));
        this.p.setOnAction(actionEvent -> this.c());
        HBox hBox = new HBox(10.0, this.e, button, this.p, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        TableView<l> tableView2 = new TableView<l>();
        tableView2.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView2, Priority.ALWAYS);
        TableColumn tableColumn2 = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("fileName"));
        tableColumn2.setCellFactory(tableColumn -> new TableCell<l, String>(){
            private final ImageView a = new ImageView();
            {
                this.a.setFitWidth(16.0);
                this.a.setFitHeight(16.0);
                this.a.setPreserveRatio(true);
            }

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setGraphic(null);
                } else {
                    l l2;
                    this.setText(string);
                    l l3 = l2 = this.getTableRow() != null ? (l)this.getTableRow().getItem() : null;
                    if (l2 != null && l2.getProgramIcon() != null) {
                        this.a.setImage(l2.getProgramIcon());
                        this.setGraphic(this.a);
                    } else {
                        this.setGraphic(null);
                    }
                }
            }

        });
        TableColumn tableColumn3 = new TableColumn(I18n.a("prefetch.col.runCount"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("runCount"));
        tableColumn3.setPrefWidth(100.0);
        TableColumn tableColumn4 = new TableColumn(I18n.a("eventlog.col.time"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("lastUsedTime"));
        TableColumn tableColumn5 = new TableColumn(I18n.a("mod.col.size"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("size"));
        tableColumn5.setPrefWidth(80.0);
        TableColumn tableColumn6 = new TableColumn(I18n.a("mod.col.hidden"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("isHidden"));
        tableColumn6.setPrefWidth(80.0);
        tableColumn6.setCellFactory(tableColumn -> new TableCell<l, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _kt(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xD5;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 1307518809 + 210538935 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn7 = new TableColumn(I18n.a("prefetch.col.refCount"));
        tableColumn7.setCellValueFactory(new PropertyValueFactory("refFileCount"));
        tableColumn7.setPrefWidth(110.0);
        TableColumn tableColumn8 = new TableColumn(I18n.a("prefetch.col.modifiedTime"));
        tableColumn8.setCellValueFactory(new PropertyValueFactory("modifiedTime"));
        tableColumn8.setPrefWidth(140.0);
        this.o = new TableColumn(I18n.a("prefetch.col.signature"));
        this.o.setCellValueFactory(new PropertyValueFactory("signature"));
        this.o.setPrefWidth(120.0);
        this.o.setCellFactory(tableColumn -> new TableCell<l, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    l l2;
                    this.setText(string);
                    l l3 = l2 = this.getTableRow() != null ? (l)this.getTableRow().getItem() : null;
                    if (l2 != null && !l2.getSignatureStyle().isEmpty()) {
                        this.setStyle(l2.getSignatureStyle());
                    } else {
                        this.setStyle("");
                    }
                }
            }

        });
        TableColumn tableColumn9 = new TableColumn(I18n.a("prefetch.column.readonly"));
        tableColumn9.setCellValueFactory(new PropertyValueFactory("integrityStatus"));
        tableColumn9.setPrefWidth(120.0);
        tableColumn9.setCellFactory(tableColumn -> new TableCell<l, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    l l2;
                    this.setText(string);
                    l l3 = l2 = this.getTableRow() != null ? (l)this.getTableRow().getItem() : null;
                    if (l2 != null && l2.isIsReadOnly()) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

        });
        TableColumn tableColumn10 = new TableColumn(I18n.a("mod.col.filePath"));
        tableColumn10.setCellValueFactory(new PropertyValueFactory("path"));
        tableView2.getColumns().addAll(tableColumn2, tableColumn4, tableColumn8, tableColumn5, tableColumn6, tableColumn9, this.o, tableColumn7, tableColumn10);
        tableView2.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        tableView2.setFixedCellSize(24.0);
        tableView2.setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            ContextMenu contextMenu = new ContextMenu();
            MenuItem menuItem = new MenuItem(I18n.a("ctx.openFolder"));
            menuItem.setOnAction(actionEvent -> {
                l l2 = (l)tableRow.getItem();
                if (l2 != null) {
                    try {
                        File file = new File(l2.getPath());
                        if (file.exists()) {
                            Runtime.getRuntime().exec("explorer.exe /select," + file.getAbsolutePath());
                        }
                    }
                    catch (Exception exception) {
                        exception.printStackTrace();
                    }
                }
            });
            MenuItem menuItem2 = new MenuItem(I18n.a("ctx.copyName"));
            menuItem2.setOnAction(actionEvent -> {
                l l2 = (l)tableRow.getItem();
                if (l2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(l2.getFileName());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem3 = new MenuItem(I18n.a("ctx.copyPath"));
            menuItem3.setOnAction(actionEvent -> {
                l l2 = (l)tableRow.getItem();
                if (l2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(l2.getPath());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3});
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        this.b = new FilteredList<l>(this.a, l2 -> true);
        SortedList<l> sortedList = new SortedList<l>((ObservableList<l>)this.b);
        sortedList.comparatorProperty().bind(tableView2.comparatorProperty());
        tableView2.setItems(sortedList);
        Runnable runnable = () -> {
            String string = textField.getText();
            this.b.setPredicate(l2 -> {
                String[] stringArray;
                if (string == null || string.trim().isEmpty()) {
                    return true;
                }
                for (String string2 : stringArray = string.toLowerCase().split("\\|")) {
                    String string3 = string2.trim();
                    if (string3.isEmpty() || (l2.getFileName() == null || !l2.getFileName().toLowerCase().contains(string3)) && (l2.getPath() == null || !l2.getPath().toLowerCase().contains(string3))) continue;
                    return true;
                }
                return false;
            });
        };
        textField.textProperty().addListener((observableValue, string, string2) -> runnable.run());
        Label label2 = new Label(I18n.a("prefetch.detail.title"));
        label2.setStyle("-fx-font-weight: bold; -fx-font-size: 13px;");
        TextField textField2 = new TextField();
        textField2.setPromptText(I18n.a("class.searchPrompt"));
        HBox.setHgrow(textField2, Priority.ALWAYS);
        HBox hBox2 = new HBox(10.0, label2, new Label("\ud83d\udd0d"), textField2);
        hBox2.setAlignment(Pos.CENTER_LEFT);
        TableView tableView3 = new TableView();
        tableView3.setPrefHeight(180.0);
        tableView3.setMinHeight(120.0);
        tableView3.getStyleClass().addAll((String[])new String[]{"striped", "dense"});
        VBox.setVgrow(tableView3, Priority.ALWAYS);
        this.i = new TableColumn(I18n.a("mod.col.hidden"));
        this.i.setCellValueFactory(new PropertyValueFactory("hidden"));
        this.i.setPrefWidth(80.0);
        this.i.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _hqww(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xBE;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 419262653 + 596659597 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        this.j = new TableColumn(I18n.a("prefetch.col.jarObf"));
        this.j.setCellValueFactory(new PropertyValueFactory("jarObfuscation"));
        this.j.setMinWidth(170.0);
        this.j.setVisible(false);
        this.j.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("obf.high"))) {
                        this.setStyle(util.a.a);
                    } else if (string.equals(I18n.a("obf.unknown"))) {
                        this.setStyle(util.a.f);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _ssth(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xA3;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 1484198951 + 2074557471 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        this.k = new TableColumn(I18n.a("prefetch.col.extChanged"));
        this.k.setCellValueFactory(new PropertyValueFactory("extensionChanged"));
        this.k.setMinWidth(160.0);
        this.k.setVisible(false);
        this.k.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _ily(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x47;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 1116439345 + 1359473621 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        this.h = new TableColumn(I18n.a("mod.col.filePath"));
        this.l = new TableColumn(I18n.a("mod.col.size"));
        this.l.setCellValueFactory(new PropertyValueFactory("size"));
        this.l.setPrefWidth(80.0);
        this.m = new TableColumn(I18n.a("prefetch.col.deleted"));
        this.m.setCellValueFactory(new PropertyValueFactory("deleted"));
        this.m.setPrefWidth(100.0);
        this.m.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _hyao(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x7C;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 415049213 + 1185663831 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        this.h.setCellValueFactory(new PropertyValueFactory("path"));
        this.g = new TableColumn(I18n.a("mod.col.fileName"));
        this.g.setCellValueFactory(new PropertyValueFactory("name"));
        this.g.setMinWidth(120.0);
        this.g.setCellFactory(tableColumn -> new TableCell<b.m, String>(){
            private final ImageView a = new ImageView();
            {
                this.a.setFitWidth(16.0);
                this.a.setFitHeight(16.0);
                this.a.setPreserveRatio(true);
            }

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setGraphic(null);
                } else {
                    b.m m2;
                    this.setText(string);
                    b.m m3 = m2 = this.getTableRow() != null ? (b.m)this.getTableRow().getItem() : null;
                    if (m2 != null && m2.getFileIcon() != null) {
                        this.a.setImage(m2.getFileIcon());
                        this.setGraphic(this.a);
                    } else {
                        this.setGraphic(null);
                    }
                }
            }

        });
        this.n = new TableColumn(I18n.a("prefetch.col.signature"));
        this.n.setCellValueFactory(new PropertyValueFactory("signature"));
        this.n.setPrefWidth(120.0);
        this.n.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    b.m m2;
                    this.setText(string);
                    b.m m3 = m2 = this.getTableRow() != null ? (b.m)this.getTableRow().getItem() : null;
                    if (m2 != null && !m2.getSignatureStyle().isEmpty()) {
                        this.setStyle(m2.getSignatureStyle());
                    } else {
                        this.setStyle("");
                    }
                }
            }

        });
        tableView3.getColumns().addAll(this.g, this.h, this.l, this.i, this.n, this.m, this.k, this.j);
        tableView3.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        tableView3.setFixedCellSize(24.0);
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.openFolder"));
        menuItem.setOnAction(actionEvent -> {
            b.m m2 = (b.m)tableView3.getSelectionModel().getSelectedItem();
            if (m2 != null) {
                try {
                    File file = new File(m2.getPath());
                    if (file.exists()) {
                        Runtime.getRuntime().exec("explorer.exe /select," + file.getAbsolutePath());
                    }
                }
                catch (Exception exception) {
                    exception.printStackTrace();
                }
            }
        });
        MenuItem menuItem2 = new MenuItem(I18n.a("ctx.copyName"));
        menuItem2.setOnAction(actionEvent -> {
            b.m m2 = (b.m)tableView3.getSelectionModel().getSelectedItem();
            if (m2 != null) {
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(m2.getName());
                Clipboard.getSystemClipboard().setContent(clipboardContent);
            }
        });
        MenuItem menuItem3 = new MenuItem(I18n.a("ctx.copyPath"));
        menuItem3.setOnAction(actionEvent -> {
            b.m m2 = (b.m)tableView3.getSelectionModel().getSelectedItem();
            if (m2 != null) {
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(m2.getPath());
                Clipboard.getSystemClipboard().setContent(clipboardContent);
            }
        });
        MenuItem menuItem4 = new MenuItem(I18n.a("ctx.analyzeJar"));
        menuItem4.setOnAction(actionEvent -> {
            File file;
            b.m m2 = (b.m)tableView3.getSelectionModel().getSelectedItem();
            if (m2 != null && this.f != null && (file = new File(m2.getPath())).exists()) {
                this.f.accept(file);
            }
        });
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3, menuItem4});
        tableView3.setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        this.d = new FilteredList<b.m>(this.c, m2 -> true);
        SortedList<b.m> sortedList2 = new SortedList<b.m>((ObservableList<b.m>)this.d);
        sortedList2.comparatorProperty().bind(tableView3.comparatorProperty());
        tableView3.setItems(sortedList2);
        textField2.textProperty().addListener((observableValue, string, string2) -> this.d.setPredicate(m2 -> {
            String[] stringArray;
            if (string2 == null || string2.trim().isEmpty()) {
                return true;
            }
            for (String s : stringArray = string2.toLowerCase().split("\\|")) {
                if (s.trim().isEmpty() || m2.getPath() == null || !m2.getPath().toLowerCase().contains(s.trim())) continue;
                return true;
            }
            return false;
        }));
        VBox vBox = new VBox(5.0, hBox2, tableView3);
        VBox.setVgrow(tableView3, Priority.ALWAYS);
        Label label3 = new Label();
        Label label4 = new Label();
        Label label5 = new Label();
        Label label6 = new Label();
        Label label7 = new Label();
        Label label8 = new Label();
        Label label9 = new Label();
        Label label10 = new Label();
        String string3 = "-fx-font-size: 12px;";
        String string4 = "-fx-font-size: 12px; -fx-font-weight: bold; -fx-padding: 6 0 2 0;";
        for (Label region2 : new Label[]{label3, label4, label5, label6, label7, label8, label9, label10}) {
            region2.setStyle(string3);
        }
        Label label11 = new Label(I18n.a("prefetch.detail.pfHeader"));
        label11.setStyle(string4);
        Label label12 = new Label(I18n.a("prefetch.detail.exeHeader"));
        label12.setStyle(string4);
        Separator separator = new Separator();
        VBox vBox2 = new VBox(4.0, label11, label3, label4, label5, label6, label7, separator, label12, label8, label9, label10);
        vBox2.setPadding(new Insets(8.0));
        VBox vBox3 = new VBox(4.0);
        vBox3.setPadding(new Insets(8.0));
        ScrollPane scrollPane = new ScrollPane(vBox3);
        scrollPane.setFitToWidth(true);
        Tab tab = new Tab(I18n.a("prefetch.detail.title"), vBox);
        tab.setClosable(false);
        Tab tab2 = new Tab(I18n.a("prefetch.detail.tabDetails"), new ScrollPane(vBox2){
            {
                this.setFitToWidth(true);
            }
        });
        tab2.setClosable(false);
        Tab tab3 = new Tab(I18n.a("prefetch.detail.tabExecHistory"), scrollPane);
        tab3.setClosable(false);
        TabPane tabPane = new TabPane(tab, tab2, tab3);
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        VBox.setVgrow(tabPane, Priority.ALWAYS);
        VBox vBox4 = new VBox(tabPane);
        VBox.setVgrow(tabPane, Priority.ALWAYS);
        SplitPane splitPane = new SplitPane();
        splitPane.setOrientation(Orientation.VERTICAL);
        splitPane.getItems().add(tableView2);
        VBox.setVgrow(splitPane, Priority.ALWAYS);
        boolean[] blArray = new boolean[]{false};
        tableView2.getSelectionModel().selectedItemProperty().addListener((observableValue, l2, l3) -> {
            this.c.clear();
            textField2.clear();
            if (l3 != null && l3.getReferencedFiles() != null) {
                if (!blArray[0]) {
                    blArray[0] = true;
                    splitPane.getItems().add(vBox3);
                    splitPane.setDividerPositions(0.65);
                }
                this.c.addAll((Collection<b.m>)l3.getReferencedFiles());
                label2.setText(String.format(I18n.a("prefetch.detail.titleCount"), l3.getFileName(), l3.getReferencedFiles().size()));
                boolean bl = l3.isJavaRelated();
                this.j.setVisible(bl);
                this.k.setVisible(bl);
                label3.setText(I18n.a("prefetch.detail.pfFile") + " " + (l3.getPfFileName() != null ? l3.getPfFileName() : "-"));
                label4.setText(I18n.a("prefetch.detail.exePath") + " " + l3.getPath());
                label5.setText(I18n.a("prefetch.detail.pfSize") + " " + (l3.getPfSize() != null ? l3.getPfSize() : "-"));
                label6.setText(I18n.a("prefetch.detail.pfCreated") + " " + (l3.getPfCreated() != null ? l3.getPfCreated() : "-"));
                label7.setText(I18n.a("prefetch.detail.pfModified") + " " + (l3.getPfModified() != null ? l3.getPfModified() : "-"));
                label8.setText(I18n.a("prefetch.detail.exeSize") + " " + (l3.getExeSize() != null ? l3.getExeSize() : "-"));
                label9.setText(I18n.a("prefetch.detail.exeCreated") + " " + (l3.getExeCreated() != null ? l3.getExeCreated() : "-"));
                label10.setText(I18n.a("prefetch.detail.exeModified") + " " + (l3.getExeModified() != null ? l3.getExeModified() : "-"));
                vBox2.getChildren().clear();
                if (l3.getRunTimes() != null && !l3.getRunTimes().isEmpty()) {
                    for (int i2 = 0; i2 < l3.getRunTimes().size(); ++i2) {
                        Label runLabel = new Label(I18n.a("prefetch.detail.run") + " " + (i2 + 1) + ":  " + l3.getRunTimes().get(i2));
                        runLabel.setStyle(string3);
                        vBox2.getChildren().add(runLabel);
                    }
                } else {
                    Label emptyLabel = new Label("-");
                    emptyLabel.setStyle(string3);
                    vBox2.getChildren().add(emptyLabel);
                }
            } else {
                label2.setText(I18n.a("prefetch.detail.title"));
                this.j.setVisible(false);
                this.k.setVisible(false);
            }
        });
        Label label13 = new Label(I18n.a("script.statusReady"));
        label13.setStyle(util.a.f);
        this.e.setOnAction(actionEvent -> {
            this.e.setDisable(true);
            label13.setText(I18n.a("prefetch.statusScanning"));
            this.a.clear();
            this.c.clear();
            Task<List<l>> task = new Task<List<l>>(){

                protected List<l> call() {
                    return scanner.i.a();
                }

            };
            task.setOnSucceeded(workerStateEvent -> {
                List list = (List)task.getValue();
                this.a.addAll(list);
                String string = String.format(I18n.a("prefetch.statusFound"), list.size());
                label13.setText(string);
                label13.setStyle(util.a.f);
                this.e.setDisable(false);
            });
            task.setOnFailed(workerStateEvent -> {
                label13.setText(I18n.a("detect.statusError"));
                this.e.setDisable(false);
            });
            new Thread(task).start();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, splitPane, label13});
        I18n.a(() -> {
            this.e.setText(I18n.a("prefetch.btn"));
            button.setText(I18n.a("btn.openFolder"));
            tableColumn2.setText(I18n.a("mod.col.fileName"));
            tableColumn10.setText(I18n.a("mod.col.filePath"));
            tableColumn5.setText(I18n.a("mod.col.size"));
            tableColumn4.setText(I18n.a("eventlog.col.time"));
            tableColumn8.setText(I18n.a("prefetch.col.modifiedTime"));
            tableColumn3.setText(I18n.a("prefetch.col.runCount"));
            tableColumn7.setText(I18n.a("prefetch.col.refCount"));
            tableColumn6.setText(I18n.a("mod.col.hidden"));
            this.i.setText(I18n.a("mod.col.hidden"));
            this.j.setText(I18n.a("prefetch.col.jarObf"));
            this.k.setText(I18n.a("prefetch.col.extChanged"));
            this.g.setText(I18n.a("mod.col.fileName"));
            this.h.setText(I18n.a("mod.col.filePath"));
            this.l.setText(I18n.a("mod.col.size"));
            this.m.setText(I18n.a("prefetch.col.deleted"));
            this.n.setText(I18n.a("prefetch.col.signature"));
            this.o.setText(I18n.a("prefetch.col.signature"));
            tableColumn9.setText(I18n.a("prefetch.column.readonly"));
            this.p.setText(I18n.a("prefetch.btn.globalSearch"));
            menuItem3.setText(I18n.a("ctx.copyPath"));
            menuItem.setText(I18n.a("ctx.openFolder"));
            menuItem2.setText(I18n.a("ctx.copyName"));
            if (!contextMenu.getItems().isEmpty() && contextMenu.getItems().size() > 3) {
                ((MenuItem)contextMenu.getItems().get(3)).setText(I18n.a("ctx.analyzeJar"));
            }
            label2.setText(I18n.a("prefetch.detail.title"));
            tab.setText(I18n.a("prefetch.detail.title"));
            tab2.setText(I18n.a("prefetch.detail.tabDetails"));
            tab3.setText(I18n.a("prefetch.detail.tabExecHistory"));
            label11.setText(I18n.a("prefetch.detail.pfHeader"));
            label12.setText(I18n.a("prefetch.detail.exeHeader"));
            textField.setPromptText(I18n.a("prefetch.searchPrompt"));
            textField2.setPromptText(I18n.a("class.searchPrompt"));
            label13.setText(I18n.a("script.statusReady"));
            tableView2.refresh();
        });
    }

    private void c() {
        Object object2;
        if (this.a.isEmpty()) {
            Alert alert = new Alert(Alert.AlertType.WARNING);
            alert.setTitle(I18n.a("class.alert.warning"));
            alert.setHeaderText(null);
            alert.setContentText(I18n.a("prefetch.alert.needAnalysis"));
            alert.showAndWait();
            return;
        }
        Stage stage = new Stage();
        stage.setTitle(I18n.a("prefetch.btn.globalSearch"));
        try {
            object2 = this.getClass().getResourceAsStream("/assets/icon.png");
            if (object2 != null) {
                stage.getIcons().add(new Image((InputStream)object2));
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        object2 = new TableView();
        ((Node)object2).getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        ((Region)object2).setPrefSize(1100.0, 500.0);
        TableColumn tableColumn2 = new TableColumn(I18n.a("prefetch.col.parentPf"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("parentPfName"));
        tableColumn2.setPrefWidth(150.0);
        tableColumn2.setCellFactory(tableColumn -> new TableCell<b.m, String>(){
            private final ImageView a = new ImageView();
            {
                this.a.setFitWidth(16.0);
                this.a.setFitHeight(16.0);
                this.a.setPreserveRatio(true);
            }

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setGraphic(null);
                } else {
                    b.m m2;
                    this.setText(string);
                    b.m m3 = m2 = this.getTableRow() != null ? (b.m)this.getTableRow().getItem() : null;
                    if (m2 != null && m2.getParentIcon() != null) {
                        this.a.setImage(m2.getParentIcon());
                        this.setGraphic(this.a);
                    } else {
                        this.setGraphic(null);
                    }
                }
            }

        });
        TableColumn tableColumn3 = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("name"));
        tableColumn3.setPrefWidth(200.0);
        tableColumn3.setCellFactory(tableColumn -> new TableCell<b.m, String>(){
            private final ImageView a = new ImageView();
            {
                this.a.setFitWidth(16.0);
                this.a.setFitHeight(16.0);
                this.a.setPreserveRatio(true);
            }

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setGraphic(null);
                } else {
                    b.m m2;
                    this.setText(string);
                    b.m m3 = m2 = this.getTableRow() != null ? (b.m)this.getTableRow().getItem() : null;
                    if (m2 != null && m2.getFileIcon() != null) {
                        this.a.setImage(m2.getFileIcon());
                        this.setGraphic(this.a);
                    } else {
                        this.setGraphic(null);
                    }
                }
            }

        });
        TableColumn tableColumn4 = new TableColumn(I18n.a("mod.col.filePath"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("path"));
        tableColumn4.setPrefWidth(350.0);
        TableColumn tableColumn5 = new TableColumn(I18n.a("mod.col.size"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("size"));
        tableColumn5.setPrefWidth(80.0);
        TableColumn tableColumn6 = new TableColumn(I18n.a("mod.col.hidden"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("hidden"));
        tableColumn6.setPrefWidth(80.0);
        tableColumn6.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _svqg(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x9F;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 554539845 + 348987767 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn7 = new TableColumn(I18n.a("prefetch.col.deleted"));
        tableColumn7.setCellValueFactory(new PropertyValueFactory("deleted"));
        tableColumn7.setPrefWidth(80.0);
        tableColumn7.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _rq(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xAC;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 169472747 + 1718433107 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn8 = new TableColumn(I18n.a("prefetch.col.jarObf"));
        tableColumn8.setCellValueFactory(new PropertyValueFactory("jarObfuscation"));
        tableColumn8.setPrefWidth(100.0);
        tableColumn8.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("obf.high"))) {
                        this.setStyle(util.a.a);
                    } else if (string.equals(I18n.a("obf.unknown"))) {
                        this.setStyle(util.a.f);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _uyaq(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x6B;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 302623707 + 1392866625 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn9 = new TableColumn(I18n.a("prefetch.col.extChanged"));
        tableColumn9.setCellValueFactory(new PropertyValueFactory("extensionChanged"));
        tableColumn9.setPrefWidth(120.0);
        tableColumn9.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _sick(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xF9;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 677066733 + 360191927 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn10 = new TableColumn(I18n.a("prefetch.col.signature"));
        tableColumn10.setCellValueFactory(new PropertyValueFactory("signature"));
        tableColumn10.setPrefWidth(120.0);
        tableColumn10.setCellFactory(tableColumn -> new TableCell<b.m, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    b.m m2;
                    this.setText(string);
                    b.m m3 = m2 = this.getTableRow() != null ? (b.m)this.getTableRow().getItem() : null;
                    if (m2 != null && !m2.getSignatureStyle().isEmpty()) {
                        this.setStyle(m2.getSignatureStyle());
                    } else {
                        this.setStyle("");
                    }
                }
            }

        });
        ((TableView)object2).getColumns().addAll(tableColumn2, tableColumn3, tableColumn4, tableColumn5, tableColumn6, tableColumn10, tableColumn7, tableColumn8, tableColumn9);
        ((TableView)object2).setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        ObservableList<b.m> observableList = FXCollections.observableArrayList();
        for (l object3 : this.a) {
            if (object3.getReferencedFiles() == null) continue;
            observableList.addAll((Collection<b.m>)object3.getReferencedFiles());
        }
        FilteredList<b.m> filteredList = new FilteredList<b.m>(observableList, m2 -> true);
        SortedList sortedList = new SortedList(filteredList);
        sortedList.comparatorProperty().bind(((TableView)object2).comparatorProperty());
        ((TableView)object2).setItems(sortedList);
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("class.searchPrompt"));
        textField.textProperty().addListener((observableValue, string, string2) -> filteredList.setPredicate(m2 -> {
            String[] stringArray;
            if (string2 == null || string2.trim().isEmpty()) {
                return true;
            }
            for (String s : stringArray = string2.toLowerCase().split("\\|")) {
                String string3 = s.trim();
                if (string3.isEmpty() || (m2.getPath() == null || !m2.getPath().toLowerCase().contains(string3)) && (m2.getParentPfName() == null || !m2.getParentPfName().toLowerCase().contains(string3))) continue;
                return true;
            }
            return false;
        }));
        HBox hBox = new HBox(10.0, new Label("\ud83d\udd0d"), textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        HBox.setHgrow(textField, Priority.ALWAYS);
        ContextMenu contextMenu = new ContextMenu();
        final TableView table = (TableView)object2;
        MenuItem menuItem = new MenuItem(I18n.a("ctx.openFolder"));
        menuItem.setOnAction(arg_0 -> d(table, arg_0));
        MenuItem menuItem2 = new MenuItem(I18n.a("ctx.copyName"));
        menuItem2.setOnAction(arg_0 -> c(table, arg_0));
        MenuItem menuItem3 = new MenuItem(I18n.a("ctx.copyPath"));
        menuItem3.setOnAction(arg_0 -> b(table, arg_0));
        MenuItem menuItem4 = new MenuItem(I18n.a("ctx.analyzeJar"));
        menuItem4.setOnAction(arg_0 -> this.a(table, arg_0));
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3, menuItem4});
        ((TableView)object2).setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        VBox vBox = new VBox(10.0, new Node[]{hBox, (Node)object2});
        vBox.setPadding(new Insets(10.0));
        VBox.setVgrow((Node)object2, Priority.ALWAYS);
        Scene scene = new Scene(vBox);
        if (this.getScene() != null) {
            scene.getStylesheets().addAll((Collection<String>)this.getScene().getStylesheets());
        }
        stage.setScene(scene);
        Rectangle2D rectangle2D = Screen.getPrimary().getVisualBounds();
        stage.setWidth(rectangle2D.getWidth());
        stage.setHeight(rectangle2D.getHeight());
        stage.setMaximized(true);
        stage.show();
    }

    public void a() {
        this.e.fire();
    }

    public boolean b() {
        return this.e.isDisabled();
    }

    private /* synthetic */ void a(TableView tableView, ActionEvent actionEvent) {
        File file;
        b.m m2 = (b.m)tableView.getSelectionModel().getSelectedItem();
        if (m2 != null && this.f != null && (file = new File(m2.getPath())).exists()) {
            this.f.accept(file);
        }
    }

    private static /* synthetic */ void b(TableView tableView, ActionEvent actionEvent) {
        b.m m2 = (b.m)tableView.getSelectionModel().getSelectedItem();
        if (m2 != null) {
            ClipboardContent clipboardContent = new ClipboardContent();
            clipboardContent.putString(m2.getPath());
            Clipboard.getSystemClipboard().setContent(clipboardContent);
        }
    }

    private static /* synthetic */ void c(TableView tableView, ActionEvent actionEvent) {
        b.m m2 = (b.m)tableView.getSelectionModel().getSelectedItem();
        if (m2 != null) {
            ClipboardContent clipboardContent = new ClipboardContent();
            clipboardContent.putString(m2.getName());
            Clipboard.getSystemClipboard().setContent(clipboardContent);
        }
    }

    private static /* synthetic */ void d(TableView tableView, ActionEvent actionEvent) {
        b.m m2 = (b.m)tableView.getSelectionModel().getSelectedItem();
        if (m2 != null) {
            try {
                File file = new File(m2.getPath());
                if (file.exists()) {
                    Runtime.getRuntime().exec("explorer.exe /select," + file.getAbsolutePath());
                }
            }
            catch (Exception exception) {
                exception.printStackTrace();
            }
        }
    }

    private static /* synthetic */ String _rv(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x56;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 12537121 + 1530784081 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.p;
import c.a;
import d.f;
import d.j;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;
import javafx.animation.PauseTransition;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.CheckBox;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.CustomMenuItem;
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.Toggle;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.SVGPath;
import javafx.stage.DirectoryChooser;
import javafx.stage.Stage;
import javafx.util.Duration;
import util.I18n;

public class ManualAnalyze
extends BorderPane {
    private final Stage a;
    private final a engine;
    private ScrollPane c;
    private HBox d;
    private ToggleGroup e;
    private StackPane f;
    private final Map<ToggleButton, Node> g = new LinkedHashMap<ToggleButton, Node>();
    private final Map<ToggleButton, Supplier<Node>> h = new LinkedHashMap<ToggleButton, Supplier<Node>>();
    private Button i;
    private Button j;
    private SVGPath k;
    private SVGPath l;
    private j m;
    private f n;
    private TableView<b.j> o;
    private TextField p;
    private CheckBox q;
    private CheckBox r;
    private CheckBox s;
    private Button t;
    private TextField u;
    private final ObservableList<b.j> v = FXCollections.observableArrayList();
    private FilteredList<b.j> w;
    private TableColumn<b.j, String> x;
    private TableView<b.b> y;
    private TextField z;
    private CheckBox A;
    private Button B;
    private final ObservableList<b.b> C = FXCollections.observableArrayList();
    private TableColumn<b.b, String> D;
    private Label E;
    private Label F;
    private boolean G = false;
    private boolean H = false;

    public ManualAnalyze(Stage stage, a a2, f f2) {
        this.a = stage;
        this.engine = a2;
        this.n = f2;
        this.a();
    }

    private void a() {
        this.e = new ToggleGroup();
        this.d = new HBox(5.0);
        this.d.setPadding(new Insets(5.0));
        this.d.setAlignment(Pos.CENTER_LEFT);
        this.c = new ScrollPane(this.d);
        this.c.setFitToHeight(true);
        this.c.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        this.c.setVbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        this.c.setPannable(true);
        this.c.setStyle("-fx-background-color: transparent; -fx-background: transparent; -fx-border-color: transparent;");
        HBox.setHgrow(this.c, Priority.ALWAYS);
        this.k = this.a(true);
        this.i = new Button();
        this.i.setGraphic(this.k);
        this.i.getStyleClass().addAll((String[])new String[]{"button-icon", "flat"});
        this.i.setOnAction(actionEvent -> this.a(-0.2));
        this.l = this.a(false);
        this.j = new Button();
        this.j.setGraphic(this.l);
        this.j.getStyleClass().addAll((String[])new String[]{"button-icon", "flat"});
        this.j.setOnAction(actionEvent -> this.a(0.2));
        this.c.hvalueProperty().addListener((observableValue, number, number2) -> this.b());
        this.c.viewportBoundsProperty().addListener((observableValue, bounds, bounds2) -> this.b());
        this.d.widthProperty().addListener((observableValue, number, number2) -> this.b());
        HBox hBox = new HBox(this.i, this.c, this.j);
        hBox.setAlignment(Pos.CENTER_LEFT);
        hBox.getStyleClass().add("bordered");
        hBox.setStyle("-fx-border-width: 0 0 1 0;");
        this.f = new StackPane();
        VBox.setVgrow(this.f, Priority.ALWAYS);
        this.a("tab.mod", this.c());
        this.a("tab.class", this.d());
        this.a("tab.jarAnalyzer", () -> {
            this.m = new j();
            return this.m;
        });
        this.a("tab.modAnalyzer", () -> new ModAnalyzerTab());
        if (!this.e.getToggles().isEmpty()) {
            ((Toggle)this.e.getToggles().get(0)).setSelected(true);
        }
        this.setTop(hBox);
        this.setCenter(this.f);
        I18n.a(() -> {
            for (Map.Entry<ToggleButton, Node> entry : this.g.entrySet()) {
                ToggleButton toggleButton = entry.getKey();
                String string = (String)toggleButton.getUserData();
                toggleButton.setText(I18n.a(string));
            }
        });
    }

    private void a(String string, Node node) {
        ToggleButton toggleButton = new ToggleButton(I18n.a(string));
        toggleButton.setToggleGroup(this.e);
        toggleButton.setUserData(string);
        toggleButton.getStyleClass().addAll((String[])new String[]{"flat"});
        toggleButton.setMinWidth(Double.NEGATIVE_INFINITY);
        node.setVisible(false);
        this.f.getChildren().add(node);
        this.g.put(toggleButton, node);
        toggleButton.selectedProperty().addListener((observableValue, bl, bl2) -> {
            node.setVisible((boolean)bl2);
            if (bl2.booleanValue()) {
                node.toFront();
                this.a(toggleButton);
            }
        });
        this.d.getChildren().add(toggleButton);
    }

    private void a(String string, Supplier<Node> supplier) {
        ToggleButton toggleButton = new ToggleButton(I18n.a(string));
        toggleButton.setToggleGroup(this.e);
        toggleButton.setUserData(string);
        toggleButton.getStyleClass().addAll((String[])new String[]{"flat"});
        toggleButton.setMinWidth(Double.NEGATIVE_INFINITY);
        Label label = new Label("...");
        label.setVisible(false);
        this.f.getChildren().add(label);
        this.g.put(toggleButton, label);
        this.h.put(toggleButton, supplier);
        toggleButton.selectedProperty().addListener((observableValue, bl, bl2) -> {
            if (bl2.booleanValue()) {
                if (this.h.containsKey(toggleButton)) {
                    Node node = this.h.remove(toggleButton).get();
                    this.f.getChildren().remove(label);
                    this.f.getChildren().add(node);
                    this.g.put(toggleButton, node);
                    node.setVisible(true);
                    node.toFront();
                } else {
                    Node node = this.g.get(toggleButton);
                    node.setVisible(true);
                    node.toFront();
                }
                this.a(toggleButton);
            } else {
                Node node = this.g.get(toggleButton);
                if (node != null) {
                    node.setVisible(false);
                }
            }
        });
        this.d.getChildren().add(toggleButton);
    }

    public void a(File file) {
        for (Toggle toggle : this.e.getToggles()) {
            ToggleButton toggleButton = (ToggleButton)toggle;
            if (!"tab.jarAnalyzer".equals(toggleButton.getUserData())) continue;
            toggleButton.setSelected(true);
            Platform.runLater(() -> {
                if (this.m != null) {
                    this.m.a(file);
                }
            });
            break;
        }
    }

    private SVGPath a(boolean bl) {
        SVGPath sVGPath = new SVGPath();
        sVGPath.setContent(bl ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6");
        sVGPath.setStroke(Color.GRAY);
        sVGPath.setStrokeWidth(2.5);
        sVGPath.setFill(null);
        return sVGPath;
    }

    private void b() {
        double d2 = this.c.getHvalue();
        double d3 = this.d.getWidth();
        double d4 = this.c.getViewportBounds().getWidth();
        boolean bl = d2 > 0.0 && d3 > d4;
        boolean bl2 = d2 < 1.0 && d3 > d4;
        this.k.setStroke(bl ? Color.web("#bd93f9") : Color.GRAY);
        this.k.setStrokeWidth(bl ? 3.0 : 2.5);
        this.l.setStroke(bl2 ? Color.web("#bd93f9") : Color.GRAY);
        this.l.setStrokeWidth(bl2 ? 3.0 : 2.5);
    }

    private void a(double d2) {
        double d3 = this.c.getHvalue();
        this.c.setHvalue(Math.max(0.0, Math.min(1.0, d3 + d2)));
    }

    private void a(ToggleButton toggleButton) {
        double d2 = this.c.getViewportBounds().getWidth();
        double d3 = this.d.getBoundsInLocal().getWidth();
        if (d3 <= d2) {
            return;
        }
        double d4 = toggleButton.getBoundsInParent().getMinX();
        double d5 = toggleButton.getBoundsInParent().getWidth();
        double d6 = (d4 - d2 / 2.0 + d5 / 2.0) / (d3 - d2);
        this.c.setHvalue(Math.max(0.0, Math.min(1.0, d6)));
    }

    private VBox c() {
        List<p> list = b.p.getFolderTemplates();
        ArrayList<CheckBox> arrayList = new ArrayList<CheckBox>();
        CheckBox checkBox = new CheckBox(I18n.a("mod.selectAll"));
        checkBox.setStyle("-fx-font-weight: bold;");
        MenuButton menuButton = new MenuButton(I18n.a("mod.templates"));
        GridPane gridPane = new GridPane();
        gridPane.setHgap(15.0);
        gridPane.setVgap(10.0);
        int n = 0;
        int n2 = 0;
        int n3 = 3;
        for (p object2 : list) {
            CheckBox checkBox2 = new CheckBox(I18n.a(object2.getDisplayName()));
            checkBox2.setUserData(object2);
            if ("__ALL_DISKS__".equals(object2.getValue())) {
                checkBox2.setStyle("-fx-text-fill: #bd93f9; -fx-font-weight: bold;");
            }
            arrayList.add(checkBox2);
            gridPane.add(checkBox2, n, n2);
            if (++n < n3) continue;
            n = 0;
            ++n2;
        }
        CustomMenuItem customMenuItem = new CustomMenuItem(gridPane);
        customMenuItem.setHideOnClick(false);
        menuButton.getItems().add(customMenuItem);
        for (CheckBox checkBox3 : arrayList) {
            checkBox3.setOnAction(actionEvent -> {
                p p2 = (p)checkBox3.getUserData();
                String string = this.p.getText();
                LinkedHashSet<String> linkedHashSet = new LinkedHashSet<String>();
                if (string != null && !string.isEmpty()) {
                    for (String string2 : string.split(";")) {
                        String object = string2.trim();
                        if (object.isEmpty()) continue;
                        linkedHashSet.add(object);
                    }
                }
                ArrayList<String> stringArray = new ArrayList<String>();
                if ("__ALL_DISKS__".equals(p2.getValue())) {
                    for (File file : File.listRoots()) {
                        if (!file.exists() || !file.isDirectory()) continue;
                        stringArray.add(file.getAbsolutePath());
                    }
                } else {
                    stringArray.add(p2.getValue());
                }
                if (checkBox3.isSelected()) {
                    linkedHashSet.addAll((Collection<String>)stringArray);
                } else {
                    linkedHashSet.removeAll((Collection<?>)stringArray);
                }
                this.p.setText(String.join((CharSequence)" ; ", linkedHashSet));
                checkBox.setSelected(arrayList.stream().allMatch(CheckBox::isSelected));
            });
        }
        checkBox.setOnAction(actionEvent -> {
            boolean bl = checkBox.isSelected();
            LinkedHashSet<String> linkedHashSet = new LinkedHashSet<String>();
            if (bl) {
                for (CheckBox checkBox2 : arrayList) {
                    p p2 = (p)checkBox2.getUserData();
                    if ("__ALL_DISKS__".equals(p2.getValue())) {
                        for (File file : File.listRoots()) {
                            if (!file.exists() || !file.isDirectory()) continue;
                            linkedHashSet.add(file.getAbsolutePath());
                        }
                        continue;
                    }
                    linkedHashSet.add(p2.getValue());
                }
            }
            this.p.setText(String.join((CharSequence)" ; ", linkedHashSet));
            for (CheckBox checkBox2 : arrayList) {
                checkBox2.setSelected(bl);
            }
        });
        Label label = new Label(I18n.a("mod.pathLabel"));
        this.p = new TextField();
        this.p.setPromptText(I18n.a("mod.pathPrompt"));
        this.q = new CheckBox(I18n.a("mod.recursive"));
        this.r = new CheckBox(I18n.a("mod.includeZip"));
        this.r.setSelected(false);
        this.s = new CheckBox(I18n.a("mod.extChanged"));
        this.s.setSelected(false);
        HBox.setHgrow(this.p, Priority.ALWAYS);
        Button button = new Button(I18n.a("common.browse"));
        button.getStyleClass().addAll((String[])new String[]{"button-outlined"});
        button.setOnAction(actionEvent -> this.e());
        this.t = new Button(I18n.a("mod.analyzeBtn"));
        this.t.setDisable(true);
        this.t.getStyleClass().addAll((String[])new String[]{"success"});
        this.t.setOnAction(actionEvent -> this.f());
        Region region = new Region();
        HBox.setHgrow(region, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, label, this.p, button, this.q, this.r, this.s, this.t, region, menuButton, checkBox);
        hBox.setAlignment(Pos.CENTER_LEFT);
        hBox.setPadding(new Insets(10.0));
        Label label2 = new Label("\ud83d\udd0d");
        this.u = new TextField();
        this.u.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(this.u, Priority.ALWAYS);
        PauseTransition pauseTransition = new PauseTransition(Duration.millis(250.0));
        this.u.textProperty().addListener((observableValue, string, string2) -> {
            pauseTransition.setOnFinished(actionEvent -> {
                if (this.w != null) {
                    this.w.setPredicate(j2 -> {
                        String[] stringArray;
                        if (string2 == null || string2.trim().isEmpty()) {
                            return true;
                        }
                        for (String term : stringArray = string2.toLowerCase().split("\\|")) {
                            String string3 = term.trim();
                            if (string3.isEmpty() || !j2.getFileName().toLowerCase().contains(string3) && !j2.getPath().toLowerCase().contains(string3)) continue;
                            return true;
                        }
                        return false;
                    });
                }
            });
            pauseTransition.playFromStart();
        });
        HBox hBox2 = new HBox(10.0, label2, this.u);
        hBox2.setAlignment(Pos.CENTER_LEFT);
        hBox2.setPadding(new Insets(0.0, 10.0, 0.0, 10.0));
        this.p.textProperty().addListener((observableValue, string, string2) -> {
            this.t.setDisable(string2 == null || string2.trim().isEmpty());
            if (string2 != null) {
                HashSet<String> hashSet = new HashSet<String>();
                for (String string3 : string2.split(";")) {
                    String fileArray = string3.trim();
                    if (fileArray.isEmpty()) continue;
                    hashSet.add(fileArray);
                }
                for (CheckBox checkBox2 : arrayList) {
                    p p2 = (p)checkBox2.getUserData();
                    if ("__ALL_DISKS__".equals(p2.getValue())) {
                        boolean bl = true;
                        for (File file : File.listRoots()) {
                            if (!file.exists() || !file.isDirectory() || hashSet.contains(file.getAbsolutePath())) continue;
                            bl = false;
                            break;
                        }
                        checkBox2.setSelected(bl);
                        continue;
                    }
                    checkBox2.setSelected(hashSet.contains(p2.getValue()));
                }
                checkBox.setSelected(!arrayList.isEmpty() && arrayList.stream().allMatch(CheckBox::isSelected));
            }
        });
        this.E = new Label(I18n.a("mod.statusReady"));
        this.E.setStyle(util.a.f);
        this.o = new TableView();
        this.o.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        this.o.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        TableColumn tableColumn2 = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("fileName"));
        TableColumn tableColumn3 = new TableColumn(I18n.a("mod.col.filePath"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("path"));
        TableColumn<b.j, String> tableColumn4 = new TableColumn<b.j, String>(I18n.a("mod.col.hidden"));
        tableColumn4.setCellValueFactory(cellDataFeatures -> new SimpleStringProperty(new File(cellDataFeatures.getValue().getPath()).isHidden() ? I18n.a("yes") : I18n.a("no")));
        tableColumn4.setCellFactory(tableColumn -> new TableCell<b.j, String>() {

            @Override
            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (string == null || bl) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    this.setStyle(I18n.a("yes").equals(string) ? util.a.a : util.a.b);
                }
            }

            private static /* synthetic */ String _we(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0x6A;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 651496801 + 1517465543 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn5 = new TableColumn(I18n.a("mod.col.size"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("size"));
        this.x = new TableColumn(I18n.a("mod.col.extChanged"));
        this.x.setCellValueFactory(new PropertyValueFactory("extensionChanged"));
        this.x.setPrefWidth(110.0);
        this.x.setVisible(false);
        this.x.setCellFactory(tableColumn -> new TableCell<b.j, String>() {

            @Override
            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    this.setStyle(I18n.a("yes").equals(string) ? util.a.a : util.a.b);
                }
            }

            private static /* synthetic */ String _ub(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0xAB;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 123945167 + 2045442293 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn6 = new TableColumn(I18n.a("mod.col.obfuscation"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("obfuscation"));
        tableColumn6.setCellFactory(tableColumn -> new TableCell<b.j, String>() {

            @Override
            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (string == null || bl) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.contains(I18n.a("obf.high"))) {
                        this.setStyle(util.a.a);
                    } else if (string.contains(I18n.a("obf.unknown"))) {
                        this.setStyle(util.a.f);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _aree(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0xE2;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 321113373 + 443323471 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        this.o.getColumns().addAll(tableColumn2, tableColumn3, tableColumn4, tableColumn5, this.x, tableColumn6);
        this.o.setFixedCellSize(24.0);
        this.w = new FilteredList<b.j>(this.v, j2 -> true);
        SortedList<b.j> sortedList = new SortedList<b.j>((ObservableList<b.j>)this.w);
        sortedList.comparatorProperty().bind(this.o.comparatorProperty());
        this.o.setItems(sortedList);
        VBox.setVgrow(this.o, Priority.ALWAYS);
        this.o.setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            ContextMenu contextMenu = new ContextMenu();
            MenuItem menuItem = new MenuItem(I18n.a("mod.ctx.openFolder"));
            menuItem.setOnAction(actionEvent -> {
                b.j j2 = (b.j)tableRow.getItem();
                if (j2 != null) {
                    try {
                        Runtime.getRuntime().exec(new String[]{"explorer.exe", "/select,", j2.getPath()});
                    }
                    catch (IOException iOException) {
                        iOException.printStackTrace();
                    }
                }
            });
            MenuItem menuItem2 = new MenuItem(I18n.a("mod.ctx.copyName"));
            menuItem2.setOnAction(actionEvent -> {
                b.j j2 = (b.j)tableRow.getItem();
                if (j2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(j2.getFileName());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem3 = new MenuItem(I18n.a("mod.ctx.copyPath"));
            menuItem3.setOnAction(actionEvent -> {
                b.j j2 = (b.j)tableRow.getItem();
                if (j2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(j2.getPath());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem4 = new MenuItem(I18n.a("ctx.analyzeJar"));
            menuItem4.setOnAction(actionEvent -> {
                File file;
                b.j j2 = (b.j)tableRow.getItem();
                if (j2 != null && (file = new File(j2.getPath())).exists()) {
                    this.a(file);
                }
            });
            contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3, menuItem4});
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        VBox vBox = new VBox(10.0, hBox, hBox2, this.o, this.E);
        VBox.setVgrow(vBox, Priority.ALWAYS);
        I18n.a(() -> {
            for (CheckBox checkBox2 : arrayList) {
                p p2 = (p)checkBox2.getUserData();
                checkBox2.setText(I18n.a(p2.getDisplayName()));
            }
            menuButton.setText(I18n.a("mod.templates"));
            checkBox.setText(I18n.a("mod.selectAll"));
            label.setText(I18n.a("mod.pathLabel"));
            this.p.setPromptText(I18n.a("mod.pathPrompt"));
            this.u.setPromptText(I18n.a("mod.searchPrompt"));
            this.q.setText(I18n.a("mod.recursive"));
            this.r.setText(I18n.a("mod.includeZip"));
            this.s.setText(I18n.a("mod.extChanged"));
            if (this.H) {
                this.t.setText(I18n.a("mod.cancelBtn"));
            } else {
                this.t.setText(I18n.a("mod.analyzeBtn"));
            }
            if (this.G) {
                this.E.setText(String.format(I18n.a("mod.statusFinished"), this.v.size()));
            } else if (!this.H) {
                this.E.setText(I18n.a("mod.statusReady"));
            }
            tableColumn2.setText(I18n.a("mod.col.fileName"));
            tableColumn3.setText(I18n.a("mod.col.filePath"));
            tableColumn4.setText(I18n.a("mod.col.hidden"));
            tableColumn5.setText(I18n.a("mod.col.size"));
            this.x.setText(I18n.a("mod.col.extChanged"));
            tableColumn6.setText(I18n.a("mod.col.obfuscation"));
        });
        return vBox;
    }

    private VBox d() {
        Region region2;
        Node object;
        List<p> list = b.p.getClassTemplates();
        ArrayList<CheckBox> arrayList = new ArrayList<CheckBox>();
        CheckBox checkBox = new CheckBox(I18n.a("class.selectAll"));
        checkBox.setStyle("-fx-font-weight: bold;");
        MenuButton menuButton = new MenuButton(I18n.a("class.templates"));
        GridPane gridPane = new GridPane();
        gridPane.setHgap(15.0);
        gridPane.setVgap(10.0);
        int n = 0;
        int n2 = 0;
        int n3 = 3;
        for (p object22 : list) {
            object = new CheckBox(object22.getDisplayName());
            ((Node)object).setUserData(object22.getValue());
            arrayList.add((CheckBox)object);
            gridPane.add((Node)object, n, n2);
            if (++n < n3) continue;
            n = 0;
            ++n2;
        }
        CustomMenuItem customMenuItem = new CustomMenuItem(gridPane);
        customMenuItem.setHideOnClick(false);
        menuButton.getItems().add(customMenuItem);
        Runnable runnable = () -> {
            StringBuilder stringBuilder = new StringBuilder();
            HashSet<String> hashSet = new HashSet<String>();
            for (Object obj : arrayList) {
                for (String object3 : ((Node)obj).getUserData().toString().split("\\|")) {
                    if (object3.trim().isEmpty()) continue;
                    hashSet.add(object3.trim().toLowerCase());
                }
            }
            String string = this.z.getText();
            LinkedHashSet<String> object22 = new LinkedHashSet<String>();
            if (string != null && !string.isEmpty()) {
                for (String string2 : string.split("\\|")) {
                    String string3 = string2.trim();
                    if (string3.isEmpty() || hashSet.contains(string3.toLowerCase())) continue;
                    object22.add(string3);
                }
            }
            Iterator object4 = object22.iterator();
            while (object4.hasNext()) {
                String string2 = (String)object4.next();
                if (stringBuilder.length() > 0) {
                    stringBuilder.append("|");
                }
                stringBuilder.append(string2);
            }
            HashSet<String> object5 = new HashSet<String>();
            ArrayList<String> arrayList2 = new ArrayList<String>();
            for (CheckBox checkBox2 : arrayList) {
                if (checkBox2.isSelected()) {
                    String string4 = (String)checkBox2.getUserData();
                    object5.add(string4);
                    if (stringBuilder.length() > 0) {
                        stringBuilder.append("|");
                    }
                    stringBuilder.append(string4);
                    continue;
                }
                arrayList2.add((String)checkBox2.getUserData());
            }
            this.z.setText(stringBuilder.toString());
            if (!this.C.isEmpty()) {
                this.C.removeIf(arg_0 -> ManualAnalyze.a(arrayList2, object5, object22, arg_0));
            }
        };
        for (CheckBox checkBox3 : arrayList) {
            checkBox3.setOnAction(actionEvent -> {
                runnable.run();
                checkBox.setSelected(arrayList.stream().allMatch(CheckBox::isSelected));
            });
        }
        checkBox.setOnAction(actionEvent -> {
            boolean bl = checkBox.isSelected();
            for (CheckBox checkBox2 : arrayList) {
                checkBox2.setSelected(bl);
            }
            runnable.run();
        });
        Label searchLabel = new Label(I18n.a("class.searchLabel"));
        this.z = new TextField();
        this.z.setPromptText(I18n.a("class.searchPrompt"));
        HBox.setHgrow(this.z, Priority.ALWAYS);
        this.A = new CheckBox(I18n.a("class.exactMatch"));
        this.B = new Button(I18n.a("class.searchBtn"));
        this.B.getStyleClass().addAll((String[])new String[]{"accent"});
        this.B.setDisable(true);
        this.B.setOnAction(actionEvent -> this.h());
        region2 = new Region();
        HBox.setHgrow(region2, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, new Node[]{searchLabel, this.z, this.A, this.B, region2, menuButton, checkBox});
        hBox.setAlignment(Pos.CENTER_LEFT);
        hBox.setPadding(new Insets(10.0));
        this.F = new Label(I18n.a("class.statusReady"));
        this.F.setStyle(util.a.f);
        this.y = new TableView();
        this.y.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        this.y.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        TableColumn tableColumn2 = new TableColumn(I18n.a("class.col.matchEntry"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("matchEntry"));
        TableColumn tableColumn3 = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("fileName"));
        TableColumn tableColumn4 = new TableColumn(I18n.a("mod.col.filePath"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("filePath"));
        TableColumn tableColumn5 = new TableColumn(I18n.a("mod.col.hidden"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("hidden"));
        tableColumn5.setCellFactory(tableColumn -> new TableCell<b.b, String>() {

            @Override
            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (string == null || bl) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    this.setStyle(I18n.a("yes").equals(string) ? util.a.a : util.a.b);
                }
            }

            private static /* synthetic */ String _mcm(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0x1C;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 1121445923 + 1429680229 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn6 = new TableColumn(I18n.a("mod.col.size"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("size"));
        this.D = new TableColumn(I18n.a("mod.col.extChanged"));
        this.D.setCellValueFactory(new PropertyValueFactory("extensionChanged"));
        this.D.setPrefWidth(110.0);
        this.D.setVisible(false);
        this.D.setCellFactory(tableColumn -> new TableCell<b.b, String>() {

            @Override
            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    this.setStyle(I18n.a("yes").equals(string) ? util.a.a : util.a.b);
                }
            }

            private static /* synthetic */ String _fo(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0xE9;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 494899389 + 1825925005 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn7 = new TableColumn(I18n.a("mod.col.obfuscation"));
        tableColumn7.setCellValueFactory(new PropertyValueFactory("obfuscation"));
        tableColumn7.setCellFactory(tableColumn -> new TableCell<b.b, String>() {

            @Override
            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                this.setText(bl ? null : string);
                if (string != null && string.contains(I18n.a("obf.high"))) {
                    this.setStyle(util.a.a);
                } else if (string != null && string.contains(I18n.a("obf.unknown"))) {
                    this.setStyle(util.a.f);
                } else {
                    this.setStyle(util.a.b);
                }
            }

            private static /* synthetic */ String _cf(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0x46;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 1224153311 + 718721303 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        this.y.getColumns().addAll(tableColumn2, tableColumn3, tableColumn4, tableColumn5, tableColumn6, this.D, tableColumn7);
        this.y.setFixedCellSize(24.0);
        SortedList<b.b> sortedList = new SortedList<b.b>(this.C);
        sortedList.comparatorProperty().bind(this.y.comparatorProperty());
        this.y.setItems(sortedList);
        VBox.setVgrow(this.y, Priority.ALWAYS);
        this.y.setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            ContextMenu contextMenu = new ContextMenu();
            MenuItem menuItem = new MenuItem(I18n.a("mod.ctx.openFolder"));
            menuItem.setOnAction(actionEvent -> {
                b.b b2 = (b.b)tableRow.getItem();
                if (b2 != null) {
                    try {
                        Runtime.getRuntime().exec(new String[]{"explorer.exe", "/select,", b2.getFilePath()});
                    }
                    catch (IOException iOException) {
                        iOException.printStackTrace();
                    }
                }
            });
            MenuItem menuItem2 = new MenuItem(I18n.a("class.ctx.copyJarName"));
            menuItem2.setOnAction(actionEvent -> {
                b.b b2 = (b.b)tableRow.getItem();
                if (b2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(b2.getFileName());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem3 = new MenuItem(I18n.a("mod.ctx.copyPath"));
            menuItem3.setOnAction(actionEvent -> {
                b.b b2 = (b.b)tableRow.getItem();
                if (b2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(b2.getFilePath());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem4 = new MenuItem(I18n.a("class.ctx.copyEntry"));
            menuItem4.setOnAction(actionEvent -> {
                b.b b2 = (b.b)tableRow.getItem();
                if (b2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(b2.getMatchEntry());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3, menuItem4});
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        VBox vBox = new VBox(10.0, hBox, this.y, this.F);
        VBox.setVgrow(vBox, Priority.ALWAYS);
        I18n.a(() -> this.a(menuButton, checkBox, searchLabel, tableColumn2, tableColumn3, tableColumn4, tableColumn5, tableColumn6, tableColumn7));
        return vBox;
    }

    private void e() {
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Select Mods Folder");
        File file = directoryChooser.showDialog(this.a);
        if (file != null) {
            String string = this.p.getText();
            String string2 = file.getAbsolutePath();
            if (string == null || string.trim().isEmpty()) {
                this.p.setText(string2);
            } else if (!string.contains(string2)) {
                this.p.setText(string.trim() + " ; " + string2);
            }
        }
    }

    private void f() {
        boolean bl;
        Object object;
        String string = this.p.getText();
        if (string == null || string.trim().isEmpty()) {
            this.a(Alert.AlertType.ERROR, I18n.a("mod.alert.error"), I18n.a("mod.alert.invalidPath"));
            return;
        }
        LinkedHashSet<File> linkedHashSet = new LinkedHashSet<File>();
        String[] stringArray = string.split(";");
        for (String object22 : stringArray) {
            String string2 = object22.trim();
            if (string2.isEmpty() || !((File)(object = new File(string2))).exists() || !((File)object).isDirectory()) continue;
            linkedHashSet.add((File)object);
        }
        if (linkedHashSet.isEmpty()) {
            this.a(Alert.AlertType.ERROR, I18n.a("mod.alert.error"), I18n.a("mod.alert.invalidPath"));
            return;
        }
        ArrayList<File> object3 = new ArrayList<File>(linkedHashSet);
        if (this.q.isSelected()) {
            object3.sort(Comparator.comparingInt(file -> file.getAbsolutePath().length()));
            ArrayList<File> arrayList = new ArrayList<File>();
            Iterator iterator = object3.iterator();
            while (iterator.hasNext()) {
                File file2 = (File)iterator.next();
                boolean bl2 = false;
                for (File file3 : arrayList) {
                    if (!file2.getAbsolutePath().startsWith(file3.getAbsolutePath() + File.separator) && !file2.getAbsolutePath().equals(file3.getAbsolutePath())) continue;
                    bl2 = true;
                    break;
                }
                if (bl2) continue;
                arrayList.add(file2);
            }
            object3 = arrayList;
        }
        ArrayList<File> object4 = object3;
        this.H = true;
        this.E.setText(I18n.a("mod.statusScanning"));
        this.v.clear();
        this.G = false;
        int n = this.s.isSelected() ? 1 : 0;
        this.x.setVisible(n != 0);
        this.D.setVisible(n != 0);
        String string3 = this.z.getText().trim();
        boolean bl3 = bl = !string3.isEmpty();
        if (bl) {
            this.C.clear();
            this.B.setDisable(true);
            this.B.setText(I18n.a("class.statusScanning"));
            this.F.setText(I18n.a("class.statusScanning"));
        }
        this.t.setText(I18n.a("mod.cancelBtn"));
        this.t.getStyleClass().removeAll((String[])new String[]{"success"});
        this.t.getStyleClass().add("danger");
        this.t.setOnAction(actionEvent -> {
            this.engine.a();
            this.t.setDisable(true);
        });
        object = string3;
        boolean bl4 = this.A.isSelected();
        a.Listener a2 = new a.Listener(){

            @Override
            public void a(int n, int n2) {
                Platform.runLater(() -> {
                    String string = n2 > 0 ? String.format(I18n.a("mod.statusScanningProgress"), n, n2) : I18n.a("mod.statusScanning");
                    ManualAnalyze.this.E.setText(string);
                    if (bl) {
                        String string2 = n2 > 0 ? String.format(I18n.a("class.statusScanningProgress"), n, n2) : I18n.a("class.statusScanning");
                        ManualAnalyze.this.F.setText(string2);
                    }
                });
            }

            @Override
            public void a(List<b.j> list) {
                Platform.runLater(() -> ManualAnalyze.this.v.addAll((Collection<b.j>)list));
            }

            @Override
            public void b(List<b.b> list) {
                Platform.runLater(() -> ManualAnalyze.this.C.addAll((Collection<b.b>)list));
            }

            @Override
            public void a() {
                Platform.runLater(() -> {
                    ManualAnalyze.this.H = false;
                    ManualAnalyze.this.g();
                    ManualAnalyze.this.G = true;
                    ManualAnalyze.this.B.setDisable(false);
                    if (bl) {
                        ManualAnalyze.this.B.setText(I18n.a("class.searchBtn"));
                    }
                    ManualAnalyze.this.E.setText(String.format(I18n.a("mod.statusFinished"), ManualAnalyze.this.v.size()));
                    if (bl) {
                        ManualAnalyze.this.F.setText(String.format(I18n.a("class.statusFound"), ManualAnalyze.this.C.size()));
                    }
                    ManualAnalyze.this.a(Alert.AlertType.INFORMATION, I18n.a("mod.alert.finished"), bl ? I18n.a("mod.alert.allDone") : I18n.a("mod.alert.analysisDone"));
                });
            }

            @Override
            public void b() {
                Platform.runLater(() -> {
                    ManualAnalyze.this.H = false;
                    ManualAnalyze.this.g();
                    ManualAnalyze.this.B.setDisable(false);
                    if (bl) {
                        ManualAnalyze.this.B.setText(I18n.a("class.searchBtn"));
                    }
                    ManualAnalyze.this.E.setText(I18n.a("mod.statusCancelled"));
                    if (bl) {
                        ManualAnalyze.this.F.setText(I18n.a("mod.statusCancelled"));
                    }
                });
            }

            private static /* synthetic */ String _maaj(String string, int n) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n2 = n ^ 0x49;
                    int n3 = 0;
                    while (n3 < cArray.length) {
                        n2 = n2 * 382973035 + 941538637 & Integer.MAX_VALUE;
                        int n4 = n3++;
                        cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        };
        CompletableFuture.runAsync(() -> this.a(object4, string3, bl4, a2));
    }

    private void g() {
        this.t.setText(I18n.a("mod.analyzeBtn"));
        this.t.getStyleClass().removeAll((String[])new String[]{"danger"});
        if (!this.t.getStyleClass().contains("success")) {
            this.t.getStyleClass().add("success");
        }
        this.t.setDisable(false);
        this.t.setOnAction(actionEvent -> this.f());
    }

    private void h() {
        if (!this.G) {
            this.a(Alert.AlertType.WARNING, I18n.a("class.alert.warning"), I18n.a("class.alert.needAnalysis"));
            return;
        }
        if (this.v.isEmpty()) {
            this.a(Alert.AlertType.WARNING, I18n.a("class.alert.warning"), I18n.a("class.alert.noMods"));
            return;
        }
        String string = this.z.getText().trim();
        if (string.isEmpty()) {
            this.a(Alert.AlertType.WARNING, I18n.a("class.alert.warning"), I18n.a("class.alert.emptyQuery"));
            return;
        }
        this.C.clear();
        this.D.setVisible(this.s.isSelected());
        this.F.setText(I18n.a("class.statusScanning"));
        this.B.setText(I18n.a("mod.cancelBtn"));
        this.B.getStyleClass().removeAll((String[])new String[]{"accent"});
        this.B.getStyleClass().add("danger");
        this.B.setOnAction(actionEvent -> {
            this.engine.a();
            this.B.setDisable(true);
        });
        CompletableFuture.runAsync(() -> {
            ArrayList<File> var6_9 = null;
            boolean bl = this.q.isSelected();
            HashMap<File, Boolean> hashMap = new HashMap<File, Boolean>();
            LinkedHashSet<File> linkedHashSet = new LinkedHashSet<File>();
            String string2 = this.p.getText();
            if (string2 != null) {
                int var8_15 = 0;
                String[] object = string2.split(";");
                int bl3 = object.length;
                boolean bl2 = false;
                while (var8_15 < bl3) {
                    File object2;
                    String string3 = object[var8_15];
                    String string4 = string3.trim();
                    if (!string4.isEmpty() && ((File)(object2 = new File(string4))).exists() && ((File)object2).isDirectory()) {
                        linkedHashSet.add(object2);
                    }
                    ++var8_15;
                }
            }
            ArrayList<File> arrayList = new ArrayList<File>(linkedHashSet);
            var6_9 = arrayList;
            if (bl) {
                arrayList.sort(Comparator.comparingInt(file -> file.getAbsolutePath().length()));
                ArrayList<File> arrayList2 = new ArrayList<File>();
                for (File file2 : arrayList) {
                    boolean bl3 = false;
                    for (File file3 : arrayList2) {
                        if (!file2.getAbsolutePath().startsWith(file3.getAbsolutePath() + File.separator) && !file2.getAbsolutePath().equals(file3.getAbsolutePath())) continue;
                        bl3 = true;
                        break;
                    }
                    if (bl3) continue;
                    arrayList2.add(file2);
                }
                var6_9 = arrayList2;
            }
            for (File file4 : var6_9) {
                hashMap.put(file4, bl);
            }
            boolean bl4 = this.r.isSelected();
            boolean bl5 = this.s.isSelected();
            this.engine.a((List<File>)var6_9, hashMap, string, this.A.isSelected(), bl4, bl5, new a.Listener(){

                @Override
                public void a(int n, int n2) {
                    Platform.runLater(() -> {
                        String string = n2 > 0 ? String.format(I18n.a("class.statusScanningProgress"), n, n2) : I18n.a("class.statusScanning");
                        ManualAnalyze.this.F.setText(string);
                    });
                }

                @Override
                public void a(List<b.j> list) {
                }

                @Override
                public void b(List<b.b> list) {
                    Platform.runLater(() -> ManualAnalyze.this.C.addAll((Collection<b.b>)list));
                }

                @Override
                public void a() {
                    Platform.runLater(() -> {
                        ManualAnalyze.this.i();
                        ManualAnalyze.this.F.setText(String.format(I18n.a("class.statusFound"), ManualAnalyze.this.C.size()));
                        ManualAnalyze.this.a(Alert.AlertType.INFORMATION, I18n.a("class.alert.info"), I18n.a("class.alert.searchDone"));
                    });
                }

                @Override
                public void b() {
                    Platform.runLater(() -> {
                        ManualAnalyze.this.i();
                        ManualAnalyze.this.F.setText(I18n.a("mod.statusCancelled"));
                    });
                }

                private static /* synthetic */ String _wlcw(String string, int n) {
                    if (string != null) {
                        char[] cArray = string.toCharArray();
                        int n2 = n ^ 0x88;
                        int n3 = 0;
                        while (n3 < cArray.length) {
                            n2 = n2 * 134474259 + 229083803 & Integer.MAX_VALUE;
                            int n4 = n3++;
                            cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
                        }
                        return new String(cArray);
                    }
                    return null;
                }
            });
        });
    }

    private void i() {
        this.B.setText(I18n.a("class.searchBtn"));
        this.B.getStyleClass().removeAll((String[])new String[]{"danger"});
        if (!this.B.getStyleClass().contains("accent")) {
            this.B.getStyleClass().add("accent");
        }
        this.B.setDisable(false);
        this.B.setOnAction(actionEvent -> this.h());
    }

    private void a(Alert.AlertType alertType, String string, String string2) {
        Alert alert = new Alert(alertType);
        alert.setTitle(string);
        alert.setHeaderText(null);
        alert.setContentText(string2);
        alert.show();
    }

    private /* synthetic */ void a(List<File> list, String string, boolean bl, a.Listener a2) {
        boolean bl2 = this.q.isSelected();
        boolean bl3 = this.r.isSelected();
        boolean bl4 = this.s.isSelected();
        HashMap<File, Boolean> hashMap = new HashMap<File, Boolean>();
        for (File file : list) {
            hashMap.put(file, bl2);
        }
        this.engine.a(list, hashMap, string, bl, bl3, bl4, a2);
    }

    private /* synthetic */ void a(MenuButton menuButton, CheckBox checkBox, Label label, TableColumn tableColumn, TableColumn tableColumn2, TableColumn tableColumn3, TableColumn tableColumn4, TableColumn tableColumn5, TableColumn tableColumn6) {
        menuButton.setText(I18n.a("class.templates"));
        checkBox.setText(I18n.a("class.selectAll"));
        label.setText(I18n.a("class.searchLabel"));
        this.z.setPromptText(I18n.a("class.searchPrompt"));
        this.A.setText(I18n.a("class.exactMatch"));
        if (this.G || this.B.isDisabled() || this.B.getText().equals(I18n.a("class.searchBtn"))) {
            this.B.setText(I18n.a("class.searchBtn"));
        }
        if (!this.C.isEmpty() && this.G) {
            this.F.setText(String.format(I18n.a("class.statusFound"), this.C.size()));
        } else if (!this.B.isDisabled() && this.B.getText().equals(I18n.a("class.searchBtn"))) {
            this.F.setText(I18n.a("class.statusReady"));
        }
        tableColumn.setText(I18n.a("class.col.matchEntry"));
        tableColumn2.setText(I18n.a("mod.col.fileName"));
        tableColumn3.setText(I18n.a("mod.col.filePath"));
        tableColumn4.setText(I18n.a("mod.col.hidden"));
        tableColumn5.setText(I18n.a("mod.col.size"));
        this.D.setText(I18n.a("mod.col.extChanged"));
        tableColumn6.setText(I18n.a("mod.col.obfuscation"));
    }

    private static /* synthetic */ boolean a(List<String> list, Set<String> set, Set<String> set2, b.b b2) {
        String string = b2.getMatchEntry().toLowerCase();
        boolean bl = false;
        for (String string2 : list) {
            for (String string3 : string2.split("\\|")) {
                if (string3.isEmpty() || !string.contains(string3.toLowerCase())) continue;
                bl = true;
                break;
            }
            if (!bl) continue;
            break;
        }
        if (!bl) {
            return false;
        }
        for (String string2 : set) {
            for (String string3 : string2.split("\\|")) {
                if (string3.isEmpty() || !string.contains(string3.toLowerCase())) continue;
                return false;
            }
        }
        for (String string2 : set2) {
            if (string2.isEmpty() || !string.contains(string2.toLowerCase())) continue;
            return false;
        }
        return true;
    }

    private static /* synthetic */ String _ntjg(String string, int n) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n2 = n ^ 0xBE;
            int n3 = 0;
            while (n3 < cArray.length) {
                n2 = n2 * 265504325 + 1309391201 & Integer.MAX_VALUE;
                int n4 = n3++;
                cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}

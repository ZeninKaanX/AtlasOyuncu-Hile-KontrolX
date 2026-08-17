/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.h;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.jar.Attributes;
import java.util.jar.Manifest;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import javafx.animation.PauseTransition;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.geometry.Insets;
import javafx.geometry.Orientation;
import javafx.geometry.Pos;
import javafx.scene.Node;
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
import javafx.scene.input.TransferMode;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.util.Duration;
import org.benf.cfr.reader.api.CfrDriver;
import org.benf.cfr.reader.api.ClassFileSource;
import org.benf.cfr.reader.api.OutputSinkFactory;
import org.benf.cfr.reader.bytecode.analysis.parse.utils.Pair;
import scanner.p;
import util.I18n;
import util.a;

public class j
extends VBox {
    private final ObservableList<h> a = FXCollections.observableArrayList();
    private FilteredList<h> b;
    private TableView<h> c;
    private TextArea d;
    private Label e;
    private TextField f;
    private Label g;
    private Label h;
    private Button i;
    private boolean j = false;
    private File k = null;
    private Label l;
    private Label m;
    private Label n;
    private Label o;
    private Label p;
    private Label q;
    private Label r;
    private Label s;

    public j() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.a();
    }

    private void a() {
        this.i = new Button(I18n.a("jar.btn.select"));
        this.i.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        this.f = new TextField();
        this.f.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(this.f, Priority.ALWAYS);
        this.g = new Label(I18n.a("jar.noFileSelected"));
        this.g.setStyle("-fx-text-fill: #888; -fx-font-style: italic;");
        this.g.setMinWidth(50.0);
        HBox hBox = new HBox(10.0, this.i, label, this.f, this.g);
        hBox.setAlignment(Pos.CENTER_LEFT);
        this.c = new TableView();
        this.c.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        this.c.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        this.c.setFixedCellSize(24.0);
        TableColumn tableColumn2 = new TableColumn(I18n.a("jar.col.entryName"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("entryName"));
        tableColumn2.setPrefWidth(400.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("jar.col.type"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("type"));
        tableColumn3.setPrefWidth(90.0);
        tableColumn3.setCellFactory(tableColumn -> new TableCell<h, String>(){

            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    switch (item) {
                        case "Class":
                            setStyle(util.a.b);
                            break;
                        case "META-INF":
                            setStyle(util.a.d);
                            break;
                        case "Resource":
                            setStyle(util.a.e);
                            break;
                        case "Directory":
                            setStyle(util.a.f);
                            break;
                        default:
                            setStyle("");
                            break;
                    }
                }
            }
        });

TableColumn tableColumn4 = new TableColumn(I18n.a("jar.col.size"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("size"));
        tableColumn4.setPrefWidth(90.0);
        tableColumn4.setComparator((string, string2) -> Long.compare(g((String)string), g((String)string2)));
        this.c.getColumns().addAll(tableColumn2, tableColumn3, tableColumn4);
        this.b = new FilteredList<h>(this.a, h2 -> true);
        SortedList<h> sortedList = new SortedList<h>((ObservableList<h>)this.b);
        sortedList.comparatorProperty().bind(this.c.comparatorProperty());
        this.c.setItems(sortedList);
        this.e = new Label(I18n.a("jar.preview.title"));
        this.e.setStyle("-fx-font-weight: bold; -fx-font-size: 13px; -fx-text-fill: #6272a4;");
        this.d = new TextArea();
        this.d.setEditable(false);
        this.d.setWrapText(false);
        this.d.setStyle("-fx-font-family: 'Consolas', 'Courier New', monospace; -fx-font-size: 12px;");
        VBox.setVgrow(this.d, Priority.ALWAYS);
        VBox vBox = new VBox(6.0, this.e, this.d);
        vBox.setPadding(new Insets(0.0, 0.0, 0.0, 4.0));
        VBox.setVgrow(vBox, Priority.ALWAYS);
        SplitPane splitPane = new SplitPane(this.c, vBox);
        splitPane.setOrientation(Orientation.HORIZONTAL);
        splitPane.setDividerPositions(0.65);
        VBox.setVgrow(splitPane, Priority.ALWAYS);
        this.c.getSelectionModel().selectedItemProperty().addListener((observableValue, h2, h3) -> {
            if (h3 != null && this.k != null) {
                this.a((h)h3);
            } else {
                this.e.setText(I18n.a("jar.preview.title"));
                this.d.clear();
            }
        });
        PauseTransition pauseTransition = new PauseTransition(Duration.millis(200.0));
        this.f.textProperty().addListener((observableValue, string, string2) -> {
            pauseTransition.setOnFinished(actionEvent -> this.b.setPredicate(h2 -> {
                if (string2 == null || string2.trim().isEmpty()) {
                    return true;
                }
                String lower = string2.toLowerCase();
                return h2.getEntryName().toLowerCase().contains(lower) || h2.getType().toLowerCase().contains(lower);
            }));
            pauseTransition.playFromStart();
        });
        this.c.setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            ContextMenu contextMenu = new ContextMenu();
            MenuItem menuItem = new MenuItem(I18n.a("jar.ctx.copyEntry"));
            menuItem.setOnAction(actionEvent -> {
                h h2 = (h)tableRow.getItem();
                if (h2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(h2.getEntryName());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem2 = new MenuItem(I18n.a("jar.ctx.copyContent"));
            menuItem2.setOnAction(actionEvent -> {
                String string = this.d.getText();
                if (string != null && !string.isEmpty()) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(string);
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2});
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        this.l = this.d("-");
        this.m = this.d("-");
        this.n = this.d("-");
        this.o = this.d("-");
        this.p = this.d("-");
        this.q = this.d("-");
        this.r = this.d("-");
        this.s = this.d("-");
        this.s.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-font-family: monospace;");
        HBox hBox2 = new HBox(8.0, this.c(I18n.a("jar.summary.fileSize")), this.l, this.b(), this.c(I18n.a("jar.summary.hidden")), this.m, this.b(), this.c(I18n.a("jar.summary.extChanged")), this.n, this.b(), this.c(I18n.a("jar.summary.overallObf")), this.o, this.b(), this.c(I18n.a("jar.summary.totalEntries")), this.p, this.b(), this.c(I18n.a("jar.summary.classes")), this.q, this.b(), this.c(I18n.a("jar.summary.resources")), this.r, this.b(), this.c(I18n.a("jar.summary.mainClass")), this.s);
        hBox2.setAlignment(Pos.CENTER_LEFT);
        hBox2.setPadding(new Insets(8.0, 12.0, 8.0, 12.0));
        hBox2.setStyle("-fx-background-color: rgba(255,255,255,0.04); -fx-background-radius: 6; -fx-border-color: rgba(255,255,255,0.10); -fx-border-radius: 6;");
        this.h = new Label(I18n.a("class.statusReady"));
        this.h.setStyle(util.a.f);
        this.i.setOnAction(actionEvent -> this.c());
        this.setOnDragOver(dragEvent -> {
            boolean bl;
            if (dragEvent.getGestureSource() != this && dragEvent.getDragboard().hasFiles() && (bl = dragEvent.getDragboard().getFiles().stream().anyMatch(file -> file.getName().toLowerCase().endsWith(".jar")))) {
                dragEvent.acceptTransferModes(TransferMode.COPY);
            }
            dragEvent.consume();
        });
        this.setOnDragDropped(dragEvent -> {
            File file2;
            boolean bl = false;
            if (dragEvent.getDragboard().hasFiles() && (file2 = (File)dragEvent.getDragboard().getFiles().stream().filter(file -> file.getName().toLowerCase().endsWith(".jar")).findFirst().orElse(null)) != null) {
                this.a(file2);
                bl = true;
            }
            dragEvent.setDropCompleted(bl);
            dragEvent.consume();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, splitPane, hBox2, this.h});
        I18n.a(() -> {
            this.i.setText(I18n.a("jar.btn.select"));
            tableColumn2.setText(I18n.a("jar.col.entryName"));
            tableColumn3.setText(I18n.a("jar.col.type"));
            tableColumn4.setText(I18n.a("jar.col.size"));
            this.e.setText(I18n.a("jar.preview.title"));
            this.f.setPromptText(I18n.a("mod.searchPrompt"));
            this.h.setText(I18n.a("class.statusReady"));
            this.a(hBox2);
            this.c.refresh();
        });
    }

    private void a(h h2) {
        String string = h2.getEntryName();
        this.e.setText(string);
        this.e.setStyle("-fx-font-weight: bold; -fx-font-size: 13px; -fx-text-fill: #8be9fd;");
        if (h2.getType().equals("Directory")) {
            this.d.setText("\ud83d\udcc1 " + string);
            return;
        }
        CompletableFuture.runAsync(() -> {
            try (ZipFile zipFile = new ZipFile(this.k);){
                ZipEntry zipEntry = zipFile.getEntry(string);
                if (zipEntry == null) {
                    Platform.runLater(() -> this.d.setText("Entry not found: " + string));
                    return;
                }
                try (InputStream inputStream = zipFile.getInputStream(zipEntry);){
                    byte[] byArray = inputStream.readAllBytes();
                    String string2 = string.toLowerCase();
                    String string3 = string2.endsWith(".class") ? this.a(string) : (b(string2) ? new String(byArray, StandardCharsets.UTF_8) : I18n.a("jar.preview.binaryNotSupported"));
                    Platform.runLater(() -> {
                        this.d.setText(string3);
                        this.d.positionCaret(0);
                    });
                }
            }
            catch (Exception exception) {
                Platform.runLater(() -> this.d.setText("Error reading entry: " + exception.getMessage()));
            }
        });
    }

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    private String a(String string) {
        String string2;
        Object object2;
        Object object3;
        Object object;
        try {
            StringBuilder stringBuilder = new StringBuilder();
            object3 = new OutputSinkFactory(){
                final /* synthetic */ StringBuilder a;
                {
                    this.a = stringBuilder;
                }

                @Override
                public List<OutputSinkFactory.SinkClass> getSupportedSinks(OutputSinkFactory.SinkType sinkType, Collection<OutputSinkFactory.SinkClass> collection) {
                    return Collections.singletonList(OutputSinkFactory.SinkClass.STRING);
                }

                @Override
                public <T> OutputSinkFactory.Sink<T> getSink(OutputSinkFactory.SinkType sinkType, OutputSinkFactory.SinkClass sinkClass) {
                    return object -> {
                        if (sinkType == OutputSinkFactory.SinkType.JAVA) {
                            this.a.append(object);
                        }
                    };
                }
            };
            object2 = new ClassFileSource(){

                @Override
                public void informAnalysisRelativePathDetail(String string, String string2) {
                }

                @Override
                public Collection<String> addJar(String string) {
                    return Collections.emptyList();
                }

                @Override
                public String getPossiblyRenamedPath(String string) {
                    return string;
                }

                /*
                 * Enabled aggressive block sorting
                 * Enabled unnecessary exception pruning
                 * Enabled aggressive exception aggregation
                 */
                @Override
                public Pair<byte[], String> getClassFileContent(String string) throws IOException {
                    Object object;
                    Object object2;
                    String object3 = string;
                    if (!((String)object3).endsWith(".class")) {
                        object3 = (String)object3 + ".class";
                    }
                    try {
                        object2 = new ZipFile(j.this.k);
                        try {
                            object = ((ZipFile)object2).getEntry((String)object3);
                            if (object != null) {
                                byte[] byArray = ((ZipFile)object2).getInputStream((ZipEntry)object).readAllBytes();
                                Pair<byte[], String> pair = Pair.make(byArray, object3);
                                return pair;
                            }
                        }
                        finally {
                            ((ZipFile)object2).close();
                        }
                    }
                    catch (Exception exception) {
                        // empty catch block
                    }
                    object2 = ((String)object3).startsWith("/") ? ((String)object3).substring(1) : object3;
                    object = ClassLoader.getSystemResourceAsStream((String)object2);
                    if (object == null) throw new IOException("Class not found: " + string);
                    byte[] byArray = ((InputStream)object).readAllBytes();
                    ((InputStream)object).close();
                    return Pair.make(byArray, object3);
                }

                private static /* synthetic */ String _kd(String string, int n2) {
                    if (string != null) {
                        char[] cArray = string.toCharArray();
                        int n3 = n2 ^ 0x9D;
                        int n4 = 0;
                        while (n4 < cArray.length) {
                            n3 = n3 * 498570029 + 2092832059 & Integer.MAX_VALUE;
                            int n5 = n4++;
                            cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                        }
                        return new String(cArray);
                    }
                    return null;
                }
            };
            string2 = string;
            if (string2.endsWith(".class")) {
                string2 = string2.substring(0, string2.length() - 6);
            }
            HashMap<String, String> hashMap = new HashMap<String, String>();
            hashMap.put("showversion", "false");
            hashMap.put("aexagg", "false");
            hashMap.put("sugarenums", "true");
            hashMap.put("decodestringswitch", "true");
            hashMap.put("decodelambdas", "true");
            hashMap.put("removeboilerplate", "true");
            CfrDriver cfrDriver = new CfrDriver.Builder().withClassFileSource((ClassFileSource)object2).withOutputSink((OutputSinkFactory)object3).withOptions(hashMap).build();
            cfrDriver.analyse(Collections.singletonList(string2));
            String string3 = stringBuilder.toString();
            if (!string3.trim().isEmpty()) {
                return string3;
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        try {
            object = new ZipFile(this.k);
            try {
                object3 = ((ZipFile)object).getEntry(string);
                if (object3 == null) return "Could not decompile: " + string;
                object2 = ((ZipFile)object).getInputStream((ZipEntry)object3).readAllBytes();
                string2 = a((byte[])object2, string);
                return string2;
            }
            finally {
                ((ZipFile)object).close();
            }
        }
        catch (Exception exception) {
            return "Error decompiling: " + exception.getMessage();
        }
    }

    private static String a(byte[] byArray, String string) {
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("// ").append(string).append("\n");
        stringBuilder.append("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n");
        if (byArray.length < 10 || byArray[0] != -54 || byArray[1] != -2 || byArray[2] != -70 || byArray[3] != -66) {
            stringBuilder.append("\u26a0 Not a valid Java class file (bad magic bytes)\n\n");
            stringBuilder.append("\n").append(I18n.a("jar.preview.binaryNotSupported"));
            return stringBuilder.toString();
        }
        int n2 = (byArray[4] & 0xFF) << 8 | byArray[5] & 0xFF;
        int n3 = (byArray[6] & 0xFF) << 8 | byArray[7] & 0xFF;
        String string2 = a(n3);
        stringBuilder.append("Class Version: ").append(n3).append(".").append(n2);
        stringBuilder.append(" (").append(string2).append(")\n\n");
        List<String> list = a(byArray);
        if (!list.isEmpty()) {
            stringBuilder.append("// Constant Pool Strings (").append(list.size()).append(")\n");
            stringBuilder.append("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
            for (int i2 = 0; i2 < list.size(); ++i2) {
                stringBuilder.append(String.format("[%3d] %s%n", i2 + 1, list.get(i2)));
            }
        } else {
            stringBuilder.append("(No readable strings found in constant pool)\n");
        }
        return stringBuilder.toString();
    }

    private static List<String> a(byte[] byArray) {
        ArrayList<String> arrayList = new ArrayList<String>();
        try {
            int n2 = (byArray[8] & 0xFF) << 8 | byArray[9] & 0xFF;
            int n3 = 10;
            block9: for (int i2 = 1; i2 < n2 && n3 < byArray.length; ++i2) {
                int n4 = byArray[n3] & 0xFF;
                ++n3;
                switch (n4) {
                    case 1: {
                        int n5;
                        if (n3 + 1 >= byArray.length) {
                            return arrayList;
                        }
                        if ((n3 += 2) + (n5 = (byArray[n3] & 0xFF) << 8 | byArray[n3 + 1] & 0xFF) > byArray.length) {
                            return arrayList;
                        }
                        String string = new String(byArray, n3, n5, StandardCharsets.UTF_8);
                        arrayList.add(string);
                        n3 += n5;
                        continue block9;
                    }
                    case 7: 
                    case 8: 
                    case 16: 
                    case 19: 
                    case 20: {
                        n3 += 2;
                        continue block9;
                    }
                    case 3: 
                    case 4: 
                    case 9: 
                    case 10: 
                    case 11: 
                    case 12: 
                    case 17: 
                    case 18: {
                        n3 += 4;
                        continue block9;
                    }
                    case 5: 
                    case 6: {
                        n3 += 8;
                        ++i2;
                        continue block9;
                    }
                    case 15: {
                        n3 += 3;
                        continue block9;
                    }
                    default: {
                        return arrayList;
                    }
                }
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        return arrayList;
    }

    private static String a(int n2) {
        return switch (n2) {
            case 45 -> "Java 1.1";
            case 46 -> "Java 1.2";
            case 47 -> "Java 1.3";
            case 48 -> "Java 1.4";
            case 49 -> "Java 5";
            case 50 -> "Java 6";
            case 51 -> "Java 7";
            case 52 -> "Java 8";
            case 53 -> "Java 9";
            case 54 -> "Java 10";
            case 55 -> "Java 11";
            case 56 -> "Java 12";
            case 57 -> "Java 13";
            case 58 -> "Java 14";
            case 59 -> "Java 15";
            case 60 -> "Java 16";
            case 61 -> "Java 17";
            case 62 -> "Java 18";
            case 63 -> "Java 19";
            case 64 -> "Java 20";
            case 65 -> "Java 21";
            case 66 -> "Java 22";
            case 67 -> "Java 23";
            case 68 -> "Java 24";
            default -> "Java ?";
        };
    }

    private static boolean b(String string) {
        return string.endsWith(".xml") || string.endsWith(".properties") || string.endsWith(".json") || string.endsWith(".yml") || string.endsWith(".yaml") || string.endsWith(".txt") || string.endsWith(".mf") || string.endsWith(".cfg") || string.endsWith(".conf") || string.endsWith(".html") || string.endsWith(".css") || string.endsWith(".js") || string.endsWith(".md") || string.endsWith(".log") || string.endsWith(".csv") || string.endsWith(".ini") || string.endsWith(".toml") || string.endsWith(".gradle") || string.endsWith(".bat") || string.endsWith(".sh") || string.endsWith(".sql") || string.endsWith(".kt") || string.endsWith(".java") || string.endsWith(".scala") || string.endsWith(".groovy");
    }

    private Label c(String string) {
        Label label = new Label(string);
        label.setStyle("-fx-text-fill: #6272a4; -fx-font-size: 13px;");
        return label;
    }

    private Label d(String string) {
        Label label = new Label(string);
        label.setStyle("-fx-font-size: 13px; -fx-font-weight: bold;");
        return label;
    }

    private Label b() {
        Label label = new Label("|");
        label.setStyle("-fx-text-fill: #555; -fx-font-size: 13px;");
        return label;
    }

    private void a(HBox hBox) {
        int[] nArray = new int[]{0, 3, 6, 9, 12, 15, 18, 21};
        String[] stringArray = new String[]{"jar.summary.fileSize", "jar.summary.hidden", "jar.summary.extChanged", "jar.summary.overallObf", "jar.summary.totalEntries", "jar.summary.classes", "jar.summary.resources", "jar.summary.mainClass"};
        for (int i2 = 0; i2 < nArray.length && nArray[i2] < hBox.getChildren().size(); ++i2) {
            ((Label)hBox.getChildren().get(nArray[i2])).setText(I18n.a(stringArray[i2]));
        }
    }

    private void c() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle(I18n.a("jar.chooserTitle"));
        fileChooser.getExtensionFilters().addAll((FileChooser.ExtensionFilter[])new FileChooser.ExtensionFilter[]{new FileChooser.ExtensionFilter("JAR / ZIP", "*.jar", "*.zip"), new FileChooser.ExtensionFilter(I18n.a("jar.allFiles"), "*.*")});
        File file = fileChooser.showOpenDialog(this.getScene().getWindow());
        if (file != null) {
            this.a(file);
        }
    }

    public void a(File file) {
        this.j = true;
        this.a.clear();
        this.d();
        this.d.clear();
        this.e.setText(I18n.a("jar.preview.title"));
        this.e.setStyle("-fx-font-weight: bold; -fx-font-size: 13px; -fx-text-fill: #6272a4;");
        this.k = file;
        this.g.setText(file.getAbsolutePath());
        this.g.setStyle("-fx-text-fill: #8be9fd;");
        this.h.setText(I18n.a("jar.statusAnalyzing"));
        this.i.setDisable(true);
        CompletableFuture.runAsync(() -> {
            double d2;
            Object object;
            Object object2;
            Object object3;
            Object object4;
            Object object5;
            ArrayList<h> arrayList = new ArrayList<h>();
            String string = "-";
            int n2 = 0;
            int n3 = 0;
            double d3 = 0.0;
            int n4 = 0;
            try {
                object5 = new ZipFile(file);
                try {
                    Object object6;
                    Object object7;
                    block25: {
                        try {
                            object7 = ((ZipFile)object5).getEntry("META-INF/MANIFEST.MF");
                            if (object7 == null) break block25;
                            object4 = ((ZipFile)object5).getInputStream((ZipEntry)object7);
                            try {
                                object6 = new Manifest((InputStream)object4);
                                object3 = ((Manifest)object6).getMainAttributes();
                                object2 = ((Attributes)object3).getValue("Main-Class");
                                if (object2 != null && !((String)object2).isEmpty()) {
                                    string = (String)object2;
                                }
                            }
                            finally {
                                if (object4 != null) {
                                    ((InputStream)object4).close();
                                }
                            }
                        }
                        catch (Exception exception) {
                            // empty catch block
                        }
                    }
                    object7 = ((ZipFile)object5).entries();
                    Enumeration<? extends ZipEntry> enumeration = (Enumeration<? extends ZipEntry>)object7;
                    while (enumeration.hasMoreElements()) {
                        String string2;
                        object4 = enumeration.nextElement();
                        object6 = ((ZipEntry)object4).getName();
                        object3 = ((String)object6).toLowerCase();
                        long l2 = ((ZipEntry)object4).getCompressedSize();
                        if (l2 < 0L) {
                            l2 = ((ZipEntry)object4).getSize();
                        }
                        if (l2 < 0L) {
                            l2 = 0L;
                        }
                        if (((ZipEntry)object4).isDirectory()) {
                            string2 = "Directory";
                        } else if (((String)object3).startsWith("meta-inf/")) {
                            string2 = "META-INF";
                            ++n3;
                        } else if (((String)object3).endsWith(".class")) {
                            string2 = "Class";
                            ++n2;
                            double d4 = f((String)object6);
                            d3 += d4;
                            ++n4;
                        } else {
                            string2 = "Resource";
                            ++n3;
                        }
                        boolean bl = e((String)object6);
                        object = a(l2);
                        arrayList.add(new h((String)object6, string2, (String)object, l2, bl));
                    }
                }
                finally {
                    ((ZipFile)object5).close();
                }
            }
            catch (Exception exception) {
                String string3 = exception.getMessage();
                Platform.runLater(() -> {
                    this.h.setText(String.format(I18n.a("jar.statusError"), string3));
                    this.i.setDisable(false);
                    this.j = false;
                });
                return;
            }
            object5 = n4 > 0 ? ((d2 = d3 / (double)n4) >= 3.1 && d2 <= 3.5 ? I18n.a("obf.high") : I18n.a("obf.low")) : I18n.a("obf.unknown");
            p.a a2 = scanner.p.a(file);
            object4 = a(file.length());
            boolean bl = file.isHidden();
            object3 = a2.b;
            object2 = arrayList;
            int n5 = n2;
            int n6 = n3;
            Object object8 = object5;
            object = object4;
            boolean bl2 = bl;
            Object object9 = object3;
            String string4 = string;
            int n7 = arrayList.size();
            Object object10 = object2;
            Object object11 = object;
            Platform.runLater(() -> this.a((List)object10, (String)object11, bl2, (String)object9, (String)object8, n7, n5, n6, string4));
        });
    }

    private static boolean e(String string) {
        String[] stringArray;
        if (string == null || string.isEmpty()) {
            return false;
        }
        if (!string.equals(string.trim())) {
            return true;
        }
        for (String string2 : stringArray = string.split("/")) {
            if (string2.isEmpty()) continue;
            if (string2.startsWith(".")) {
                return true;
            }
            if (string2.equals(string2.trim())) continue;
            return true;
        }
        for (int i2 = 0; i2 < string.length(); ++i2) {
            int n2 = string.charAt(i2);
            if (n2 < 32 && n2 != 9) {
                return true;
            }
            if (n2 == 127) {
                return true;
            }
            if (n2 == 8203 || n2 == 8204 || n2 == 8205 || n2 == 65279) {
                return true;
            }
            if (n2 != 8238 && n2 != 8237) continue;
            return true;
        }
        return false;
    }

    private void d() {
        this.l.setText("-");
        this.m.setText("-");
        this.n.setText("-");
        this.o.setText("-");
        this.p.setText("-");
        this.q.setText("-");
        this.r.setText("-");
        this.s.setText("-");
    }

    private static double f(String string) {
        if (string == null || string.isEmpty()) {
            return 0.0;
        }
        int n2 = string.length();
        int[] nArray = new int[256];
        for (int i2 = 0; i2 < n2; ++i2) {
            char c2 = string.charAt(i2);
            if (c2 >= '\u0100') continue;
            char c3 = c2;
            nArray[c3] = nArray[c3] + 1;
        }
        double d2 = 0.0;
        double d3 = n2;
        for (int i3 = 0; i3 < 256; ++i3) {
            if (nArray[i3] <= 0) continue;
            double d4 = (double)nArray[i3] / d3;
            d2 -= d4 * (Math.log(d4) / Math.log(2.0));
        }
        return d2;
    }

    private static String a(long l2) {
        if (l2 < 0L) {
            return "0 B";
        }
        if (l2 < 1024L) {
            return l2 + " B";
        }
        double d2 = (double)l2 / 1024.0;
        if (d2 < 1024.0) {
            return String.format(Locale.US, "%.1f KB", d2);
        }
        double d3 = d2 / 1024.0;
        return String.format(Locale.US, "%.2f MB", d3);
    }

    private static long g(String string) {
        if (string == null || string.isEmpty()) {
            return 0L;
        }
        try {
            string = string.trim();
            if (string.endsWith(" B")) {
                return Long.parseLong(string.replace(" B", "").trim());
            }
            if (string.endsWith(" KB")) {
                return (long)(Double.parseDouble(string.replace(" KB", "").trim()) * 1024.0);
            }
            if (string.endsWith(" MB")) {
                return (long)(Double.parseDouble(string.replace(" MB", "").trim()) * 1024.0 * 1024.0);
            }
        }
        catch (NumberFormatException numberFormatException) {
            // empty catch block
        }
        return 0L;
    }

    private /* synthetic */ void a(List list, String string, boolean bl, String string2, String string3, int n2, int n3, int n4, String string4) {
        this.a.addAll(list);
        this.l.setText(string);
        this.l.setStyle("-fx-font-size: 13px; -fx-font-weight: bold;");
        this.m.setText(bl ? I18n.a("yes") : I18n.a("no"));
        this.m.setStyle(bl ? "-fx-text-fill: #ff4444; -fx-font-size: 13px; -fx-font-weight: bold;" : "-fx-text-fill: #3ddc84; -fx-font-size: 13px; -fx-font-weight: bold;");
        this.n.setText(string2.isEmpty() ? "-" : string2);
        this.n.setStyle(I18n.a("yes").equals(string2) ? "-fx-text-fill: #ff4444; -fx-font-size: 13px; -fx-font-weight: bold;" : "-fx-text-fill: #3ddc84; -fx-font-size: 13px; -fx-font-weight: bold;");
        this.o.setText(string3);
        if (string3.equals(I18n.a("obf.high"))) {
            this.o.setStyle("-fx-text-fill: #ff4444; -fx-font-size: 13px; -fx-font-weight: bold;");
        } else if (string3.equals(I18n.a("obf.low"))) {
            this.o.setStyle("-fx-text-fill: #3ddc84; -fx-font-size: 13px; -fx-font-weight: bold;");
        } else {
            this.o.setStyle("-fx-text-fill: #6272a4; -fx-font-size: 13px; -fx-font-weight: bold;");
        }
        this.p.setText(String.valueOf(n2));
        this.p.setStyle("-fx-font-size: 13px; -fx-font-weight: bold;");
        this.q.setText(String.valueOf(n3));
        this.q.setStyle("-fx-text-fill: #8be9fd; -fx-font-size: 13px; -fx-font-weight: bold;");
        this.r.setText(String.valueOf(n4));
        this.r.setStyle("-fx-font-size: 13px; -fx-font-weight: bold;");
        this.s.setText(string4);
        this.s.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-font-family: monospace;");
        this.h.setText(String.format(I18n.a("jar.statusDone"), n2, n3));
        this.i.setDisable(false);
        this.j = false;
    }

    private static /* synthetic */ String _wcec(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xE1;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1599668627 + 1979437055 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


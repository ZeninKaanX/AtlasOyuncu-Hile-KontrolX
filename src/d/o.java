/*
 * Decompiled with CFR 0.152.
 */
package d;

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
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import scanner.k;
import util.I18n;
import util.a;

public class o
extends VBox {
    private final ObservableList<b.o> a = FXCollections.observableArrayList();
    private final FilteredList<b.o> b;
    private Button c;

    public o() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(I18n.a("recyclebin.btn"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        TableView<b.o> tableView = new TableView<b.o>();
        tableView.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView, Priority.ALWAYS);
        TableColumn tableColumn2 = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("fileName"));
        tableColumn2.setPrefWidth(200.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("recyclebin.col.originalPath"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("originalPath"));
        TableColumn tableColumn4 = new TableColumn(I18n.a("recyclebin.col.drive"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("drive"));
        tableColumn4.setPrefWidth(60.0);
        TableColumn tableColumn5 = new TableColumn(I18n.a("recyclebin.col.sid"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("sid"));
        tableColumn5.setPrefWidth(120.0);
        TableColumn tableColumn6 = new TableColumn(I18n.a("recyclebin.col.hidden"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("hidden"));
        tableColumn6.setPrefWidth(60.0);
        tableColumn6.setCellFactory(tableColumn -> new TableCell<b.o, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("word.yes"))) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _zm(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x7E;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 1890031051 + 1036919329 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn7 = new TableColumn(I18n.a("recyclebin.col.deletionTime"));
        tableColumn7.setCellValueFactory(new PropertyValueFactory("deletionTime"));
        tableColumn7.setPrefWidth(160.0);
        TableColumn tableColumn8 = new TableColumn(I18n.a("mod.col.size"));
        tableColumn8.setCellValueFactory(new PropertyValueFactory("fileSize"));
        tableColumn8.setPrefWidth(100.0);
        TableColumn tableColumn9 = new TableColumn(I18n.a("recyclebin.col.extChanged"));
        tableColumn9.setCellValueFactory(new PropertyValueFactory("extChanged"));
        tableColumn9.setPrefWidth(100.0);
        tableColumn9.setCellFactory(tableColumn -> new TableCell<b.o, String>(){

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

            private static /* synthetic */ String _qjzy(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x37;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 248098589 + 1131177579 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn10 = new TableColumn(I18n.a("recyclebin.col.obfuscation"));
        tableColumn10.setCellValueFactory(new PropertyValueFactory("obfuscation"));
        tableColumn10.setPrefWidth(120.0);
        tableColumn10.setCellFactory(tableColumn -> new TableCell<b.o, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null || string.isEmpty()) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.contains(I18n.a("obf.high"))) {
                        this.setStyle(util.a.a);
                    } else if (string.contains(I18n.a("obf.low"))) {
                        this.setStyle(util.a.b);
                    } else {
                        this.setStyle("-fx-text-fill: #aaa;");
                    }
                }
            }

            private static /* synthetic */ String _qwzj(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xC6;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 849594941 + 1064205903 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        tableView.getColumns().addAll(tableColumn2, tableColumn3, tableColumn7, tableColumn8, tableColumn9, tableColumn10, tableColumn6, tableColumn4, tableColumn5);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        tableView.setFixedCellSize(24.0);
        this.b = new FilteredList<b.o>(this.a, o2 -> true);
        SortedList<b.o> sortedList = new SortedList<b.o>((ObservableList<b.o>)this.b);
        sortedList.comparatorProperty().bind(tableView.comparatorProperty());
        tableView.setItems(sortedList);
        textField.textProperty().addListener((observableValue, string, string2) -> this.b.setPredicate(o2 -> {
            if (string2 == null || string2.isEmpty()) {
                return true;
            }
            String lower = string2.toLowerCase();
            return o2.getFileName() != null && o2.getFileName().toLowerCase().contains(lower) || o2.getOriginalPath() != null && o2.getOriginalPath().toLowerCase().contains(lower);
        }));
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.copyName"));
        menuItem.setOnAction(actionEvent -> {
            b.o o2 = (b.o)tableView.getSelectionModel().getSelectedItem();
            if (o2 != null) {
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(o2.getFileName());
                Clipboard.getSystemClipboard().setContent(clipboardContent);
            }
        });
        MenuItem menuItem2 = new MenuItem(I18n.a("ctx.copyPath"));
        menuItem2.setOnAction(actionEvent -> {
            b.o o2 = (b.o)tableView.getSelectionModel().getSelectedItem();
            if (o2 != null) {
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(o2.getOriginalPath());
                Clipboard.getSystemClipboard().setContent(clipboardContent);
            }
        });
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2});
        tableView.setContextMenu(contextMenu);
        Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        this.c.setOnAction(actionEvent -> {
            this.c.setDisable(true);
            label2.setText(I18n.a("detect.statusScanning"));
            this.a.clear();
            Task<List<b.o>> task = new Task<List<b.o>>(){

                protected List<b.o> call() {
                    return k.a();
                }

            };
            task.setOnSucceeded(workerStateEvent -> {
                List list = (List)task.getValue();
                this.a.addAll(list);
                label2.setText(String.format(I18n.a("recyclebin.statusFound"), list.size()));
                this.c.setDisable(false);
            });
            task.setOnFailed(workerStateEvent -> {
                label2.setText(I18n.a("detect.statusError"));
                this.c.setDisable(false);
            });
            new Thread(task).start();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, tableView, label2});
        I18n.a(() -> {
            this.c.setText(I18n.a("recyclebin.btn"));
            tableColumn2.setText(I18n.a("mod.col.fileName"));
            tableColumn3.setText(I18n.a("recyclebin.col.originalPath"));
            tableColumn7.setText(I18n.a("recyclebin.col.deletionTime"));
            tableColumn8.setText(I18n.a("mod.col.size"));
            tableColumn6.setText(I18n.a("recyclebin.col.hidden"));
            tableColumn9.setText(I18n.a("recyclebin.col.extChanged"));
            tableColumn10.setText(I18n.a("recyclebin.col.obfuscation"));
            menuItem2.setText(I18n.a("ctx.copyPath"));
            tableColumn4.setText(I18n.a("recyclebin.col.drive"));
            tableColumn5.setText(I18n.a("recyclebin.col.sid"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            menuItem.setText(I18n.a("ctx.copyName"));
            label2.setText(I18n.a("script.statusReady"));
            tableView.refresh();
        });
    }

    public void a() {
        this.c.fire();
    }

    public boolean b() {
        return this.c.isDisabled();
    }

    private static /* synthetic */ String _btx(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xE9;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1780298031 + 1257957641 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


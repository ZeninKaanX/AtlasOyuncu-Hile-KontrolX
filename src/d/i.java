/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.g;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
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
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import scanner.FindJVM;
import util.I18n;
import util.a;

public class i
extends VBox {
    private final TableView<g> a;
    private final Label b;
    private final Button c;
    private final ObservableList<g> d = FXCollections.observableArrayList();
    private final FilteredList<g> e;

    public i() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(I18n.a("jvm.btn"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        this.a = new TableView();
        this.a.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        this.a.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        TableColumn tableColumn2 = new TableColumn(I18n.a("jvm.col.pid"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("pid"));
        tableColumn2.setPrefWidth(80.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("jvm.col.process"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("displayName"));
        tableColumn3.setPrefWidth(150.0);
        TableColumn tableColumn4 = new TableColumn(I18n.a("jvm.col.status"));
        tableColumn4.setCellValueFactory(cellDataFeatures -> new SimpleStringProperty(((g)((TableColumn.CellDataFeatures)cellDataFeatures).getValue()).isSuspicious() ? I18n.a("jvm.suspicious") : I18n.a("jvm.clean")));
        tableColumn4.setPrefWidth(120.0);
        tableColumn4.setCellFactory(tableColumn -> new TableCell<g, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (string == null || bl) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (I18n.a("jvm.suspicious").equals(string)) {
                        this.setStyle(util.a.a);
                    } else {
                        this.setStyle(util.a.b);
                    }
                }
            }

            private static /* synthetic */ String _hg(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0xBD;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 668271913 + 1126121899 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn5 = new TableColumn(I18n.a("jvm.col.details"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("detectionDetails"));
        tableColumn5.setPrefWidth(300.0);
        this.a.getColumns().addAll(tableColumn2, tableColumn3, tableColumn4, tableColumn5);
        VBox.setVgrow(this.a, Priority.ALWAYS);
        this.e = new FilteredList<g>(this.d, g2 -> true);
        SortedList<g> sortedList = new SortedList<g>((ObservableList<g>)this.e);
        sortedList.comparatorProperty().bind(this.a.comparatorProperty());
        this.a.setItems(sortedList);
        textField.textProperty().addListener((observableValue, string, string2) -> this.e.setPredicate(g2 -> {
            if (string2 == null || string2.isEmpty()) {
                return true;
            }
            String lower = string2.toLowerCase();
            return g2.getDisplayName() != null && g2.getDisplayName().toLowerCase().contains(lower) || g2.getPid() != null && g2.getPid().toLowerCase().contains(lower) || g2.getDetectionDetails() != null && g2.getDetectionDetails().toLowerCase().contains(lower);
        }));
        this.a.setRowFactory(tableView -> {
            TableRow<g> tableRow = new TableRow<g>(){

                protected void updateItem(g g2, boolean bl) {
                    super.updateItem(g2, bl);
                    if (g2 == null || bl) {
                        this.setStyle("");
                    } else if (g2.isSuspicious()) {
                        this.setStyle(util.a.g);
                    } else {
                        this.setStyle("");
                    }
                }

            };
            ContextMenu contextMenu = new ContextMenu();
            MenuItem menuItem = new MenuItem(I18n.a("jvm.ctx.copyPid"));
            menuItem.setOnAction(actionEvent -> {
                g g2 = (g)tableRow.getItem();
                if (g2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(g2.getPid());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            MenuItem menuItem2 = new MenuItem(I18n.a("jvm.ctx.copyDetails"));
            menuItem2.setOnAction(actionEvent -> {
                g g2 = (g)tableRow.getItem();
                if (g2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(g2.getDetectionDetails());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2});
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        this.b = new Label(I18n.a("script.statusReady"));
        this.b.setStyle(util.a.f);
        this.c.setOnAction(actionEvent -> this.c());
        this.getChildren().addAll((Node[])new Node[]{hBox, this.a, this.b});
        I18n.a(() -> {
            this.c.setText(I18n.a("jvm.btn"));
            tableColumn2.setText(I18n.a("jvm.col.pid"));
            tableColumn3.setText(I18n.a("jvm.col.process"));
            tableColumn4.setText(I18n.a("jvm.col.status"));
            tableColumn5.setText(I18n.a("jvm.col.details"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            this.b.setText(I18n.a("script.statusReady"));
        });
    }

    public void a() {
        this.c.fire();
    }

    public boolean b() {
        return this.c.isDisabled();
    }

    private void c() {
        this.c.setDisable(true);
        this.b.setStyle(util.a.f);
        this.b.setText(I18n.a("jvm.statusScanning"));
        this.d.clear();
        Task<Void> task = new Task<Void>(){

            protected Void call() {
                FindJVM.a(null, g2 -> Platform.runLater(() -> {
                    i.this.d.add((g)g2);
                    boolean bl = i.this.d.stream().anyMatch(g::isSuspicious);
                    if (bl) {
                        i.this.b.setText(String.format(I18n.a("jvm.statusFound"), i.this.d.size()));
                        i.this.b.setStyle(util.a.a);
                    } else {
                        i.this.b.setText(String.format(I18n.a("jvm.statusFound"), i.this.d.size()));
                        i.this.b.setStyle(util.a.f);
                    }
                }));
                return null;
            }

            private static /* synthetic */ String _bv(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x9A;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 1505036593 + 504739387 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        };
        task.setOnSucceeded(workerStateEvent -> {
            if (this.d.isEmpty()) {
                this.b.setText(I18n.a("jvm.noProcess"));
                this.b.setStyle(util.a.f);
            } else {
                boolean bl = this.d.stream().anyMatch(g::isSuspicious);
                if (bl) {
                    this.b.setText(String.format(I18n.a("jvm.statusFound"), this.d.size()));
                    this.b.setStyle(util.a.a);
                } else {
                    this.b.setText(I18n.a("jvm.statusClean"));
                    this.b.setStyle(util.a.a("#3ddc84"));
                }
            }
            this.c.setDisable(false);
        });
        task.setOnFailed(workerStateEvent -> {
            this.b.setText(String.format(I18n.a("detect.errorMsg"), task.getException().getMessage()));
            this.b.setStyle(util.a.a("#ff4444"));
            this.c.setDisable(false);
        });
        new Thread(task).start();
    }

    private static /* synthetic */ String _jrr(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xC7;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1432611067 + 1284107723 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.q;
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
import scanner.m;
import util.I18n;
import util.a;

public class r
extends VBox {
    private final ObservableList<q> a = FXCollections.observableArrayList();
    private final FilteredList<q> b;
    private Button c;

    public r() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(I18n.a("services.btn"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        TableView<q> tableView = new TableView<q>();
        tableView.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView, Priority.ALWAYS);
        TableColumn tableColumn2 = new TableColumn(I18n.a("services.col.name"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("serviceName"));
        TableColumn tableColumn3 = new TableColumn(I18n.a("services.col.displayName"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("displayName"));
        TableColumn tableColumn4 = new TableColumn(I18n.a("services.col.status"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("status"));
        tableColumn4.setCellFactory(tableColumn -> new TableCell<q, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    this.setText(string);
                    if (string.equals(I18n.a("services.running"))) {
                        this.setStyle(util.a.b);
                    } else if (string.equals(I18n.a("services.stopped")) || string.equals(I18n.a("services.notFound"))) {
                        this.setStyle(util.a.e);
                    } else {
                        this.setStyle(util.a.d);
                    }
                }
            }

            private static /* synthetic */ String _gxq(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x43;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 515621545 + 670236511 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn5 = new TableColumn(I18n.a("services.col.pid"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("pid"));
        TableColumn tableColumn6 = new TableColumn(I18n.a("services.col.startTime"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("startTime"));
        tableView.getColumns().addAll(tableColumn2, tableColumn3, tableColumn4, tableColumn5, tableColumn6);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        this.b = new FilteredList<q>(this.a, q2 -> true);
        SortedList<q> sortedList = new SortedList<q>((ObservableList<q>)this.b);
        sortedList.comparatorProperty().bind(tableView.comparatorProperty());
        tableView.setItems(sortedList);
        textField.textProperty().addListener((observableValue, string, string2) -> this.b.setPredicate(q2 -> {
            String[] stringArray;
            if (string2 == null || string2.trim().isEmpty()) {
                return true;
            }
            for (String s : stringArray = string2.toLowerCase().split("\\|")) {
                String string3 = s.trim();
                if (string3.isEmpty() || !(q2.getServiceName() != null && q2.getServiceName().toLowerCase().contains(string3) || q2.getDisplayName() != null && q2.getDisplayName().toLowerCase().contains(string3)) && (q2.getStatus() == null || !q2.getStatus().toLowerCase().contains(string3))) continue;
                return true;
            }
            return false;
        }));
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.copyName"));
        menuItem.setOnAction(actionEvent -> {
            q q2 = (q)tableView.getSelectionModel().getSelectedItem();
            if (q2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(q2.getServiceName());
                clipboard.setContent(clipboardContent);
            }
        });
        MenuItem menuItem2 = new MenuItem(I18n.a("services.ctx.copyPid"));
        menuItem2.setOnAction(actionEvent -> {
            q q2 = (q)tableView.getSelectionModel().getSelectedItem();
            if (q2 != null && !q2.getPid().isEmpty()) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(q2.getPid());
                clipboard.setContent(clipboardContent);
            }
        });
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2});
        tableView.setContextMenu(contextMenu);
        Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        this.c.setOnAction(actionEvent -> {
            this.c.setDisable(true);
            label2.setText(I18n.a("services.statusScanning"));
            this.a.clear();
            Task<List<q>> task = new Task<List<q>>(){

                protected List<q> call() {
                    return m.a();
                }

            };
            task.setOnSucceeded(workerStateEvent -> {
                List list = (List)task.getValue();
                this.a.addAll(list);
                label2.setText(String.format(I18n.a("services.statusFound"), list.size()));
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
            this.c.setText(I18n.a("services.btn"));
            tableColumn2.setText(I18n.a("services.col.name"));
            tableColumn3.setText(I18n.a("services.col.displayName"));
            tableColumn4.setText(I18n.a("services.col.status"));
            tableColumn5.setText(I18n.a("services.col.pid"));
            tableColumn6.setText(I18n.a("services.col.startTime"));
            menuItem.setText(I18n.a("ctx.copyName"));
            menuItem2.setText(I18n.a("services.ctx.copyPid"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
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

    private static /* synthetic */ String _gpke(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x68;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1061811191 + 1675731265 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


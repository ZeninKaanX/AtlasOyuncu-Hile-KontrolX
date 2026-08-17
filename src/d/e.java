/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.c;
import java.io.File;
import java.util.List;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Alert;
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
import scanner.d;
import util.I18n;
import util.a;

public class e
extends VBox {
    private final ObservableList<c> a = FXCollections.observableArrayList();
    private final FilteredList<c> b;
    private Button c;

    public e() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(I18n.a("crashdumps.btn"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Button button = new Button(I18n.a("btn.openFolder"));
        button.getStyleClass().addAll((String[])new String[]{"success"});
        button.setOnAction(actionEvent -> {
            String string = System.getenv("LOCALAPPDATA");
            File file = new File(string, "CrashDumps");
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
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, button, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        TableView<c> tableView = new TableView<c>();
        tableView.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView, Priority.ALWAYS);
        TableColumn tableColumn2 = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("fileName"));
        tableColumn2.setPrefWidth(250.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("mod.col.filePath"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("path"));
        tableColumn3.setPrefWidth(400.0);
        TableColumn tableColumn4 = new TableColumn(I18n.a("mod.col.hidden"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("isHidden"));
        tableColumn4.setCellFactory(tableColumn -> new TableCell<c, String>(){

            protected void updateItem(String string, boolean bl) {
                super.updateItem(string, bl);
                if (bl || string == null) {
                    this.setText(null);
                    this.setStyle("");
                } else {
                    String string2 = I18n.a("yes").equals(string) || I18n.a("hidden.yes").equals(string) ? I18n.a("hidden.yes") : I18n.a("hidden.no");
                    this.setText(string2);
                    this.setStyle(I18n.a("hidden.yes").equals(string2) ? util.a.a : util.a.b);
                }
            }

            private static /* synthetic */ String _qzft(String string, int n2) {
                if (string != null) {
                    char[] cArray = string.toCharArray();
                    int n3 = n2 ^ 0x53;
                    int n4 = 0;
                    while (n4 < cArray.length) {
                        n3 = n3 * 304726941 + 430652855 & Integer.MAX_VALUE;
                        int n5 = n4++;
                        cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                    }
                    return new String(cArray);
                }
                return null;
            }
        });
        TableColumn tableColumn5 = new TableColumn(I18n.a("mod.col.size"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("size"));
        TableColumn tableColumn6 = new TableColumn(I18n.a("eventlog.col.time"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("creationTime"));
        tableView.getColumns().addAll(tableColumn2, tableColumn3, tableColumn4, tableColumn5, tableColumn6);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        this.b = new FilteredList<c>(this.a, c2 -> true);
        SortedList<c> sortedList = new SortedList<c>((ObservableList<c>)this.b);
        sortedList.comparatorProperty().bind(tableView.comparatorProperty());
        tableView.setItems(sortedList);
        textField.textProperty().addListener((observableValue, string, string2) -> this.b.setPredicate(c2 -> {
            if (string2 == null || string2.isEmpty()) {
                return true;
            }
            String lower = string2.toLowerCase();
            return c2.getFileName() != null && c2.getFileName().toLowerCase().contains(lower) || c2.getPath() != null && c2.getPath().toLowerCase().contains(lower);
        }));
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.openFolder"));
        menuItem.setOnAction(actionEvent -> {
            c c2 = (c)tableView.getSelectionModel().getSelectedItem();
            if (c2 != null) {
                try {
                    File file = new File(c2.getPath());
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
            c c2 = (c)tableView.getSelectionModel().getSelectedItem();
            if (c2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(c2.getFileName());
                clipboard.setContent(clipboardContent);
            }
        });
        MenuItem menuItem3 = new MenuItem(I18n.a("ctx.copyPath"));
        menuItem3.setOnAction(actionEvent -> {
            c c2 = (c)tableView.getSelectionModel().getSelectedItem();
            if (c2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(c2.getPath());
                clipboard.setContent(clipboardContent);
            }
        });
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3});
        tableView.setContextMenu(contextMenu);
        Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        this.c.setOnAction(actionEvent -> {
            this.c.setDisable(true);
            label2.setText(I18n.a("crashdumps.statusScanning"));
            this.a.clear();
            Task<List<c>> task = new Task<List<c>>(){

                protected List<c> call() {
                    return d.a();
                }

            };
            task.setOnSucceeded(workerStateEvent -> {
                List list = (List)task.getValue();
                this.a.addAll(list);
                label2.setText(String.format(I18n.a("crashdumps.statusFound"), list.size()));
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
            this.c.setText(I18n.a("crashdumps.btn"));
            button.setText(I18n.a("btn.openFolder"));
            tableColumn2.setText(I18n.a("mod.col.fileName"));
            tableColumn3.setText(I18n.a("mod.col.filePath"));
            tableColumn4.setText(I18n.a("mod.col.hidden"));
            tableColumn5.setText(I18n.a("mod.col.size"));
            tableColumn6.setText(I18n.a("eventlog.col.time"));
            menuItem.setText(I18n.a("ctx.openFolder"));
            menuItem2.setText(I18n.a("ctx.copyName"));
            menuItem3.setText(I18n.a("ctx.copyPath"));
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

    private static /* synthetic */ String _tr(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x3E;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 2118379937 + 365403491 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


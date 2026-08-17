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
import scanner.j;
import util.I18n;
import util.a;

public class n
extends VBox {
    private final ObservableList<b.n> a = FXCollections.observableArrayList();
    private final FilteredList<b.n> b;
    private Button c;

    public n() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(I18n.a("recent.btn"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        TableView<b.n> tableView2 = new TableView<b.n>();
        tableView2.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView2, Priority.ALWAYS);
        TableColumn tableColumn = new TableColumn(I18n.a("mod.col.fileName"));
        tableColumn.setCellValueFactory(new PropertyValueFactory("fileName"));
        tableColumn.setPrefWidth(900.0);
        tableView2.getColumns().add(tableColumn);
        tableView2.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        this.b = new FilteredList<b.n>(this.a, n2 -> true);
        SortedList<b.n> sortedList = new SortedList<b.n>((ObservableList<b.n>)this.b);
        sortedList.comparatorProperty().bind(tableView2.comparatorProperty());
        tableView2.setItems(sortedList);
        textField.textProperty().addListener((observableValue, string, string2) -> this.b.setPredicate(n2 -> {
            String[] stringArray;
            if (string2 == null || string2.trim().isEmpty()) {
                return true;
            }
            for (String s : stringArray = string2.toLowerCase().split("\\|")) {
                String string3 = s.trim();
                if (string3.isEmpty() || n2.getFileName() == null || !n2.getFileName().toLowerCase().contains(string3)) continue;
                return true;
            }
            return false;
        }));
        tableView2.setRowFactory(tableView -> new TableRow<b.n>(){

            protected void updateItem(b.n n2, boolean bl) {
                super.updateItem(n2, bl);
                this.setStyle("");
            }

        });
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.copyName"));
        menuItem.setOnAction(actionEvent -> {
            b.n n2 = (b.n)tableView2.getSelectionModel().getSelectedItem();
            if (n2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(n2.getFileName());
                clipboard.setContent(clipboardContent);
            }
        });
        contextMenu.getItems().add(menuItem);
        tableView2.setContextMenu(contextMenu);
        Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        this.c.setOnAction(actionEvent -> {
            this.c.setDisable(true);
            label2.setText(I18n.a("recent.statusScanning"));
            this.a.clear();
            Task<List<b.n>> task = new Task<List<b.n>>(){

                protected List<b.n> call() {
                    return j.a();
                }

            };
            task.setOnSucceeded(workerStateEvent -> {
                List list = (List)task.getValue();
                this.a.addAll(list);
                label2.setText(String.format(I18n.a("recent.statusFound"), list.size()));
                this.c.setDisable(false);
            });
            task.setOnFailed(workerStateEvent -> {
                label2.setText(I18n.a("detect.statusError"));
                this.c.setDisable(false);
            });
            new Thread(task).start();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, tableView2, label2});
        I18n.a(() -> {
            this.c.setText(I18n.a("recent.btn"));
            tableColumn.setText(I18n.a("mod.col.fileName"));
            menuItem.setText(I18n.a("ctx.copyName"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            label2.setText(I18n.a("script.statusReady"));
            tableView2.refresh();
        });
    }

    public void a() {
        this.c.fire();
    }

    public boolean b() {
        return this.c.isDisabled();
    }

    private static /* synthetic */ String _dda(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xEF;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 412876241 + 462016583 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


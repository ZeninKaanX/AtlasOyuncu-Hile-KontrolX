/*
 * Decompiled with CFR 0.152.
 */
package d;

import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
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
import util.I18n;

public class a
extends VBox {
    private final TableView<b.a> a;
    private final ObservableList<b.a> b;
    private final FilteredList<b.a> c;
    private final TextField d;
    private final Button e;
    private final Label f;
    private final scanner.a g;
    private TableColumn<b.a, String> h;
    private TableColumn<b.a, String> i;
    private TableColumn<b.a, String> j;

    public a() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.g = new scanner.a();
        this.b = FXCollections.observableArrayList();
        this.c = new FilteredList<b.a>(this.b, a2 -> true);
        this.e = new Button("\ud83d\udd0d " + I18n.a("alt.btn.analyze"));
        this.e.getStyleClass().addAll((String[])new String[]{"accent"});
        this.e.setOnAction(actionEvent -> this.a());
        Label label = new Label("\ud83d\udd0d");
        this.d = new TextField();
        this.d.setPromptText(I18n.a("alt.searchPrompt"));
        HBox.setHgrow(this.d, Priority.ALWAYS);
        this.d.textProperty().addListener((observableValue, string, string2) -> {
            this.c.setPredicate(a2 -> {
                if (string2 == null || string2.trim().isEmpty()) {
                    return true;
                }
                String lower = string2.trim().toLowerCase();
                return a2.getUsername().toLowerCase().contains(lower) || a2.getSource().toLowerCase().contains(lower) || a2.getType().toLowerCase().contains(lower);
            });
            this.d();
        });
        HBox hBox = new HBox(10.0, this.e, label, this.d);
        hBox.setAlignment(Pos.CENTER_LEFT);
        this.a = new TableView();
        this.a.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        this.a.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        VBox.setVgrow(this.a, Priority.ALWAYS);
        this.h = new TableColumn(I18n.a("alt.col.username"));
        this.h.setCellValueFactory(new PropertyValueFactory("username"));
        this.i = new TableColumn(I18n.a("alt.col.source"));
        this.i.setCellValueFactory(new PropertyValueFactory("source"));
        this.j = new TableColumn(I18n.a("alt.col.type"));
        this.j.setCellValueFactory(new PropertyValueFactory("type"));
        this.j.setPrefWidth(100.0);
        this.j.setMaxWidth(150.0);
        this.a.getColumns().addAll(this.h, this.i, this.j);
        SortedList<b.a> sortedList = new SortedList<b.a>((ObservableList<b.a>)this.c);
        sortedList.comparatorProperty().bind(this.a.comparatorProperty());
        this.a.setItems(sortedList);
        this.a.setRowFactory(tableView -> {
            TableRow tableRow = new TableRow();
            ContextMenu contextMenu = new ContextMenu();
            MenuItem menuItem = new MenuItem(I18n.a("alt.ctx.copyUsername"));
            menuItem.setOnAction(actionEvent -> {
                b.a a2 = (b.a)tableRow.getItem();
                if (a2 != null) {
                    ClipboardContent clipboardContent = new ClipboardContent();
                    clipboardContent.putString(a2.getUsername());
                    Clipboard.getSystemClipboard().setContent(clipboardContent);
                }
            });
            contextMenu.getItems().add(menuItem);
            tableRow.emptyProperty().addListener((observableValue, bl, bl2) -> tableRow.setContextMenu(bl2 != false ? null : contextMenu));
            return tableRow;
        });
        this.f = new Label(I18n.a("alt.statusReady"));
        this.f.setStyle(util.a.f);
        this.getChildren().addAll((Node[])new Node[]{hBox, this.a, this.f});
        I18n.a(() -> {
            this.e.setText("\ud83d\udd0d " + I18n.a("alt.btn.analyze"));
            this.d.setPromptText(I18n.a("alt.searchPrompt"));
            this.h.setText(I18n.a("alt.col.username"));
            this.i.setText(I18n.a("alt.col.source"));
            this.j.setText(I18n.a("alt.col.type"));
            this.d();
        });
    }

    public void a() {
        this.e.setDisable(true);
        this.f.setText(I18n.a("alt.status.checking"));
        Thread thread = new Thread(() -> {
            this.g.a(this.b);
            Platform.runLater(() -> {
                this.e.setDisable(false);
                this.d();
            });
        });
        thread.setDaemon(true);
        thread.start();
    }

    public void b() {
        if (!this.e.isDisabled()) {
            this.a();
        }
    }

    public boolean c() {
        return this.e.isDisabled();
    }

    private void d() {
        if (!this.b.isEmpty()) {
            this.f.setText(String.format("%s: %d", I18n.a("alt.statusReady"), this.c.size()));
        } else {
            this.f.setText(I18n.a("alt.statusReady"));
        }
    }

    private static /* synthetic */ String _ly(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xEE;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 845268489 + 112439475 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


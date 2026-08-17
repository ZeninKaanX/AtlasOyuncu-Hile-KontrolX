/*
 * Decompiled with CFR 0.152.
 */
package d;

import java.util.Collection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Orientation;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.SplitPane;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import scanner.h;
import util.I18n;
import util.a;

public class k
extends VBox {
    private final Button a;
    private final Label b;
    private final ObservableList<b.k> c = FXCollections.observableArrayList();
    private final ObservableList<b.k> d = FXCollections.observableArrayList();
    private final FilteredList<b.k> e;
    private final FilteredList<b.k> f;
    private final TableView<b.k> g;
    private final TableView<b.k> h;
    private final TextArea i;
    private final TableColumn<b.k, String> j;
    private final TableColumn<b.k, String> k;
    private final TableColumn<b.k, String> l;
    private final TableColumn<b.k, String> m;
    private final TableColumn<b.k, String> n;
    private final TableColumn<b.k, String> o;
    private final TableColumn<b.k, String> p;
    private final TableColumn<b.k, String> q;
    private final Tab r;
    private final Tab s;

    public k(boolean bl) {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.a = new Button(I18n.a("pseventlog.btn"));
        this.a.getStyleClass().add("accent");
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.a, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        this.g = this.c();
        this.j = this.a("pseventlog.col.time", "timeCreated", 160.0);
        this.k = this.a("pseventlog.col.id", "eventId", 55.0);
        this.l = this.a("pseventlog.col.channel", "channel", 240.0);
        this.m = this.a("pseventlog.col.message", "message", 0.0);
        this.g.getColumns().addAll(this.j, this.k, this.l, this.m);
        this.e = new FilteredList<b.k>(this.c, k2 -> true);
        SortedList<b.k> sortedList = new SortedList<b.k>((ObservableList<b.k>)this.e);
        sortedList.comparatorProperty().bind(this.g.comparatorProperty());
        this.g.setItems(sortedList);
        this.h = this.c();
        this.n = this.a("pseventlog.col.time", "timeCreated", 160.0);
        this.o = this.a("pseventlog.col.id", "eventId", 55.0);
        this.p = this.a("pseventlog.col.channel", "channel", 240.0);
        this.q = this.a("pseventlog.col.message", "message", 0.0);
        this.h.getColumns().addAll(this.n, this.o, this.p, this.q);
        this.f = new FilteredList<b.k>(this.d, k2 -> true);
        SortedList<b.k> sortedList2 = new SortedList<b.k>((ObservableList<b.k>)this.f);
        sortedList2.comparatorProperty().bind(this.h.comparatorProperty());
        this.h.setItems(sortedList2);
        this.i = new TextArea();
        this.i.setEditable(false);
        this.i.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        this.i.setPromptText(I18n.a("pseventlog.detail.prompt"));
        this.i.setPrefHeight(180.0);
        this.g.getSelectionModel().selectedItemProperty().addListener((observableValue, k2, k3) -> {
            if (k3 != null) {
                this.i.setText(k3.getScriptContent());
            }
        });
        this.h.getSelectionModel().selectedItemProperty().addListener((observableValue, k2, k3) -> {
            if (k3 != null) {
                this.i.setText(k3.getScriptContent());
            }
        });
        VBox vBox = new VBox(this.g);
        vBox.setPadding(new Insets(5.0));
        VBox.setVgrow(this.g, Priority.ALWAYS);
        VBox vBox2 = new VBox(this.h);
        vBox2.setPadding(new Insets(5.0));
        VBox.setVgrow(this.h, Priority.ALWAYS);
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        this.r = new Tab(I18n.a("pseventlog.tab.suspicious"), vBox);
        this.s = new Tab(I18n.a("pseventlog.tab.all"), vBox2);
        tabPane.getTabs().addAll((Tab[])new Tab[]{this.r, this.s});
        VBox.setVgrow(tabPane, Priority.ALWAYS);
        SplitPane splitPane = new SplitPane();
        splitPane.setOrientation(Orientation.VERTICAL);
        splitPane.getItems().addAll((Node[])new Node[]{tabPane, this.i});
        splitPane.setDividerPositions(0.72);
        VBox.setVgrow(splitPane, Priority.ALWAYS);
        this.b = new Label(I18n.a("script.statusReady"));
        this.b.setStyle(util.a.f);
        textField.textProperty().addListener((observableValue, string, string2) -> {
            String string3 = string2 == null ? "" : string2.trim().toLowerCase();
            this.a(this.e, string3);
            this.a(this.f, string3);
        });
        this.a.setOnAction(actionEvent -> this.b());
        if (bl) {
            this.getChildren().add(splitPane);
        } else {
            this.getChildren().addAll((Node[])new Node[]{hBox, splitPane, this.b});
        }
        I18n.a(() -> {
            this.a.setText(I18n.a("pseventlog.btn"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            this.i.setPromptText(I18n.a("pseventlog.detail.prompt"));
            this.r.setText(I18n.a("pseventlog.tab.suspicious"));
            this.s.setText(I18n.a("pseventlog.tab.all"));
            this.b.setText(I18n.a("script.statusReady"));
            this.j.setText(I18n.a("pseventlog.col.time"));
            this.k.setText(I18n.a("pseventlog.col.id"));
            this.l.setText(I18n.a("pseventlog.col.channel"));
            this.m.setText(I18n.a("pseventlog.col.message"));
            this.n.setText(I18n.a("pseventlog.col.time"));
            this.o.setText(I18n.a("pseventlog.col.id"));
            this.p.setText(I18n.a("pseventlog.col.channel"));
            this.q.setText(I18n.a("pseventlog.col.message"));
            this.g.refresh();
            this.h.refresh();
        });
    }

    private void b() {
        this.a.setDisable(true);
        this.b.setText(I18n.a("pseventlog.statusScanning"));
        this.c.clear();
        this.d.clear();
        this.i.clear();
        Task<h.a> task = new Task<h.a>(){

            protected h.a call() {
                return scanner.h.a();
            }

        };
        task.setOnSucceeded(workerStateEvent -> {
            h.a a2 = (h.a)task.getValue();
            this.c.addAll((Collection<b.k>)a2.b);
            this.d.addAll((Collection<b.k>)a2.a);
            if (a2.a.isEmpty()) {
                this.b.setText(I18n.a("pseventlog.statusNoMatch"));
            } else {
                this.b.setText(String.format(I18n.a("pseventlog.statusFound"), a2.a.size(), a2.b.size()));
            }
            this.a.setDisable(false);
        });
        task.setOnFailed(workerStateEvent -> {
            this.b.setText(I18n.a("detect.statusError"));
            task.getException().printStackTrace();
            this.a.setDisable(false);
        });
        new Thread(task).start();
    }

    private TableView<b.k> c() {
        TableView<b.k> tableView = new TableView<b.k>();
        tableView.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        VBox.setVgrow(tableView, Priority.ALWAYS);
        return tableView;
    }

    private TableColumn<b.k, String> a(String string, String string2, double d2) {
        TableColumn<b.k, String> tableColumn = new TableColumn<b.k, String>(I18n.a(string));
        tableColumn.setCellValueFactory(new PropertyValueFactory(string2));
        if (d2 > 0.0) {
            tableColumn.setPrefWidth(d2);
        }
        return tableColumn;
    }

    private void a(FilteredList<b.k> filteredList, String string) {
        filteredList.setPredicate(k2 -> {
            String[] stringArray;
            if (string.isEmpty()) {
                return true;
            }
            for (String string2 : stringArray = string.split("\\|")) {
                String string3 = string2.trim();
                if (string3.isEmpty() || !(k2.getMessage() != null && k2.getMessage().toLowerCase().contains(string3) || k2.getChannel() != null && k2.getChannel().toLowerCase().contains(string3) || k2.getEventId() != null && k2.getEventId().toLowerCase().contains(string3)) && (k2.getScriptContent() == null || !k2.getScriptContent().toLowerCase().contains(string3))) continue;
                return true;
            }
            return false;
        });
    }

    public void a() {
        this.a.fire();
    }

    private static /* synthetic */ String _hvu(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x40;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 642716317 + 739771347 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


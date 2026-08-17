/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.p;
import b.s;
import java.awt.Desktop;
import java.io.File;
import java.io.InputStream;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import javafx.animation.PauseTransition;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.CheckBox;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.Control;
import javafx.scene.control.CustomMenuItem;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.image.Image;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.Duration;
import scanner.q;
import util.I18n;
import util.a;

public class v
extends VBox {
    private final List<s> a = new ArrayList<s>();
    private final ObservableList<s> b = FXCollections.observableArrayList();
    private TextField c;
    private MenuButton d;
    private final List<CheckBox> e = new ArrayList<CheckBox>();
    private Thread f = null;
    private Button g;

    public v() {
        Region region;
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.g = new Button(I18n.a("usn.btn"));
        this.g.getStyleClass().addAll((String[])new String[]{"accent"});
        this.c = new TextField();
        this.c.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(this.c, Priority.ALWAYS);
        Label label = new Label("\ud83d\udd0d");
        this.d = new MenuButton(I18n.a("usn.templates"));
        CheckBox checkBox = new CheckBox(I18n.a("class.selectAll"));
        checkBox.setStyle("-fx-font-weight: bold; -fx-padding: 0 0 10 10;");
        GridPane gridPane = new GridPane();
        gridPane.setHgap(15.0);
        gridPane.setVgap(10.0);
        gridPane.setPadding(new Insets(10.0));
        List<p> list = p.getUSNTemplates();
        int n2 = 0;
        int n3 = 0;
        for (p object2 : list) {
            region = new CheckBox(object2.getDisplayName());
            region.setUserData(object2.getValue());
            this.e.add((CheckBox)region);
            gridPane.add(region, n2, n3);
            if (++n2 < 3) continue;
            n2 = 0;
            ++n3;
        }
        VBox vBox = new VBox(5.0, gridPane);
        CustomMenuItem customMenuItem = new CustomMenuItem(vBox);
        customMenuItem.setHideOnClick(false);
        this.d.getItems().add(customMenuItem);
        region = new HBox(10.0, this.g, label, this.c, this.d, checkBox);
        ((HBox)region).setAlignment(Pos.CENTER_LEFT);
        TableView<s> tableView = new TableView<s>();
        tableView.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView, Priority.ALWAYS);
        TableColumn tableColumn = new TableColumn(I18n.a("usn.col.usn"));
        tableColumn.setCellValueFactory(new PropertyValueFactory("usn"));
        tableColumn.setPrefWidth(120.0);
        TableColumn tableColumn2 = new TableColumn(I18n.a("usn.col.name"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("fileName"));
        tableColumn2.setPrefWidth(300.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("usn.col.date"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("timestamp"));
        tableColumn3.setPrefWidth(180.0);
        TableColumn tableColumn4 = new TableColumn(I18n.a("usn.col.reason"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("reason"));
        tableColumn4.setPrefWidth(350.0);
        TableColumn tableColumn5 = new TableColumn(I18n.a("usn.col.path"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("folderPath"));
        tableColumn5.setPrefWidth(250.0);
        TableColumn tableColumn6 = new TableColumn(I18n.a("usn.col.attr"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("fileAttributes"));
        tableColumn6.setPrefWidth(120.0);
        tableView.getColumns().add(tableColumn);
        tableView.getColumns().add(tableColumn2);
        tableView.getColumns().add(tableColumn3);
        tableView.getColumns().add(tableColumn4);
        tableView.getColumns().add(tableColumn5);
        tableView.getColumns().add(tableColumn6);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        tableView.setFixedCellSize(24.0);
        tableView.setItems(this.b);
        boolean[] blArray = new boolean[]{false};
        Runnable runnable = () -> {
            Object object;
            String string = this.c.getText();
            if (string == null) {
                string = "";
            }
            HashSet<String> hashSet = new HashSet<String>();
            LinkedHashSet<String> linkedHashSet = new LinkedHashSet<String>();
            if (blArray[0]) {
                HashSet<String> templateValues = new HashSet<String>();
                for (CheckBox cb : this.e) {
                    for (String string2 : ((String)cb.getUserData()).split("\\|")) {
                        if (string2.trim().isEmpty()) continue;
                        templateValues.add(string2.trim().toLowerCase());
                    }
                }
                for (String string3 : string.split("\\|")) {
                    String string4 = string3.trim();
                    if (!string4.isEmpty() && !templateValues.contains(string4.toLowerCase())) {
                        linkedHashSet.add(string4);
                    }
                }
                StringBuilder stringBuilder = new StringBuilder();
                for (String string4 : linkedHashSet) {
                    if (stringBuilder.length() > 0) {
                        stringBuilder.append("|");
                    }
                    stringBuilder.append(string4);
                }
                for (CheckBox cb : this.e) {
                    if (!cb.isSelected()) continue;
                    String string5 = (String)cb.getUserData();
                    if (stringBuilder.length() > 0) {
                        stringBuilder.append("|");
                    }
                    stringBuilder.append(string5);
                    for (String string6 : string5.split("\\|")) {
                        if (string6.trim().isEmpty()) continue;
                        hashSet.add(string6.trim().toLowerCase());
                    }
                }
                String string7 = stringBuilder.toString();
                if (!string7.equals(string)) {
                    this.c.setText(string7);
                    this.c.positionCaret(string7.length());
                }
            } else {
                for (String string7 : string.split("\\|")) {
                    String string8 = string7.trim();
                    if (string8.isEmpty()) continue;
                    linkedHashSet.add(string8);
                }
                for (CheckBox cb : this.e) {
                    if (!cb.isSelected()) continue;
                    String string8 = (String)cb.getUserData();
                    for (String string9 : string8.split("\\|")) {
                        if (string9.trim().isEmpty()) continue;
                        hashSet.add(string9.trim().toLowerCase());
                    }
                }
            }
            if (this.f != null && this.f.isAlive()) {
                this.f.interrupt();
            }
            object = linkedHashSet;
            HashSet<String> hashSet2 = hashSet;
            this.f = new Thread(() -> this.a((Set)object, hashSet2));
            this.f.setDaemon(true);
            this.f.start();
        };
        boolean[] blArray2 = new boolean[]{false};
        Runnable runnable2 = () -> {
            if (blArray2[0]) {
                return;
            }
            blArray[0] = true;
            try {
                runnable.run();
                checkBox.setSelected(this.e.stream().allMatch(CheckBox::isSelected));
            }
            finally {
                blArray[0] = false;
                blArray2[0] = false;
            }
        };
        checkBox.setOnAction(actionEvent -> {
            if (blArray2[0]) {
                return;
            }
            blArray[0] = true;
            blArray2[0] = true;
            try {
                boolean bl = checkBox.isSelected();
                for (CheckBox checkBox2 : this.e) {
                    checkBox2.setSelected(bl);
                }
                runnable.run();
            }
            finally {
                blArray[0] = false;
                blArray2[0] = false;
            }
        });
        PauseTransition pauseTransition = new PauseTransition(Duration.millis(300.0));
        this.c.textProperty().addListener((observableValue, string, string2) -> {
            if (blArray2[0]) {
                return;
            }
            pauseTransition.setOnFinished(actionEvent -> runnable2.run());
            pauseTransition.playFromStart();
        });
        for (CheckBox checkBox2 : this.e) {
            checkBox2.setOnAction(actionEvent -> {
                blArray[0] = true;
                runnable2.run();
            });
        }
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.copyName"));
        menuItem.setOnAction(actionEvent -> {
            s s2 = (s)tableView.getSelectionModel().getSelectedItem();
            if (s2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(s2.getFileName());
                clipboard.setContent(clipboardContent);
            }
        });
        MenuItem menuItem2 = new MenuItem(I18n.a("ctx.fileHistory"));
        menuItem2.setOnAction(actionEvent -> {
            s s2 = (s)tableView.getSelectionModel().getSelectedItem();
            if (s2 != null) {
                this.a(s2);
            }
        });
        MenuItem menuItem3 = new MenuItem(I18n.a("ctx.openFolder"));
        menuItem3.setOnAction(actionEvent -> {
            String string;
            s s2 = (s)tableView.getSelectionModel().getSelectedItem();
            if (s2 != null && (string = s2.getFolderPath()) != null && !string.trim().isEmpty()) {
                try {
                    File file = new File(string);
                    if (file.exists()) {
                        Desktop.getDesktop().open(file);
                    }
                }
                catch (Exception exception) {
                    exception.printStackTrace();
                }
            }
        });
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2, menuItem3});
        tableView.setContextMenu(contextMenu);
        Label label2 = new Label(I18n.a("class.statusReady"));
        label2.setStyle(util.a.f);
        this.g.setOnAction(actionEvent -> {
            this.g.setDisable(true);
            label2.setText(I18n.a("usn.statusReading"));
            this.a.clear();
            this.b.clear();
            CompletableFuture.runAsync(() -> {
                try {
                    ArrayList arrayList = new ArrayList();
                    for (File file : File.listRoots()) {
                        String string = file.getPath();
                        if (string.length() < 2 || string.charAt(1) != ':') continue;
                        q.a(string.charAt(0), arrayList::add);
                    }
                    Platform.runLater(() -> {
                        this.a.addAll(arrayList);
                        label2.setText(String.format(I18n.a("usn.statusReadSuccess"), arrayList.size(), LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))));
                        this.g.setDisable(false);
                        runnable.run();
                    });
                }
                catch (Exception exception) {
                    Platform.runLater(() -> {
                        label2.setText(String.format(I18n.a("usn.statusReadFail"), exception.getMessage()));
                        this.g.setDisable(false);
                    });
                }
            });
        });
        this.getChildren().addAll((Node[])new Node[]{region, tableView, label2});
        I18n.a(() -> {
            tableColumn.setText(I18n.a("usn.col.usn"));
            tableColumn2.setText(I18n.a("usn.col.name"));
            tableColumn3.setText(I18n.a("usn.col.date"));
            tableColumn4.setText(I18n.a("usn.col.reason"));
            tableColumn5.setText(I18n.a("usn.col.path"));
            tableColumn6.setText(I18n.a("usn.col.attr"));
            menuItem.setText(I18n.a("ctx.copyName"));
            menuItem2.setText(I18n.a("ctx.fileHistory"));
            menuItem3.setText(I18n.a("ctx.openFolder"));
            this.c.setPromptText(I18n.a("mod.searchPrompt"));
            this.g.setText(I18n.a("usn.btn"));
            this.d.setText(I18n.a("usn.templates"));
            checkBox.setText(I18n.a("class.selectAll"));
            label2.setText(I18n.a("class.statusReady"));
            tableView.refresh();
        });
    }

    private void a(s s2) {
        Object object2;
        Dialog dialog = new Dialog();
        dialog.setTitle("\ud83d\udcc4 " + I18n.a("ctx.fileHistory") + " - " + s2.getFileName());
        dialog.setHeaderText(null);
        try {
            object2 = this.getClass().getResourceAsStream("/assets/icon.png");
            if (object2 != null) {
                ((Stage)dialog.getDialogPane().getScene().getWindow()).getIcons().add(new Image((InputStream)object2));
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        object2 = new TableView();
        ((Node)object2).getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        ((Region)object2).setPrefSize(1000.0, 400.0);
        TableColumn tableColumn = new TableColumn(I18n.a("usn.col.usn"));
        tableColumn.setCellValueFactory(new PropertyValueFactory("usn"));
        tableColumn.setPrefWidth(120.0);
        TableColumn tableColumn2 = new TableColumn(I18n.a("usn.col.name"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("fileName"));
        tableColumn2.setPrefWidth(300.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("usn.col.date"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("timestamp"));
        tableColumn3.setPrefWidth(180.0);
        TableColumn tableColumn4 = new TableColumn(I18n.a("usn.col.reason"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("reason"));
        tableColumn4.setPrefWidth(350.0);
        TableColumn tableColumn5 = new TableColumn(I18n.a("usn.col.path"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("folderPath"));
        tableColumn5.setPrefWidth(250.0);
        TableColumn tableColumn6 = new TableColumn(I18n.a("usn.col.attr"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("fileAttributes"));
        tableColumn6.setPrefWidth(120.0);
        ((TableView)object2).getColumns().add(tableColumn);
        ((TableView)object2).getColumns().add(tableColumn2);
        ((TableView)object2).getColumns().add(tableColumn3);
        ((TableView)object2).getColumns().add(tableColumn4);
        ((TableView)object2).getColumns().add(tableColumn5);
        ((TableView)object2).getColumns().add(tableColumn6);
        ((TableView)object2).setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        ObservableList<s> observableList = FXCollections.observableArrayList();
        for (s object3 : this.a) {
            if (object3.getFileReferenceNumber() != s2.getFileReferenceNumber()) continue;
            observableList.add(object3);
        }
        ((TableView)object2).setItems(observableList);
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("ctx.copyName"));
        final TableView tableViewFinal = (TableView)object2;
        menuItem.setOnAction(arg_0 -> v.a(tableViewFinal, arg_0));
        contextMenu.getItems().add(menuItem);
        ((Control)object2).setContextMenu(contextMenu);
        VBox vBox = new VBox(10.0, new Node[]{(Node)object2});
        VBox.setVgrow((Node)object2, Priority.ALWAYS);
        vBox.setPadding(new Insets(10.0));
        dialog.getDialogPane().setContent(vBox);
        dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE);
        dialog.setResizable(true);
        dialog.show();
    }

    public void a() {
        this.g.fire();
    }

    public boolean b() {
        return this.g.isDisabled();
    }

    private static /* synthetic */ void a(TableView tableView, ActionEvent actionEvent) {
        s s2 = (s)tableView.getSelectionModel().getSelectedItem();
        if (s2 != null) {
            Clipboard clipboard = Clipboard.getSystemClipboard();
            ClipboardContent clipboardContent = new ClipboardContent();
            clipboardContent.putString(s2.getFileName());
            clipboard.setContent(clipboardContent);
        }
    }

    private /* synthetic */ void a(Set<String> set, Set<String> set2) {
        ArrayList<s> arrayList = new ArrayList<s>(500);
        Platform.runLater(this.b::clear);
        for (s s2 : this.a) {
            Object object;
            if (Thread.currentThread().isInterrupted()) {
                return;
            }
            boolean bl = false;
            if (set.isEmpty() && set2.isEmpty()) {
                bl = true;
            } else {
                object = s2.getFileName().toLowerCase();
                String string = s2.getReason().toLowerCase();
                String string2 = s2.getFolderPath() == null ? "" : s2.getFolderPath().toLowerCase();
                for (String string3 : set2) {
                    if (!((String)object).contains(string3) && !string.contains(string3) && !string2.contains(string3)) continue;
                    bl = true;
                    break;
                }
                if (!bl) {
                    for (String string3 : set) {
                        String string4 = string3.toLowerCase();
                        if (!((String)object).contains(string4) && !string.contains(string4) && !string2.contains(string4)) continue;
                        bl = true;
                        break;
                    }
                }
            }
            if (!bl) continue;
            arrayList.add(s2);
            if (arrayList.size() < 500) continue;
            object = new ArrayList(arrayList);
            arrayList.clear();
            final List batch = (List)object;
            Platform.runLater(() -> this.b(batch));
        }
        if (!arrayList.isEmpty() && !Thread.currentThread().isInterrupted()) {
            ArrayList arrayList2 = new ArrayList(arrayList);
            Platform.runLater(() -> this.b.addAll(arrayList2));
        }
    }

    private /* synthetic */ void b(List list) {
        this.b.addAll(list);
    }

    private static /* synthetic */ String _kfs(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x6A;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 906831881 + 2099727673 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


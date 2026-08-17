/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.r;
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
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import scanner.o;
import util.I18n;
import util.a;

public class u
extends VBox {
    private final ObservableList<r> a = FXCollections.observableArrayList();
    private final FilteredList<r> b;
    private Button c;

    public u() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(I18n.a("usb.btn"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        TableView<r> tableView = new TableView<r>();
        tableView.getStyleClass().addAll((String[])new String[]{"striped", "bordered", "dense"});
        VBox.setVgrow(tableView, Priority.ALWAYS);
        TableColumn tableColumn = new TableColumn(I18n.a("usb.col.deviceName"));
        tableColumn.setCellValueFactory(new PropertyValueFactory("deviceName"));
        tableColumn.setPrefWidth(200.0);
        TableColumn tableColumn2 = new TableColumn(I18n.a("usb.col.description"));
        tableColumn2.setCellValueFactory(new PropertyValueFactory("description"));
        tableColumn2.setPrefWidth(130.0);
        TableColumn tableColumn3 = new TableColumn(I18n.a("usb.col.vendorName"));
        tableColumn3.setCellValueFactory(new PropertyValueFactory("vendorName"));
        tableColumn3.setPrefWidth(140.0);
        TableColumn tableColumn4 = new TableColumn(I18n.a("usb.col.productName"));
        tableColumn4.setCellValueFactory(new PropertyValueFactory("productName"));
        tableColumn4.setPrefWidth(140.0);
        TableColumn tableColumn5 = new TableColumn(I18n.a("usb.col.productRevision"));
        tableColumn5.setCellValueFactory(new PropertyValueFactory("productRevision"));
        tableColumn5.setPrefWidth(100.0);
        TableColumn tableColumn6 = new TableColumn(I18n.a("usb.col.serial"));
        tableColumn6.setCellValueFactory(new PropertyValueFactory("serialNumber"));
        tableColumn6.setPrefWidth(200.0);
        TableColumn tableColumn7 = new TableColumn(I18n.a("usb.col.vid"));
        tableColumn7.setCellValueFactory(new PropertyValueFactory("vendorId"));
        tableColumn7.setPrefWidth(80.0);
        TableColumn tableColumn8 = new TableColumn(I18n.a("usb.col.pid"));
        tableColumn8.setCellValueFactory(new PropertyValueFactory("productId"));
        tableColumn8.setPrefWidth(80.0);
        TableColumn tableColumn9 = new TableColumn(I18n.a("usb.col.capacity"));
        tableColumn9.setCellValueFactory(new PropertyValueFactory("capacity"));
        tableColumn9.setPrefWidth(100.0);
        TableColumn tableColumn10 = new TableColumn(I18n.a("usb.col.fileSystem"));
        tableColumn10.setCellValueFactory(new PropertyValueFactory("fileSystem"));
        tableColumn10.setPrefWidth(80.0);
        TableColumn tableColumn11 = new TableColumn(I18n.a("usb.col.lastConnected"));
        tableColumn11.setCellValueFactory(new PropertyValueFactory("lastConnected"));
        tableColumn11.setPrefWidth(150.0);
        TableColumn tableColumn12 = new TableColumn(I18n.a("usb.col.firstConnected"));
        tableColumn12.setCellValueFactory(new PropertyValueFactory("firstConnected"));
        tableColumn12.setPrefWidth(150.0);
        tableView.getColumns().addAll(tableColumn, tableColumn12, tableColumn11, tableColumn9, tableColumn6, tableColumn4, tableColumn2, tableColumn3, tableColumn7, tableColumn8, tableColumn5, tableColumn10);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY_FLEX_LAST_COLUMN);
        this.b = new FilteredList<r>(this.a, r2 -> true);
        SortedList<r> sortedList = new SortedList<r>((ObservableList<r>)this.b);
        sortedList.comparatorProperty().bind(tableView.comparatorProperty());
        tableView.setItems(sortedList);
        textField.textProperty().addListener((observableValue, string, string2) -> this.b.setPredicate(r2 -> {
            if (string2 == null || string2.isEmpty()) {
                return true;
            }
            String lower = string2.toLowerCase();
            return r2.getDeviceName() != null && r2.getDeviceName().toLowerCase().contains(lower) || r2.getSerialNumber() != null && r2.getSerialNumber().toLowerCase().contains(lower) || r2.getDescription() != null && r2.getDescription().toLowerCase().contains(lower) || r2.getVendorName() != null && r2.getVendorName().toLowerCase().contains(lower) || r2.getProductName() != null && r2.getProductName().toLowerCase().contains(lower) || r2.getVendorId() != null && r2.getVendorId().toLowerCase().contains(lower) || r2.getProductId() != null && r2.getProductId().toLowerCase().contains(lower) || r2.getCapacity() != null && r2.getCapacity().toLowerCase().contains(lower) || r2.getFileSystem() != null && r2.getFileSystem().toLowerCase().contains(lower) || r2.getDriveLetter() != null && r2.getDriveLetter().toLowerCase().contains(lower);
        }));
        ContextMenu contextMenu = new ContextMenu();
        MenuItem menuItem = new MenuItem(I18n.a("usb.ctx.copyName"));
        menuItem.setOnAction(actionEvent -> {
            r r2 = (r)tableView.getSelectionModel().getSelectedItem();
            if (r2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(r2.getDeviceName());
                clipboard.setContent(clipboardContent);
            }
        });
        MenuItem menuItem2 = new MenuItem(I18n.a("usb.ctx.copySerial"));
        menuItem2.setOnAction(actionEvent -> {
            r r2 = (r)tableView.getSelectionModel().getSelectedItem();
            if (r2 != null) {
                Clipboard clipboard = Clipboard.getSystemClipboard();
                ClipboardContent clipboardContent = new ClipboardContent();
                clipboardContent.putString(r2.getSerialNumber());
                clipboard.setContent(clipboardContent);
            }
        });
        contextMenu.getItems().addAll((MenuItem[])new MenuItem[]{menuItem, menuItem2});
        tableView.setContextMenu(contextMenu);
        Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        this.c.setOnAction(actionEvent -> {
            this.c.setDisable(true);
            label2.setText(I18n.a("usb.statusScanning"));
            this.a.clear();
            Task<List<r>> task = new Task<List<r>>(){

                @Override
                protected List<r> call() {
                    return o.a();
                }
            };
            task.setOnSucceeded(workerStateEvent -> {
                List list = (List)task.getValue();
                this.a.addAll(list);
                label2.setText(String.format(I18n.a("usb.statusFound"), list.size()));
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
            this.c.setText(I18n.a("usb.btn"));
            tableColumn.setText(I18n.a("usb.col.deviceName"));
            tableColumn2.setText(I18n.a("usb.col.description"));
            tableColumn3.setText(I18n.a("usb.col.vendorName"));
            tableColumn4.setText(I18n.a("usb.col.productName"));
            tableColumn5.setText(I18n.a("usb.col.productRevision"));
            tableColumn6.setText(I18n.a("usb.col.serial"));
            tableColumn7.setText(I18n.a("usb.col.vid"));
            tableColumn8.setText(I18n.a("usb.col.pid"));
            tableColumn9.setText(I18n.a("usb.col.capacity"));
            tableColumn10.setText(I18n.a("usb.col.fileSystem"));
            tableColumn11.setText(I18n.a("usb.col.lastConnected"));
            tableColumn12.setText(I18n.a("usb.col.firstConnected"));
            menuItem.setText(I18n.a("usb.ctx.copyName"));
            menuItem2.setText(I18n.a("usb.ctx.copySerial"));
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

    private static /* synthetic */ String _qsah(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x4B;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1011180877 + 1774850677 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


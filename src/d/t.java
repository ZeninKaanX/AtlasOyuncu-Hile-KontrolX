/*
 * Decompiled with CFR 0.152.
 */
package d;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import scanner.n;
import util.I18n;
import util.a;

public class t
extends VBox {
    private List<String> a = new ArrayList<String>();
    private List<String> b = new ArrayList<String>();
    private List<String> c = new ArrayList<String>();
    private Button d;

    public t() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        VBox.setVgrow(this, Priority.ALWAYS);
        this.d = new Button(I18n.a("sitebypass.btn"));
        this.d.getStyleClass().addAll((String[])new String[]{"accent"});
        Button button = new Button(I18n.a("btn.openFolder"));
        button.getStyleClass().addAll((String[])new String[]{"success"});
        Label label = new Label("\ud83d\udd0d");
        final TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.d, button, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        final TextArea textArea = new TextArea();
        textArea.setEditable(false);
        textArea.setPromptText(I18n.a("sitebypass.hostsPrompt"));
        textArea.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        VBox.setVgrow(textArea, Priority.ALWAYS);
        final TextArea textArea2 = new TextArea();
        textArea2.setEditable(false);
        textArea2.setPromptText(I18n.a("sitebypass.registryPrompt"));
        textArea2.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        VBox.setVgrow(textArea2, Priority.ALWAYS);
        final TextArea textArea3 = new TextArea();
        textArea3.setEditable(false);
        textArea3.setPromptText(I18n.a("detect.outputPrompt"));
        textArea3.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        VBox.setVgrow(textArea3, Priority.ALWAYS);
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        VBox vBox = new VBox(textArea);
        vBox.setPadding(new Insets(5.0));
        Tab tab = new Tab(I18n.a("sitebypass.hostsTab"), vBox);
        VBox vBox2 = new VBox(textArea2);
        vBox2.setPadding(new Insets(5.0));
        Tab tab2 = new Tab(I18n.a("sitebypass.registryTab"), vBox2);
        VBox vBox3 = new VBox(textArea3);
        vBox3.setPadding(new Insets(5.0));
        Tab tab5 = new Tab(I18n.a("tab.fullFile"), vBox3);
        tabPane.getTabs().addAll((Tab[])new Tab[]{tab, tab5, tab2});
        VBox.setVgrow(tabPane, Priority.ALWAYS);
        tabPane.getSelectionModel().selectedItemProperty().addListener((observableValue, tab3, tab4) -> {
            boolean bl = tab4 == tab || tab4 == tab5;
            button.setVisible(bl);
            button.setManaged(bl);
        });
        button.setOnAction(actionEvent -> {
            File file = new File(System.getenv("SystemRoot") + "\\System32\\drivers\\etc");
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
        final Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        textField.textProperty().addListener((observableValue, string, string2) -> {
            this.a(textArea, this.a, (String)string2);
            this.a(textArea2, this.b, (String)string2);
            this.a(textArea3, this.c, (String)string2);
        });
        this.d.setOnAction(actionEvent -> {
            this.d.setDisable(true);
            label2.setText(I18n.a("detect.statusScanning"));
            textArea.clear();
            textArea2.clear();
            textArea3.clear();
            Task<Void> task = new Task<Void>(){
                private List<String> g;
                private List<String> h;
                private List<String> i;

                protected Void call() {
                    this.g = n.a();
                    this.h = n.b();
                    this.i = n.c();
                    return null;
                }

                @Override
                protected void succeeded() {
                    t.this.a = this.g;
                    t.this.b = this.h;
                    t.this.c = this.i;
                    String string = textField.getText();
                    t.this.a(textArea, t.this.a, string);
                    t.this.a(textArea2, t.this.b, string);
                    t.this.a(textArea3, t.this.c, string);
                    int n2 = 0;
                    if (t.this.a.size() != 1 || !t.this.a.get(0).equals(I18n.a("sitebypass.hostsNotFound"))) {
                        n2 += t.this.a.size();
                    }
                    if (t.this.b.size() != 1 || !t.this.b.get(0).equals(I18n.a("sitebypass.noRestrictedMatch"))) {
                        n2 += t.this.b.size();
                    }
                    label2.setText(n2 == 0 ? I18n.a("sitebypass.statusNoBypass") : String.format(I18n.a("sitebypass.statusFound"), n2));
                    t.this.d.setDisable(false);
                }

                @Override
                protected void failed() {
                    textArea.setText(String.format(I18n.a("detect.errorMsg"), this.getException().getMessage()));
                    label2.setText(I18n.a("detect.statusError"));
                    t.this.d.setDisable(false);
                }
            };
            new Thread(task).start();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, tabPane, label2});
        I18n.a(() -> {
            this.d.setText(I18n.a("sitebypass.btn"));
            button.setText(I18n.a("btn.openFolder"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            textArea.setPromptText(I18n.a("sitebypass.hostsPrompt"));
            textArea2.setPromptText(I18n.a("sitebypass.registryPrompt"));
            textArea3.setPromptText(I18n.a("detect.outputPrompt"));
            tab.setText(I18n.a("sitebypass.hostsTab"));
            tab2.setText(I18n.a("sitebypass.registryTab"));
            tab5.setText(I18n.a("tab.fullFile"));
            label2.setText(I18n.a("script.statusReady"));
        });
    }

    private void a(TextArea textArea, List<String> list, String string) {
        if (list == null || list.isEmpty()) {
            return;
        }
        StringBuilder stringBuilder = new StringBuilder();
        String[] stringArray = string == null ? new String[]{} : string.toLowerCase().split("\\|");
        boolean bl = string == null || string.trim().isEmpty();
        block0: for (String string2 : list) {
            if (bl) {
                stringBuilder.append(string2).append("\n");
                continue;
            }
            for (String string3 : stringArray) {
                String string4 = string3.trim();
                if (string4.isEmpty() || !string2.toLowerCase().contains(string4)) continue;
                stringBuilder.append(string2).append("\n");
                continue block0;
            }
        }
        if (stringBuilder.length() > 0 && stringBuilder.charAt(stringBuilder.length() - 1) == '\n') {
            stringBuilder.setLength(stringBuilder.length() - 1);
        }
        textArea.setText(stringBuilder.toString());
    }

    public void a() {
        this.d.fire();
    }

    public boolean b() {
        return this.d.isDisabled();
    }

    private static /* synthetic */ String _js(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x4B;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 40713101 + 1891160267 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


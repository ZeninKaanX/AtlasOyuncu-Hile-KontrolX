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
import scanner.JavaLauncher;
import util.I18n;
import util.a;

public class d
extends VBox {
    private List<String> a = new ArrayList<String>();
    private List<String> b = new ArrayList<String>();
    private Button c;

    public d() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        this.c = new Button(String.format(I18n.a("detect.btn"), "CLI"));
        this.c.getStyleClass().addAll((String[])new String[]{"accent"});
        Button button = new Button(I18n.a("btn.openFolder"));
        button.getStyleClass().addAll((String[])new String[]{"success"});
        button.setOnAction(actionEvent -> {
            File file = new File(System.getProperty("java.io.tmpdir"));
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
        final TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.c, button, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        final TextArea textArea = new TextArea();
        textArea.setEditable(false);
        textArea.setPromptText(I18n.a("detect.outputPrompt"));
        textArea.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        VBox.setVgrow(textArea, Priority.ALWAYS);
        final TextArea textArea2 = new TextArea();
        textArea2.setEditable(false);
        textArea2.setPromptText(I18n.a("detect.outputPrompt"));
        textArea2.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        VBox.setVgrow(textArea2, Priority.ALWAYS);
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        VBox vBox = new VBox(textArea);
        vBox.setPadding(new Insets(5.0));
        VBox.setVgrow(textArea, Priority.ALWAYS);
        Tab tab = new Tab(I18n.a("tab.detected"), vBox);
        VBox vBox2 = new VBox(textArea2);
        vBox2.setPadding(new Insets(5.0));
        VBox.setVgrow(textArea2, Priority.ALWAYS);
        Tab tab2 = new Tab(I18n.a("tab.fullFile"), vBox2);
        tabPane.getTabs().addAll((Tab[])new Tab[]{tab, tab2});
        VBox.setVgrow(tabPane, Priority.ALWAYS);
        final Label label2 = new Label(I18n.a("script.statusReady"));
        label2.setStyle(util.a.f);
        textField.textProperty().addListener((observableValue, string, string2) -> {
            String string3 = string2 == null ? "" : string2.toLowerCase();
            this.a(textArea, this.a, string3);
            this.a(textArea2, this.b, string3);
        });
        this.c.setOnAction(actionEvent -> {
            this.c.setDisable(true);
            label2.setText(I18n.a("detect.statusScanning"));
            textArea.clear();
            textArea2.clear();
            Task<Void> task = new Task<Void>(){
                private List<String> f;
                private List<String> g;

                protected Void call() {
                    this.f = scanner.JavaLauncher.a();
                    this.g = scanner.JavaLauncher.b();
                    return null;
                }

                @Override
                protected void succeeded() {
                    d.this.a = this.f;
                    d.this.b = this.g;
                    String string = textField.getText();
                    String string2 = string == null ? "" : string.toLowerCase();
                    d.this.a(textArea, d.this.a, string2);
                    d.this.a(textArea2, d.this.b, string2);
                    if (d.this.a.size() == 1 && (d.this.a.get(0).equals(I18n.a("detect.statusNoMatch")) || d.this.a.get(0).equals(I18n.a("cli.notFound")))) {
                        label2.setText(I18n.a("detect.statusNoMatch"));
                    } else {
                        label2.setText(String.format(I18n.a("detect.statusLinesFound"), d.this.a.size()));
                    }
                    d.this.c.setDisable(false);
                }

                @Override
                protected void failed() {
                    textArea.setText(String.format(I18n.a("detect.errorMsg"), this.getException().getMessage()));
                    label2.setText(I18n.a("detect.statusError"));
                    d.this.c.setDisable(false);
                }
            };
            new Thread(task).start();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, tabPane, label2});
        I18n.a(() -> {
            this.c.setText(String.format(I18n.a("detect.btn"), "CLI"));
            button.setText(I18n.a("btn.openFolder"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            textArea.setPromptText(I18n.a("detect.outputPrompt"));
            textArea2.setPromptText(I18n.a("detect.outputPrompt"));
            tab.setText(I18n.a("tab.detected"));
            tab2.setText(I18n.a("tab.fullFile"));
            label2.setText(I18n.a("script.statusReady"));
        });
    }

    private void a(TextArea textArea, List<String> list, String string) {
        if (list == null || list.isEmpty()) {
            return;
        }
        StringBuilder stringBuilder = new StringBuilder();
        boolean bl = string == null || string.trim().isEmpty();
        for (String string2 : list) {
            if (!bl && !string2.toLowerCase().contains(string)) continue;
            stringBuilder.append(string2).append("\n");
        }
        if (stringBuilder.length() > 0 && stringBuilder.charAt(stringBuilder.length() - 1) == '\n') {
            stringBuilder.setLength(stringBuilder.length() - 1);
        }
        textArea.setText(stringBuilder.toString());
    }

    public void a() {
        this.c.fire();
    }

    public boolean b() {
        return this.c.isDisabled();
    }

    private static /* synthetic */ String _mtb(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xE4;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 235383127 + 112592067 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


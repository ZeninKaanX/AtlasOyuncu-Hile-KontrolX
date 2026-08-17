/*
 * Decompiled with CFR 0.152.
 */
import a.a.a.f;
import c.a;
import d.ManualAnalyze;
import d.s;
import java.io.InputStream;
import java.util.Locale;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonBar;
import javafx.scene.control.ButtonType;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyCodeCombination;
import javafx.scene.input.KeyCombination;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import util.I18n;
import util.c;

public class AtlasHileKontrol
extends Application {
    private final a analysisEngine = new a();
    private static Image cachedIcon;

    @Override
    public void start(Stage stage) {
        if (c.a().a()) {
            Platform.exit();
            return;
        }
        Application.setUserAgentStylesheet(new f().a());
        BorderPane borderPane = new BorderPane();
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        d.f f2 = new d.f(stage);
        Tab tab = new Tab(I18n.a("tab.manualAnalyze"));
        tab.setContent(new ManualAnalyze(stage, this.analysisEngine, f2));
        Tab tab4 = new Tab(I18n.a("tab.autoAnalyze"));
        tab4.setContent(new d.c());
        Tab tab7 = new Tab(I18n.a("tab.settings"));
        tab7.setContent(new s());
        Tab tab8 = new Tab(I18n.a("info.btn"));
        tab8.setContent(new VBox());
        tabPane.getTabs().addAll((Tab[])new Tab[]{tab, tab4, tab8, tab7});
        tabPane.getSelectionModel().selectedItemProperty().addListener((observableValue, tab2, tab3) -> {
            if (tab3 == tab8) {
                Platform.runLater(() -> tabPane.getSelectionModel().select((Tab)tab2));
                this.showInfoDialog();
            }
        });
        borderPane.setCenter(tabPane);
        BorderPane borderPane2 = new BorderPane();
        borderPane2.setPadding(new Insets(5.0, 10.0, 5.0, 10.0));
        Label label = new Label(I18n.a("footer.discord"));
        label.setStyle("-fx-text-fill: gray; -fx-font-size: 11px;");
        borderPane2.setLeft(label);
        Label label2 = new Label(I18n.a("footer.madeBy"));
        label2.setStyle("-fx-text-fill: gray; -fx-font-size: 11px;");
        borderPane2.setRight(label2);
        borderPane.setBottom(borderPane2);
        I18n.a(() -> {
            stage.setTitle(I18n.a("app.title"));
            tab.setText(I18n.a("tab.manualAnalyze"));
            tab4.setText(I18n.a("tab.autoAnalyze"));
            tab7.setText(I18n.a("tab.settings"));
            tab8.setText(I18n.a("info.btn"));
            label.setText(I18n.a("footer.discord"));
            label2.setText(I18n.a("footer.madeBy"));
        });
        Scene scene = new Scene(borderPane, 1000.0, 700.0);
        scene.getStylesheets().add(this.getClass().getResource("/assets/style.css").toExternalForm());
        stage.setTitle(I18n.a("app.title"));
        try {
            InputStream inputStream;
            if (cachedIcon == null && (inputStream = this.getClass().getResourceAsStream("/assets/icon.png")) != null) {
                cachedIcon = new Image(inputStream);
            }
            if (cachedIcon != null) {
                stage.getIcons().add(cachedIcon);
            }
        }
        catch (Exception exception) {
            System.err.println(String.format(I18n.a("gui.error.icon"), exception.getMessage()));
        }
        scene.getAccelerators().put(new KeyCodeCombination(KeyCode.F, KeyCombination.CONTROL_DOWN), () -> scene.getRoot().lookupAll(".text-field").stream().filter(node -> node instanceof TextField && node.isVisible() && ((TextField)node).getPromptText() != null && (((TextField)node).getPromptText().toLowerCase().contains("search") || ((TextField)node).getPromptText().toLowerCase().contains("ara"))).findFirst().ifPresent(node -> {
            ((TextField)node).requestFocus();
            ((TextField)node).selectAll();
        }));
        stage.setScene(scene);
        stage.setMaximized(true);
        stage.show();
        this.checkAdminPrivileges();
        Platform.runLater(this::showInfoDialog);
    }

    @Override
    public void stop() {
        this.analysisEngine.b();
    }

    private void showInfoDialog() {
        Dialog dialog = new Dialog();
        dialog.setResizable(true);
        dialog.setTitle(I18n.a("info.title"));
        dialog.setHeaderText(null);
        try {
            if (cachedIcon != null) {
                ((Stage)dialog.getDialogPane().getScene().getWindow()).getIcons().add(cachedIcon);
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        TextArea textArea = new TextArea(I18n.a("info.important.text").replace("\\n", "\n"));
        textArea.setEditable(false);
        textArea.setWrapText(true);
        VBox vBox = new VBox(textArea);
        vBox.setPadding(new Insets(10.0));
        VBox.setVgrow(textArea, Priority.ALWAYS);
        Tab tab = new Tab(I18n.a("info.tab.important"), vBox);
        TextArea textArea2 = new TextArea(I18n.a("info.usage.text").replace("\\n", "\n"));
        textArea2.setEditable(false);
        textArea2.setWrapText(true);
        VBox vBox2 = new VBox(textArea2);
        vBox2.setPadding(new Insets(10.0));
        VBox.setVgrow(textArea2, Priority.ALWAYS);
        Tab tab2 = new Tab(I18n.a("info.tab.usage"), vBox2);
        TextArea textArea3 = new TextArea(I18n.a("info.info.text").replace("\\n", "\n"));
        textArea3.setEditable(false);
        textArea3.setWrapText(true);
        VBox vBox3 = new VBox(textArea3);
        vBox3.setPadding(new Insets(10.0));
        VBox.setVgrow(textArea3, Priority.ALWAYS);
        Tab tab3 = new Tab(I18n.a("info.tab.info"), vBox3);
        tabPane.getTabs().addAll((Tab[])new Tab[]{tab, tab2, tab3});
        Label label = new Label(I18n.a("settings.language"));
        ComboBox comboBox = new ComboBox();
        Runnable runnable = () -> {
            comboBox.getItems().clear();
            comboBox.getItems().addAll(I18n.a("settings.language.tr"), I18n.a("settings.language.en"), I18n.a("settings.language.pl"), I18n.a("settings.language.ru"), I18n.a("settings.language.es"), I18n.a("settings.language.az"));
            comboBox.setValue(I18n.a("settings.language." + I18n.a().getLanguage()));
        };
        runnable.run();
        comboBox.setOnAction(actionEvent -> {
            String string = (String)comboBox.getValue();
            if (string == null) {
                return;
            }
            if (string.equals(I18n.a("settings.language.tr"))) {
                I18n.a(Locale.forLanguageTag("tr"));
            } else if (string.equals(I18n.a("settings.language.en"))) {
                I18n.a(Locale.ENGLISH);
            } else if (string.equals(I18n.a("settings.language.pl"))) {
                I18n.a(Locale.forLanguageTag("pl"));
            } else if (string.equals(I18n.a("settings.language.ru"))) {
                I18n.a(Locale.forLanguageTag("ru"));
            } else if (string.equals(I18n.a("settings.language.es"))) {
                I18n.a(Locale.forLanguageTag("es"));
            } else if (string.equals(I18n.a("settings.language.az"))) {
                I18n.a(Locale.forLanguageTag("az"));
            }
        });
        VBox vBox4 = new VBox(10.0, tabPane, label, comboBox);
        vBox4.setPadding(new Insets(10.0));
        VBox.setVgrow(tabPane, Priority.ALWAYS);
        dialog.getDialogPane().setContent(vBox4);
        ButtonType buttonType = new ButtonType(I18n.a("info.btn.gotit"), ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().add(buttonType);
        Runnable runnable2 = () -> {
            dialog.setTitle(I18n.a("info.title"));
            tab.setText(I18n.a("info.tab.important"));
            tab2.setText(I18n.a("info.tab.usage"));
            tab3.setText(I18n.a("info.tab.info"));
            textArea.setText(I18n.a("info.important.text").replace("\\n", "\n"));
            textArea2.setText(I18n.a("info.usage.text").replace("\\n", "\n"));
            textArea3.setText(I18n.a("info.info.text").replace("\\n", "\n"));
            label.setText(I18n.a("settings.language"));
            runnable.run();
            Button button = (Button)dialog.getDialogPane().lookupButton(buttonType);
            if (button != null) {
                button.setText(I18n.a("info.btn.gotit"));
            }
        };
        I18n.a(runnable2);
        dialog.showAndWait();
        I18n.b(runnable2);
    }

    private void checkAdminPrivileges() {
        try {
            Process process = Runtime.getRuntime().exec(new String[]{"cmd.exe", "/c", "net session >nul 2>&1 && echo ADMIN || echo NOADMIN"});
            String string = new String(process.getInputStream().readAllBytes()).trim();
            process.waitFor();
            if (string.contains("NOADMIN")) {
                Platform.runLater(() -> {
                    Alert alert = new Alert(Alert.AlertType.WARNING);
                    alert.setTitle(I18n.a("admin.warning.title"));
                    alert.setHeaderText(I18n.a("admin.warning.header"));
                    alert.setContentText(I18n.a("admin.warning.text"));
                    alert.show();
                });
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    public static void main(String[] stringArray) {
        AtlasHileKontrol.launch(stringArray);
    }

    private static /* synthetic */ String _gjpw(String string, int n) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n2 = n ^ 0x64;
            int n3 = 0;
            while (n3 < cArray.length) {
                n2 = n2 * 973857499 + 1028092905 & Integer.MAX_VALUE;
                int n4 = n3++;
                cArray[n4] = (char)(cArray[n4] ^ n2 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}

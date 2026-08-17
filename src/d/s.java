/*
 * Decompiled with CFR 0.152.
 */
package d;

import a.a.a.a;
import a.a.a.b;
import a.a.a.c;
import a.a.a.d;
import a.a.a.e;
import a.a.a.f;
import a.a.a.g;
import java.util.Locale;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Separator;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import util.I18n;

public class s
extends VBox {
    private ComboBox<String> a;
    private ComboBox<String> b;
    private Label c;
    private Label d;
    private Label e;
    private Label f;
    private boolean g = false;

    public s() {
        this.setPadding(new Insets(20.0));
        this.setSpacing(20.0);
        this.setAlignment(Pos.TOP_LEFT);
        VBox vBox = new VBox(25.0);
        vBox.setAlignment(Pos.TOP_LEFT);
        VBox vBox2 = new VBox(15.0);
        vBox2.setAlignment(Pos.TOP_LEFT);
        this.c = new Label(I18n.a("settings.appearance.title"));
        this.c.getStyleClass().add("title-3");
        this.d = new Label(I18n.a("settings.theme"));
        this.a = new ComboBox();
        this.a(this.a);
        this.a.setOnAction(actionEvent -> {
            if (this.g) {
                return;
            }
            String string = (String)this.a.getValue();
            if (string == null) {
                return;
            }
            if (string.equals(I18n.a("settings.theme.dark"))) {
                Application.setUserAgentStylesheet(new f().a());
            } else if (string.equals(I18n.a("settings.theme.light"))) {
                Application.setUserAgentStylesheet(new g().a());
            } else if (string.equals(I18n.a("settings.theme.nord.dark"))) {
                Application.setUserAgentStylesheet(new d().a());
            } else if (string.equals(I18n.a("settings.theme.nord.light"))) {
                Application.setUserAgentStylesheet(new e().a());
            } else if (string.equals(I18n.a("settings.theme.cupertino.dark"))) {
                Application.setUserAgentStylesheet(new a().a());
            } else if (string.equals(I18n.a("settings.theme.cupertino.light"))) {
                Application.setUserAgentStylesheet(new b().a());
            } else if (string.equals(I18n.a("settings.theme.dracula"))) {
                Application.setUserAgentStylesheet(new c().a());
            }
        });
        vBox2.getChildren().addAll((Node[])new Node[]{this.c, this.d, this.a});
        Separator separator = new Separator();
        VBox vBox3 = new VBox(15.0);
        vBox3.setAlignment(Pos.TOP_LEFT);
        this.e = new Label(I18n.a("settings.general.title"));
        this.e.getStyleClass().add("title-3");
        this.f = new Label(I18n.a("settings.language"));
        this.b = new ComboBox();
        this.b(this.b);
        this.b.setOnAction(actionEvent -> {
            if (this.g) {
                return;
            }
            String string = (String)this.b.getValue();
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
        vBox3.getChildren().addAll((Node[])new Node[]{this.e, this.f, this.b});
        vBox.getChildren().addAll((Node[])new Node[]{vBox2, separator, vBox3});
        ScrollPane scrollPane = new ScrollPane(vBox);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle("-fx-background-color:transparent; -fx-background:transparent;");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        this.getChildren().add(scrollPane);
        I18n.a(() -> {
            this.g = true;
            try {
                this.c.setText(I18n.a("settings.appearance.title"));
                this.d.setText(I18n.a("settings.theme"));
                this.e.setText(I18n.a("settings.general.title"));
                this.f.setText(I18n.a("settings.language"));
                this.a(this.a);
                this.b(this.b);
            }
            finally {
                this.g = false;
            }
        });
    }

    private void a(ComboBox<String> comboBox) {
        String string = I18n.a("settings.theme.dark");
        String string2 = I18n.a("settings.theme.light");
        String string3 = I18n.a("settings.theme.nord.dark");
        String string4 = I18n.a("settings.theme.nord.light");
        String string5 = I18n.a("settings.theme.cupertino.dark");
        String string6 = I18n.a("settings.theme.cupertino.light");
        String string7 = I18n.a("settings.theme.dracula");
        comboBox.getItems().setAll((String[])new String[]{string, string2, string3, string4, string5, string6, string7});
        String string8 = Application.getUserAgentStylesheet();
        if (string8 == null) {
            comboBox.setValue(string);
        } else if (string8.equals(new f().a())) {
            comboBox.setValue(string);
        } else if (string8.equals(new g().a())) {
            comboBox.setValue(string2);
        } else if (string8.equals(new d().a())) {
            comboBox.setValue(string3);
        } else if (string8.equals(new e().a())) {
            comboBox.setValue(string4);
        } else if (string8.equals(new a().a())) {
            comboBox.setValue(string5);
        } else if (string8.equals(new b().a())) {
            comboBox.setValue(string6);
        } else if (string8.equals(new c().a())) {
            comboBox.setValue(string7);
        } else {
            comboBox.setValue(string);
        }
    }

    private void b(ComboBox<String> comboBox) {
        String string = I18n.a("settings.language.tr");
        String string2 = I18n.a("settings.language.en");
        String string3 = I18n.a("settings.language.pl");
        String string4 = I18n.a("settings.language.ru");
        String string5 = I18n.a("settings.language.es");
        String string6 = I18n.a("settings.language.az");
        comboBox.getItems().setAll((String[])new String[]{string, string2, string3, string4, string5, string6});
        String string7 = I18n.a().getLanguage();
        if (string7.equals("tr")) {
            comboBox.setValue(string);
        } else if (string7.equals("pl")) {
            comboBox.setValue(string3);
        } else if (string7.equals("ru")) {
            comboBox.setValue(string4);
        } else if (string7.equals("es")) {
            comboBox.setValue(string5);
        } else if (string7.equals("az")) {
            comboBox.setValue(string6);
        } else {
            comboBox.setValue(string2);
        }
    }

    private static /* synthetic */ String _rpfe(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x39;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1523052973 + 1859745803 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


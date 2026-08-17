/*
 * Decompiled with CFR 0.152.
 */
package d;

import d.a;
import d.d;
import d.e;
import d.i;
import d.l;
import d.m;
import d.n;
import d.o;
import d.p;
import d.r;
import d.t;
import d.u;
import d.v;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;
import javafx.animation.KeyFrame;
import javafx.animation.KeyValue;
import javafx.animation.PauseTransition;
import javafx.animation.Timeline;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Toggle;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.SVGPath;
import javafx.util.Duration;
import util.I18n;

public class c
extends BorderPane {
    private ScrollPane a;
    private HBox b;
    private ToggleGroup c;
    private StackPane d;
    private final Map<ToggleButton, Node> e = new LinkedHashMap<ToggleButton, Node>();
    private final Map<ToggleButton, Supplier<Node>> f = new LinkedHashMap<ToggleButton, Supplier<Node>>();
    private SVGPath g;
    private SVGPath h;
    private m i;
    private v j;
    private i k;
    private r m;
    private p n;
    private t o;
    private u p;
    private n q;
    private d r;
    private l s;
    private e t;
    private o u;
    private a v;
    private Button x;

    public c() {
        this.a();
    }

    private void a() {
        this.c = new ToggleGroup();
        this.b = new HBox(5.0);
        this.b.setPadding(new Insets(5.0));
        this.b.setAlignment(Pos.CENTER_LEFT);
        this.a = new ScrollPane(this.b);
        this.a.setFitToHeight(true);
        this.a.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        this.a.setVbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        this.a.setPannable(true);
        this.a.setStyle("-fx-background-color: transparent; -fx-background: transparent; -fx-border-color: transparent;");
        HBox.setHgrow(this.a, Priority.ALWAYS);
        this.g = this.a(true);
        Button button = new Button();
        button.setGraphic(this.g);
        button.getStyleClass().addAll((String[])new String[]{"button-icon", "flat"});
        button.setOnAction(actionEvent -> this.a(-0.2));
        this.h = this.a(false);
        Button button2 = new Button();
        button2.setGraphic(this.h);
        button2.getStyleClass().addAll((String[])new String[]{"button-icon", "flat"});
        button2.setOnAction(actionEvent -> this.a(0.2));
        this.a.hvalueProperty().addListener((observableValue, number, number2) -> this.b());
        this.a.viewportBoundsProperty().addListener((observableValue, bounds, bounds2) -> this.b());
        this.b.widthProperty().addListener((observableValue, number, number2) -> this.b());
        this.x = new Button(I18n.a("analyzeAll.btn"));
        this.x.setStyle("-fx-background-color: #bd93f9; -fx-text-fill: white; -fx-font-weight: bold;");
        this.x.setMinWidth(Double.NEGATIVE_INFINITY);
        this.x.setOnAction(actionEvent -> this.d());
        HBox hBox = new HBox(button, this.a, button2);
        hBox.setAlignment(Pos.CENTER_LEFT);
        hBox.getStyleClass().add("bordered");
        hBox.setStyle("-fx-border-width: 0 0 1 0;");
        this.d = new StackPane();
        VBox.setVgrow(this.d, Priority.ALWAYS);
        this.a("tab.prefetch", () -> {
            this.i = new m();
            return this.i;
        });
        this.a("tab.usn", () -> {
            this.j = new v();
            return this.j;
        });
        this.a("tab.jvm", () -> {
            this.k = new i();
            return this.k;
        });
        this.a("tab.services", () -> {
            this.m = new r();
            return this.m;
        });
        this.a("tab.regedit", () -> {
            this.n = new p();
            return this.n;
        });
        this.a("tab.siteBypass", () -> {
            this.o = new t();
            return this.o;
        });
        this.a("tab.usb", () -> {
            this.p = new u();
            return this.p;
        });
        this.a("tab.recent", () -> {
            this.q = new n();
            return this.q;
        });
        this.a("tab.cli", () -> {
            this.r = new d();
            return this.r;
        });
        this.a("tab.powershell", () -> {
            this.s = new l();
            return this.s;
        });
        this.a("tab.crashDumps", () -> {
            this.t = new e();
            return this.t;
        });
        this.a("tab.recycleBin", () -> {
            this.u = new o();
            return this.u;
        });
        this.a("tab.altchecker", () -> {
            this.v = new a();
            return this.v;
        });
        this.b.getChildren().add(this.x);
        if (!this.c.getToggles().isEmpty()) {
            ((Toggle)this.c.getToggles().get(0)).setSelected(true);
        }
        this.setTop(hBox);
        this.setCenter(this.d);
        I18n.a(() -> {
            for (Map.Entry<ToggleButton, Node> entry : this.e.entrySet()) {
                ToggleButton toggleButton = entry.getKey();
                String string = (String)toggleButton.getUserData();
                toggleButton.setText(I18n.a(string));
            }
            this.x.setText(I18n.a("analyzeAll.btn"));
        });
    }

    private void a(String string, Supplier<Node> supplier) {
        ToggleButton toggleButton = new ToggleButton(I18n.a(string));
        toggleButton.setToggleGroup(this.c);
        toggleButton.setUserData(string);
        toggleButton.getStyleClass().addAll((String[])new String[]{"flat"});
        toggleButton.setMinWidth(Double.NEGATIVE_INFINITY);
        Label label = new Label("...");
        label.setVisible(false);
        this.d.getChildren().add(label);
        this.e.put(toggleButton, label);
        this.f.put(toggleButton, supplier);
        toggleButton.selectedProperty().addListener((observableValue, bl, bl2) -> {
            if (bl2.booleanValue()) {
                if (this.f.containsKey(toggleButton)) {
                    Node node = this.f.remove(toggleButton).get();
                    this.d.getChildren().remove(label);
                    this.d.getChildren().add(node);
                    this.e.put(toggleButton, node);
                    node.setVisible(true);
                    node.toFront();
                } else {
                    Node node = this.e.get(toggleButton);
                    node.setVisible(true);
                    node.toFront();
                }
                this.a(toggleButton);
            } else {
                Node node = this.e.get(toggleButton);
                if (node != null) {
                    node.setVisible(false);
                }
            }
        });
        this.b.getChildren().add(toggleButton);
    }

    private SVGPath a(boolean bl) {
        SVGPath sVGPath = new SVGPath();
        sVGPath.setContent(bl ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6");
        sVGPath.setStroke(Color.GRAY);
        sVGPath.setStrokeWidth(2.5);
        sVGPath.setFill(null);
        return sVGPath;
    }

    private void b() {
        double d2 = this.a.getHvalue();
        double d3 = this.b.getWidth();
        double d4 = this.a.getViewportBounds().getWidth();
        boolean bl = d2 > 0.0 && d3 > d4;
        boolean bl2 = d2 < 1.0 && d3 > d4;
        this.g.setStroke(bl ? Color.web("#bd93f9") : Color.GRAY);
        this.g.setStrokeWidth(bl ? 3.0 : 2.5);
        this.h.setStroke(bl2 ? Color.web("#bd93f9") : Color.GRAY);
        this.h.setStrokeWidth(bl2 ? 3.0 : 2.5);
    }

    private void a(double d2) {
        double d3 = this.a.getHvalue();
        this.a.setHvalue(Math.max(0.0, Math.min(1.0, d3 + d2)));
    }

    private void a(ToggleButton toggleButton) {
        double d2 = this.a.getViewportBounds().getWidth();
        double d3 = this.b.getBoundsInLocal().getWidth();
        if (d3 <= d2) {
            return;
        }
        double d4 = toggleButton.getBoundsInParent().getMinX();
        double d5 = toggleButton.getBoundsInParent().getWidth();
        double d6 = (d4 - d2 / 2.0 + d5 / 2.0) / (d3 - d2);
        this.a.setHvalue(Math.max(0.0, Math.min(1.0, d6)));
    }

    private void c() {
        for (Map.Entry<ToggleButton, Supplier<Node>> entry : new ArrayList<Map.Entry<ToggleButton, Supplier<Node>>>(this.f.entrySet())) {
            ToggleButton toggleButton = entry.getKey();
            Node node = entry.getValue().get();
            Node node2 = this.e.get(toggleButton);
            this.d.getChildren().remove(node2);
            node.setVisible(false);
            this.d.getChildren().add(node);
            this.e.put(toggleButton, node);
        }
        this.f.clear();
    }

    private void d() {
        final Timeline[] timelineArray = new Timeline[1];
        this.x.setDisable(true);
        this.c();
        this.i.a();
        this.j.a();
        this.k.a();
        this.m.a();
        this.n.a();
        this.o.a();
        this.p.a();
        this.q.a();
        this.r.a();
        this.s.a();
        this.t.a();
        this.u.a();
        this.v.b();
        timelineArray[0] = new Timeline(new KeyFrame(Duration.millis(500.0), actionEvent -> {
            boolean bl;
            boolean bl2 = bl = this.i.b() || this.j.b() || this.k.b() || this.m.b() || this.n.b() || this.o.b() || this.p.b() || this.q.b() || this.r.b() || this.s.b() || this.t.b() || this.u.b() || this.v.c();
            if (!bl) {
                this.x.setDisable(false);
                Alert alert = new Alert(Alert.AlertType.INFORMATION);
                alert.setTitle(I18n.a("app.title"));
                alert.setHeaderText(null);
                alert.setContentText(I18n.a("analyzeAll.finished"));
                alert.show();
                if (timelineArray[0] != null) {
                    timelineArray[0].stop();
                }
            }
        }, new KeyValue[0]));
        timelineArray[0].setCycleCount(-1);
        PauseTransition pauseTransition = new PauseTransition(Duration.millis(300.0));
        pauseTransition.setOnFinished(actionEvent -> timelineArray[0].play());
        pauseTransition.play();
    }

    private static /* synthetic */ String _zmt(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x21;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1831453819 + 1031198197 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


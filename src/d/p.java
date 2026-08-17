/*
 * Decompiled with CFR 0.152.
 */
package d;

import b.n;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import scanner.j;
import scanner.l;
import util.I18n;
import util.a;

public class p
extends VBox {
    private List<String> a = new ArrayList<String>();
    private List<String> b = new ArrayList<String>();
    private List<String> c = new ArrayList<String>();
    private List<String> d = new ArrayList<String>();
    private List<String> e = new ArrayList<String>();
    private List<String> f = new ArrayList<String>();
    private List<String> g = new ArrayList<String>();
    private List<String> h = new ArrayList<String>();
    private List<String> i = new ArrayList<String>();
    private List<String> j = new ArrayList<String>();
    private List<String> k = new ArrayList<String>();
    private List<String> l = new ArrayList<String>();
    private List<String> m = new ArrayList<String>();
    private List<String> n = new ArrayList<String>();
    private List<String> o = new ArrayList<String>();
    private List<n> p = new ArrayList<n>();
    private Button q;
    private final ToggleGroup r = new ToggleGroup();
    private final HBox s = new HBox(2.0);
    private final ScrollPane t = new ScrollPane();
    private final StackPane u = new StackPane();
    private final Map<ToggleButton, VBox> v = new LinkedHashMap<ToggleButton, VBox>();

    public p() {
        this.setSpacing(10.0);
        this.setPadding(new Insets(10.0));
        VBox.setVgrow(this, Priority.ALWAYS);
        this.q = new Button(I18n.a("regedit.btn"));
        this.q.getStyleClass().addAll((String[])new String[]{"accent"});
        Label label = new Label("\ud83d\udd0d");
        final TextField textField = new TextField();
        textField.setPromptText(I18n.a("mod.searchPrompt"));
        HBox.setHgrow(textField, Priority.ALWAYS);
        HBox hBox = new HBox(10.0, this.q, label, textField);
        hBox.setAlignment(Pos.CENTER_LEFT);
        final TextArea textArea = this.a(I18n.a("regedit.arcPrompt"));
        final TextArea textArea2 = this.a(I18n.a("regedit.bamPrompt"));
        final TextArea textArea3 = this.a(I18n.a("regedit.certsPrompt"));
        final TextArea textArea4 = this.a(I18n.a("regedit.cmdColorPrompt"));
        final TextArea textArea5 = this.a(I18n.a("regedit.diPrompt"));
        final TextArea textArea6 = this.a(I18n.a("regedit.disallowRunPrompt"));
        final TextArea textArea7 = this.a(I18n.a("regedit.firewallPrompt"));
        final TextArea textArea8 = this.a(I18n.a("regedit.gpoPrompt"));
        final TextArea textArea9 = this.a(I18n.a("regedit.inetZonesPrompt"));
        final TextArea textArea10 = this.a(I18n.a("regedit.mountedPrompt"));
        final TextArea textArea11 = this.a(I18n.a("regedit.prefetchParamsPrompt"));
        final TextArea textArea12 = this.a(I18n.a("regedit.recentDocsPrompt"));
        final TextArea textArea13 = this.a(I18n.a("regedit.startupPrompt"));
        final TextArea textArea14 = this.a(I18n.a("regedit.taskkillPrompt"));
        final TextArea textArea15 = this.a(I18n.a("regedit.urlBlockPrompt"));
        final TextArea textArea16 = this.a(I18n.a("regedit.winrarStegoPrompt"));
        ToggleButton toggleButton = this.a(I18n.a("regedit.arcTab"), textArea);
        ToggleButton toggleButton2 = this.a(I18n.a("regedit.bamTab"), textArea2);
        ToggleButton toggleButton3 = this.a(I18n.a("regedit.certsTab"), textArea3);
        ToggleButton toggleButton4 = this.a(I18n.a("regedit.cmdColorTab"), textArea4);
        ToggleButton toggleButton5 = this.a(I18n.a("regedit.diTab"), textArea5);
        ToggleButton toggleButton6 = this.a(I18n.a("regedit.disallowRunTab"), textArea6);
        ToggleButton toggleButton7 = this.a(I18n.a("regedit.firewallTab"), textArea7);
        ToggleButton toggleButton8 = this.a(I18n.a("regedit.gpoTab"), textArea8);
        ToggleButton toggleButton9 = this.a(I18n.a("regedit.inetZonesTab"), textArea9);
        ToggleButton toggleButton10 = this.a(I18n.a("regedit.mountedTab"), textArea10);
        ToggleButton toggleButton11 = this.a(I18n.a("regedit.prefetchParamsTab"), textArea11);
        ToggleButton toggleButton12 = this.a(I18n.a("regedit.recentDocsTab"), textArea12);
        ToggleButton toggleButton13 = this.a(I18n.a("regedit.startupTab"), textArea13);
        ToggleButton toggleButton14 = this.a(I18n.a("regedit.taskkillTab"), textArea14);
        ToggleButton toggleButton15 = this.a(I18n.a("regedit.urlBlockTab"), textArea15);
        ToggleButton toggleButton16 = this.a(I18n.a("regedit.winrarStegoTab"), textArea16);
        toggleButton.setSelected(true);
        this.a(toggleButton);
        this.s.setAlignment(Pos.CENTER_LEFT);
        this.s.setPadding(new Insets(2.0));
        this.t.setContent(this.s);
        this.t.setVbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        this.t.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        this.t.setFitToHeight(true);
        this.t.setPannable(false);
        this.t.setStyle("-fx-background-color: transparent; -fx-background: transparent;");
        HBox.setHgrow(this.t, Priority.ALWAYS);
        HBox hBox2 = new HBox(4.0, this.t);
        hBox2.setAlignment(Pos.CENTER_LEFT);
        hBox2.setPadding(new Insets(0.0, 0.0, 2.0, 0.0));
        VBox.setVgrow(this.u, Priority.ALWAYS);
        ArrayList<ToggleButton> arrayList = new ArrayList<ToggleButton>();
        for (Node node : this.s.getChildren()) {
            if (!(node instanceof ToggleButton)) continue;
            arrayList.add((ToggleButton)node);
        }
        this.t.setOnKeyPressed(keyEvent -> {
            if (keyEvent.getCode() == KeyCode.LEFT || keyEvent.getCode() == KeyCode.RIGHT) {
                int n2;
                int n3 = arrayList.indexOf(this.r.getSelectedToggle());
                if (n3 < 0) {
                    return;
                }
                int n4 = n2 = keyEvent.getCode() == KeyCode.LEFT ? n3 - 1 : n3 + 1;
                if (n2 >= 0 && n2 < arrayList.size()) {
                    ((ToggleButton)arrayList.get(n2)).setSelected(true);
                    ((ToggleButton)arrayList.get(n2)).fire();
                }
                keyEvent.consume();
            }
        });
        this.t.setFocusTraversable(true);
        final Label label2 = new Label(I18n.a("regedit.statusReady"));
        label2.setStyle(util.a.f);
        textField.textProperty().addListener((observableValue, string, string2) -> {
            String string3 = string2 == null ? "" : string2.toLowerCase();
            this.a(textArea10, this.a, string3);
            this.a(textArea, this.b, string3);
            this.a(textArea5, this.c, string3);
            this.a(textArea13, this.d, string3);
            this.a(textArea2, this.e, string3);
            this.a(textArea6, this.f, string3);
            this.a(textArea14, this.g, string3);
            this.a(textArea4, this.h, string3);
            this.a(textArea11, this.i, string3);
            this.a(textArea3, this.j, string3);
            this.a(textArea8, this.k, string3);
            this.a(textArea7, this.l, string3);
            this.a(textArea15, this.m, string3);
            this.a(textArea16, this.n, string3);
            this.a(textArea9, this.o, string3);
            ArrayList<String> recentList = new ArrayList<String>();
            for (n n2 : this.p) {
                recentList.add(n2.getFileName() + (String)(n2.isSuspicious() ? " [" + I18n.a("regedit.suspicious") + "]" : ""));
            }
            this.a(textArea12, recentList, string3);
        });
        this.q.setOnAction(actionEvent -> {
            this.q.setDisable(true);
            label2.setText(I18n.a("regedit.statusScanning"));
            textArea10.clear();
            textArea.clear();
            textArea5.clear();
            textArea13.clear();
            textArea2.clear();
            textArea6.clear();
            textArea14.clear();
            textArea4.clear();
            textArea11.clear();
            textArea3.clear();
            textArea8.clear();
            textArea7.clear();
            textArea15.clear();
            textArea16.clear();
            textArea9.clear();
            textArea12.clear();
            Task<Void> task = new Task<Void>(){
                private List<String> t;
                private List<String> u;
                private List<String> v;
                private List<String> w;
                private List<String> x;
                private List<String> y;
                private List<String> z;
                private List<String> A;
                private List<String> B;
                private List<String> C;
                private List<String> D;
                private List<String> E;
                private List<String> F;
                private List<String> G;
                private List<String> H;
                private List<n> I;

                protected Void call() {
                    CompletableFuture<List> completableFuture = CompletableFuture.supplyAsync(scanner.l::a);
                    CompletableFuture<List> completableFuture2 = CompletableFuture.supplyAsync(scanner.l::b);
                    CompletableFuture<List> completableFuture3 = CompletableFuture.supplyAsync(scanner.l::c);
                    CompletableFuture<List> completableFuture4 = CompletableFuture.supplyAsync(scanner.l::d);
                    CompletableFuture<List> completableFuture5 = CompletableFuture.supplyAsync(scanner.l::e);
                    CompletableFuture<List> completableFuture6 = CompletableFuture.supplyAsync(scanner.j::a);
                    CompletableFuture<List> completableFuture7 = CompletableFuture.supplyAsync(scanner.l::f);
                    CompletableFuture<List> completableFuture8 = CompletableFuture.supplyAsync(scanner.l::g);
                    CompletableFuture<List> completableFuture9 = CompletableFuture.supplyAsync(scanner.l::h);
                    CompletableFuture<List> completableFuture10 = CompletableFuture.supplyAsync(scanner.l::i);
                    CompletableFuture<List> completableFuture11 = CompletableFuture.supplyAsync(scanner.l::j);
                    CompletableFuture<List> completableFuture12 = CompletableFuture.supplyAsync(scanner.l::k);
                    CompletableFuture<List> completableFuture13 = CompletableFuture.supplyAsync(scanner.l::l);
                    CompletableFuture<List> completableFuture14 = CompletableFuture.supplyAsync(scanner.l::m);
                    CompletableFuture<List> completableFuture15 = CompletableFuture.supplyAsync(scanner.l::n);
                    CompletableFuture<List> completableFuture16 = CompletableFuture.supplyAsync(scanner.l::o);
                    CompletableFuture.allOf(completableFuture, completableFuture2, completableFuture3, completableFuture4, completableFuture5, completableFuture6, completableFuture7, completableFuture8, completableFuture9, completableFuture10, completableFuture11, completableFuture12, completableFuture13, completableFuture14, completableFuture15, completableFuture16).join();
                    this.t = completableFuture.join();
                    this.u = completableFuture2.join();
                    this.v = completableFuture3.join();
                    this.w = completableFuture4.join();
                    this.x = completableFuture5.join();
                    this.I = completableFuture6.join();
                    this.y = completableFuture7.join();
                    this.z = completableFuture8.join();
                    this.A = completableFuture9.join();
                    this.B = completableFuture10.join();
                    this.C = completableFuture11.join();
                    this.D = completableFuture12.join();
                    this.E = completableFuture13.join();
                    this.F = completableFuture14.join();
                    this.G = completableFuture15.join();
                    this.H = completableFuture16.join();
                    return null;
                }

                @Override
                protected void succeeded() {
                    Platform.runLater(() -> {
                        p.this.a = this.t;
                        p.this.b = this.u;
                        p.this.c = this.v;
                        p.this.d = this.w;
                        p.this.e = this.x;
                        p.this.f = this.y;
                        p.this.g = this.z;
                        p.this.h = this.A;
                        p.this.i = this.B;
                        p.this.j = this.C;
                        p.this.k = this.D;
                        p.this.l = this.E;
                        p.this.m = this.F;
                        p.this.n = this.G;
                        p.this.o = this.H;
                        p.this.p = this.I;
                        String string = textField.getText() == null ? "" : textField.getText().toLowerCase();
                        p.this.a(textArea10, p.this.a, string);
                        p.this.a(textArea, p.this.b, string);
                        p.this.a(textArea5, p.this.c, string);
                        p.this.a(textArea13, p.this.d, string);
                        p.this.a(textArea2, p.this.e, string);
                        p.this.a(textArea6, p.this.f, string);
                        p.this.a(textArea14, p.this.g, string);
                        p.this.a(textArea4, p.this.h, string);
                        p.this.a(textArea11, p.this.i, string);
                        p.this.a(textArea3, p.this.j, string);
                        p.this.a(textArea8, p.this.k, string);
                        p.this.a(textArea7, p.this.l, string);
                        p.this.a(textArea15, p.this.m, string);
                        p.this.a(textArea16, p.this.n, string);
                        p.this.a(textArea9, p.this.o, string);
                        ArrayList<String> arrayList = new ArrayList<String>();
                        for (n n2 : p.this.p) {
                            arrayList.add(n2.getFileName() + (String)(n2.isSuspicious() ? " [" + I18n.a("regedit.suspicious") + "]" : ""));
                        }
                        p.this.a(textArea12, arrayList, string);
                        int n3 = this.t.size() + this.u.size() + this.v.size() + this.w.size() + this.x.size() + this.I.size() + this.y.size() + this.z.size() + this.A.size() + this.B.size() + this.C.size() + this.D.size() + this.E.size() + this.F.size() + this.G.size() + this.H.size();
                        label2.setText(String.format(I18n.a("regedit.statusFound"), n3));
                        label2.setStyle(util.a.f);
                        p.this.q.setDisable(false);
                    });
                }

                @Override
                protected void failed() {
                    Platform.runLater(() -> {
                        textArea10.setText(String.format(I18n.a("detect.errorMsg"), this.getException().getMessage()));
                        label2.setText(I18n.a("detect.statusError"));
                        p.this.q.setDisable(false);
                    });
                }

                private static /* synthetic */ String _pk(String string, int n2) {
                    if (string != null) {
                        char[] cArray = string.toCharArray();
                        int n3 = n2 ^ 0x8F;
                        int n4 = 0;
                        while (n4 < cArray.length) {
                            n3 = n3 * 1985306523 + 1057971773 & Integer.MAX_VALUE;
                            int n5 = n4++;
                            cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
                        }
                        return new String(cArray);
                    }
                    return null;
                }
            };
            new Thread(task).start();
        });
        this.getChildren().addAll((Node[])new Node[]{hBox, hBox2, this.u, label2});
        I18n.a(() -> {
            this.q.setText(I18n.a("regedit.btn"));
            textField.setPromptText(I18n.a("mod.searchPrompt"));
            textArea10.setPromptText(I18n.a("regedit.mountedPrompt"));
            textArea.setPromptText(I18n.a("regedit.arcPrompt"));
            textArea5.setPromptText(I18n.a("regedit.diPrompt"));
            textArea13.setPromptText(I18n.a("regedit.startupPrompt"));
            textArea2.setPromptText(I18n.a("regedit.bamPrompt"));
            textArea6.setPromptText(I18n.a("regedit.disallowRunPrompt"));
            textArea14.setPromptText(I18n.a("regedit.taskkillPrompt"));
            textArea4.setPromptText(I18n.a("regedit.cmdColorPrompt"));
            textArea11.setPromptText(I18n.a("regedit.prefetchParamsPrompt"));
            textArea3.setPromptText(I18n.a("regedit.certsPrompt"));
            textArea8.setPromptText(I18n.a("regedit.gpoPrompt"));
            textArea7.setPromptText(I18n.a("regedit.firewallPrompt"));
            textArea15.setPromptText(I18n.a("regedit.urlBlockPrompt"));
            textArea16.setPromptText(I18n.a("regedit.winrarStegoPrompt"));
            textArea9.setPromptText(I18n.a("regedit.inetZonesPrompt"));
            textArea12.setPromptText(I18n.a("regedit.recentDocsPrompt"));
            toggleButton.setText(I18n.a("regedit.arcTab"));
            toggleButton2.setText(I18n.a("regedit.bamTab"));
            toggleButton3.setText(I18n.a("regedit.certsTab"));
            toggleButton4.setText(I18n.a("regedit.cmdColorTab"));
            toggleButton5.setText(I18n.a("regedit.diTab"));
            toggleButton6.setText(I18n.a("regedit.disallowRunTab"));
            toggleButton7.setText(I18n.a("regedit.firewallTab"));
            toggleButton8.setText(I18n.a("regedit.gpoTab"));
            toggleButton9.setText(I18n.a("regedit.inetZonesTab"));
            toggleButton10.setText(I18n.a("regedit.mountedTab"));
            toggleButton11.setText(I18n.a("regedit.prefetchParamsTab"));
            toggleButton12.setText(I18n.a("regedit.recentDocsTab"));
            toggleButton13.setText(I18n.a("regedit.startupTab"));
            toggleButton14.setText(I18n.a("regedit.taskkillTab"));
            toggleButton15.setText(I18n.a("regedit.urlBlockTab"));
            toggleButton16.setText(I18n.a("regedit.winrarStegoTab"));
            label2.setText(I18n.a("regedit.statusReady"));
        });
    }

    private TextArea a(String string) {
        TextArea textArea = new TextArea();
        textArea.setEditable(false);
        textArea.setPromptText(string);
        textArea.setStyle("-fx-font-family: 'Consolas'; -fx-font-size: 13px;");
        VBox.setVgrow(textArea, Priority.ALWAYS);
        return textArea;
    }

    private ToggleButton a(String string, TextArea textArea) {
        ToggleButton toggleButton = new ToggleButton(string);
        toggleButton.setToggleGroup(this.r);
        toggleButton.setFocusTraversable(false);
        toggleButton.getStyleClass().add("small");
        VBox vBox = new VBox(textArea);
        vBox.setPadding(new Insets(5.0));
        VBox.setVgrow(textArea, Priority.ALWAYS);
        VBox.setVgrow(vBox, Priority.ALWAYS);
        this.v.put(toggleButton, vBox);
        this.s.getChildren().add(toggleButton);
        this.u.getChildren().add(vBox);
        vBox.setVisible(false);
        vBox.setManaged(false);
        toggleButton.setOnAction(actionEvent -> {
            if (!toggleButton.isSelected()) {
                toggleButton.setSelected(true);
                return;
            }
            this.a(toggleButton);
            Platform.runLater(() -> {
                double d2;
                double d3 = toggleButton.getBoundsInParent().getMinX();
                double d4 = this.s.getWidth();
                if (d4 > (d2 = this.t.getViewportBounds().getWidth())) {
                    double d5 = Math.max(0.0, Math.min(1.0, (d3 - d2 / 3.0) / (d4 - d2)));
                    this.t.setHvalue(d5);
                }
            });
        });
        return toggleButton;
    }

    private void a(ToggleButton toggleButton) {
        for (Map.Entry<ToggleButton, VBox> entry : this.v.entrySet()) {
            boolean bl = entry.getKey() == toggleButton;
            entry.getValue().setVisible(bl);
            entry.getValue().setManaged(bl);
        }
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
        this.q.fire();
    }

    public boolean b() {
        return this.q.isDisabled();
    }

    private static /* synthetic */ String _ji(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0xAD;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 425056521 + 1139577647 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


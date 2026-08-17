/*
 * Decompiled with CFR 0.152.
 */
package b;

import java.util.ArrayList;
import java.util.List;

public class p {
    private final String a;
    private final String b;

    public p(String string, String string2) {
        this.a = string;
        this.b = string2;
    }

    public String getDisplayName() {
        return this.a;
    }

    public String getValue() {
        return this.b;
    }

    public String toString() {
        return this.a;
    }

    public static List<p> getClassTemplates() {
        ArrayList<p> arrayList = new ArrayList<p>();
        arrayList.add(new p("Wurst", "wurst|wurstclient|net/wurstclient|wurst_128.png"));
        arrayList.add(new p("Meteor", "meteor|meteorclient|meteordevelopment/meteor|meteor.png"));
        arrayList.add(new p("Doomsday", "net/java/m.class|net/java/l.class|mod_d|5GFV7P3VIM5AK|000"));
        arrayList.add(new p("Grim", "whale/beluga|ops/ec/api"));
        arrayList.add(new p("ThunderHack", "thunder/hack|thunderhack/meteordevelopment"));
        arrayList.add(new p("Prestige", "prestige|prestige/client|dev/zprestige"));
        arrayList.add(new p("Catlean", "catlean|catleankt|su/catlean"));
        arrayList.add(new p("Inertia", "inertia|inertiatextatlas.png"));
        arrayList.add(new p("Aristois", "me/deftware/aristois|me/deftware/client"));
        arrayList.add(new p("BleachHack", "org/bleachhack|bleachhack"));
        arrayList.add(new p("LiquidBounce", "net/ccbluex/liquidbounce|liquidbounce"));
        arrayList.add(new p("Phantom", "lol/lwes"));
        arrayList.add(new p("Krypton", "dev/FORE"));
        arrayList.add(new p("PulseClient", "xyz/qweru/pulse"));
        arrayList.add(new p("Zenith", "zenith/zov"));
        arrayList.add(new p("Argon", "dev/potato/lucid|dev/potato"));
        arrayList.add(new p("Mathax", "mathax"));
        arrayList.add(new p("Baritone", "baritone"));
        arrayList.add(new p("Autototem", "autototem|auto_totem|smartoffhand|autototemclient"));
        arrayList.add(new p("Ares", "ares"));
        arrayList.add(new p("Vape", "vape|vapeclient|vape.gg"));
        arrayList.add(new p("Jex", "jex"));
        arrayList.add(new p("Impact", "impactclient|impact"));
        arrayList.add(new p("Sigma", "sigma"));
        arrayList.add(new p("Nursultan", "nursultan"));
        arrayList.add(new p("Celestial", "celestial"));
        arrayList.add(new p("RusherHack", "rusherhack"));
        arrayList.add(new p("SalHack", "salhack"));
        arrayList.add(new p("FutureClient", "futureclient|future client"));
        arrayList.add(new p("Nuclear", "nuclear"));
        arrayList.add(new p("ArvionClient", "arvionclient|arvion"));
        arrayList.add(new p("SoulClient", "soulclient"));
        arrayList.add(new p("Vanadium", "vanadium"));
        arrayList.add(new p("Wexside", "wexside"));
        arrayList.add(new p("DamaClient", "damaclient|dama"));
        arrayList.add(new p("InventoryProfilesNext", "anti_ad|InventoryProfiles|inventoryprofilesnext"));
        arrayList.add(new p("InvMove", "\u0131nvmove|invmove|\u0131nvmoveconfig"));
        arrayList.add(new p("Tweakeroo", "tweakeroo"));
        arrayList.add(new p("akaTweaks", "akatriggered|aka_hotkey_manager"));
        arrayList.add(new p("Freecam", "freecam"));
        return arrayList;
    }

    public static List<p> getUSNTemplates() {
        ArrayList<p> arrayList = new ArrayList<p>();
        arrayList.add(new p("ConsoleHostHistory", "ConsoleHost_history.txt"));
        arrayList.add(new p("JavaLauncher", "JavaLauncher"));
        arrayList.add(new p("Alts", "accounts.json"));
        arrayList.add(new p("Prefetch", ".pf"));
        arrayList.add(new p("Wurst", "wurst"));
        arrayList.add(new p("Meteor", "meteor"));
        arrayList.add(new p("Grim", "grim"));
        arrayList.add(new p("ThunderHack", "thunderhack"));
        arrayList.add(new p("Prestige", "prestige"));
        arrayList.add(new p("Catlean", "catlean"));
        arrayList.add(new p("Inertia", "inertia"));
        arrayList.add(new p("Mathax", "mathax"));
        arrayList.add(new p("Baritone", "baritone"));
        arrayList.add(new p("Autototem", "autototem"));
        arrayList.add(new p("MouseTweaks", "mousetweaks"));
        arrayList.add(new p("InventoryProfilesNext", "inventoryprofilesnext"));
        arrayList.add(new p("InvMove", "invmove"));
        arrayList.add(new p("Tweakeroo", "tweakeroo"));
        arrayList.add(new p("akaTweaks", "akatweaks"));
        arrayList.add(new p("Freecam", "freecam"));
        return arrayList;
    }

    public static List<p> getFolderTemplates() {
        ArrayList<p> arrayList = new ArrayList<p>();
        arrayList.add(new p("template.folder.disks", "__ALL_DISKS__"));
        String string = System.getenv("APPDATA");
        String string2 = System.getProperty("user.home");
        if (string != null) {
            arrayList.add(new p("template.folder.casual", string + "\\.minecraft\\mods"));
        }
        if (string != null) {
            arrayList.add(new p("template.folder.feather", string + "\\.feather\\user-mods"));
        }
        if (string != null) {
            arrayList.add(new p("template.folder.modrinth", string + "\\ModrinthApp\\profiles"));
        }
        if (string2 != null) {
            arrayList.add(new p("template.folder.lunar", string2 + "\\.lunarclient\\profiles"));
        }
        if (string != null) {
            arrayList.add(new p("template.folder.appdata", string));
        }
        if (string2 != null) {
            arrayList.add(new p("template.folder.desktop", string2 + "\\Desktop"));
        }
        if (string2 != null) {
            arrayList.add(new p("template.folder.onedrive", string2 + "\\OneDrive"));
        }
        if (string2 != null) {
            arrayList.add(new p("template.folder.downloads", string2 + "\\Downloads"));
        }
        return arrayList;
    }

    private static /* synthetic */ String _ux(String string, int n2) {
        if (string != null) {
            char[] cArray = string.toCharArray();
            int n3 = n2 ^ 0x33;
            int n4 = 0;
            while (n4 < cArray.length) {
                n3 = n3 * 1214325029 + 823686373 & Integer.MAX_VALUE;
                int n5 = n4++;
                cArray[n5] = (char)(cArray[n5] ^ n3 & 0xFF);
            }
            return new String(cArray);
        }
        return null;
    }
}


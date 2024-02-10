import { Platform } from "./Platform.ts";
import { PlatformManager } from "./PlatformManager.ts";

const ps5 = new Platform("Playstation 5", "PS5");
ps5.addAlias(["PS5", "Playstation5", "PlayStation 5"]);
const ps4 = new Platform("Playstation 4", "PS4");
ps4.addAlias(["PS4", "Playstation4", "PlayStation 4"]);
const psvr = new Platform("Playstation VR", "PSVR");
psvr.addAlias(["PSVR", "PS VR", "PlayStation VR"]);
const psvr2 = new Platform("Playstation VR 2", "PSVR2");
psvr2.addAlias(["PSVR 2", "PlayStation VR 2", "PlayStation VR2"]);
const ninSwitch = new Platform("Nintendo Switch", "NS");
ninSwitch.addAlias(["Switch", "NS"]);
const xs = new Platform("Xbox Series X/S", "XBS");
xs.addAlias(["XSX", "Xbox Series S", "Xbox Series X", "XSS"]);
const xbo = new Platform("Xbox One", "XBO");
xbo.addAlias(["XBO"]);
const stadia = new Platform("Google Stadia", "GS");
stadia.addAlias("Stadia");
const android = new Platform("Android", "Droid");
android.addAlias(["Droid"]);
const ios = new Platform("iOS", "iOS");
const oculusQuest = new Platform("Oculus Quest", "OQ");
oculusQuest.addAlias(["Quest 3", "Quest 2", "Quest"]);
const windows = new Platform("Microsoft Windows", "Win");
windows.addAlias(["Win", "PC"]);
const linux = new Platform("Linux", "Lin");
linux.addAlias(["Lin"]);
const macintosh = new Platform("Macintosh", "Mac");
macintosh.addAlias(["Mac"]);

export const PLATFORM_MANAGER = new PlatformManager();

PLATFORM_MANAGER.add([
  ps5,
  ps4,
  psvr,
  psvr2,
  ninSwitch,
  xs,
  xbo,
  stadia,
  android,
  ios,
  oculusQuest,
  windows,
  linux,
  macintosh,
]);

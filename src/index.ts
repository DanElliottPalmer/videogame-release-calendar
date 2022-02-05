import { GamesRadarFetcher } from './fetchers/GamesRadarFetcher.js';
import { TechRadarFetcher } from './fetchers/TechRadarFetcher.js';
import { Platform } from './Platform.js';
import { PlatformManager } from './PlatformManager.js';

const ps5 = new Platform('Playstation 5');
ps5.addKnownAs(['PS5', 'Playstation5']);
const ps4 = new Platform('Playstation 4');
ps4.addKnownAs(['PS4', 'Playstation4']);
const pc = new Platform('PC');
const ninSwitch = new Platform('Nintendo Switch');
ninSwitch.addKnownAs(['Switch']);
const xsx = new Platform('Xbox Series X');
xsx.addKnownAs(['XSX']);
const xss = new Platform('Xbox Series S');
xss.addKnownAs(['XSS']);
const xbo = new Platform('Xbox One');
xbo.addKnownAs(['XBO']);
const stadia = new Platform('Google Stadia');
stadia.addKnownAs('Stadia');

const manager = new PlatformManager();
manager.add([ps5, ps4, pc, ninSwitch, xsx, xss, xbo, stadia]);

async function init() {
  // const a = new GamesRadarFetcher();
  // await a.request();
  // console.log(a.extract(manager));
  const a = new TechRadarFetcher();
  await a.request();
  console.log(a.extract(manager));
}

init();

import type { PageFetcher } from './fetchers/PageFetcher.js';
import type { VideoGame } from './VideoGame.js';
import { GamesRadarFetcher } from './fetchers/GamesRadarFetcher.js';
import { TechRadarFetcher } from './fetchers/TechRadarFetcher.js';
import { Platform } from './Platform.js';
import { PlatformManager } from './PlatformManager.js';

const ps5 = new Platform('Playstation 5');
ps5.addKnownAs(['PS5', 'Playstation5']);
const ps4 = new Platform('Playstation 4');
ps4.addKnownAs(['PS4', 'Playstation4']);
const psvr = new Platform('Playstation VR');
psvr.addKnownAs(['PSVR', 'PS VR']);
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
const android = new Platform('Android');
const ios = new Platform('iOS');
const oculusQuest = new Platform('Oculus Quest');
oculusQuest.addKnownAs(['Quest 2']);

const manager = new PlatformManager();
manager.add([
  ps5,
  ps4,
  pc,
  ninSwitch,
  xsx,
  xss,
  xbo,
  stadia,
  android,
  ios,
  oculusQuest,
]);

type Bigrams = Set<string>;

function getBigrams(str: string): Bigrams {
  const bigrams: Bigrams = new Set();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

function intersect(set1: Bigrams, set2: Bigrams): Bigrams {
  return new Set([...set1].filter((x) => set2.has(x)));
}

// Sørensen–Dice coefficient
function diceCoefficient(str1: string, str2: string): number {
  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);
  return (
    (2 * intersect(bigrams1, bigrams2).size) / (bigrams1.size + bigrams2.size)
  );
}

async function init() {
  let allGames: Array<VideoGame> = [];
  const fetchers: Array<PageFetcher> = [
    new GamesRadarFetcher(),
    new TechRadarFetcher(),
  ];
  let fetcher: PageFetcher;
  for (let i = 0; i < fetchers.length; i++) {
    fetcher = fetchers[i] as PageFetcher;
    await fetcher.request();
    allGames = allGames.concat(fetcher.extract(manager));
  }

  const uniqueGames = [];
  const mergedList: Set<number> = new Set();
  const threshold = 0.85;
  for (let i = 0; i < allGames.length; i++) {
    if (mergedList.has(allGames[i].id)) continue;
    for (let j = i + 1; j < allGames.length; j++) {
      if (i === j) continue;
      if (mergedList.has(allGames[j].id)) continue;
      const cleanName1 = allGames[i].name
        .toLowerCase()
        .replace(/[^\w\d\s]+/gi, '');
      const cleanName2 = allGames[j].name
        .toLowerCase()
        .replace(/[^\w\d\s]+/gi, '');
      const value = diceCoefficient(cleanName1, cleanName2);
      if (value > threshold) {
        // console.log(allGames[i].name, ',', allGames[j].name, value);
        allGames[i].merge(allGames[j]);
        mergedList.add(allGames[j].id);
      }
    }
    uniqueGames.push(allGames[i]);
  }

  console.log(uniqueGames.map((game) => game.toJSON()));
}

init();

// console.log(diceCoefficient('Elex 2', 'Elex II'));

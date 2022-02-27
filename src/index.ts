import type { PageFetcher } from './fetchers/PageFetcher.js';
import type { VideoGame } from './VideoGame.js';
import { GamesRadarFetcher } from './fetchers/GamesRadarFetcher.js';
import { TechRadarFetcher } from './fetchers/TechRadarFetcher.js';
import { GameInformerFetcher } from './fetchers/GameInformerFetcher.js';
import { Platform } from './Platform.js';
import { PlatformManager } from './PlatformManager.js';

const ps5 = new Platform('Playstation 5');
ps5.addKnownAs(['PS5', 'Playstation5', 'PlayStation 5']);
const ps4 = new Platform('Playstation 4');
ps4.addKnownAs(['PS4', 'Playstation4', 'PlayStation 4']);
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
oculusQuest.addKnownAs(['Quest 2', 'Quest']);

const manager = new PlatformManager();
manager.add([
  ps5,
  ps4,
  psvr,
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

async function init() {
  let allGames: Array<VideoGame> = [];
  const fetchers: Array<PageFetcher> = [
    new GamesRadarFetcher(),
    new TechRadarFetcher(),
    new GameInformerFetcher(),
  ];
  let fetcher: PageFetcher;
  for (let i = 0; i < fetchers.length; i++) {
    fetcher = fetchers[i] as PageFetcher;
    await fetcher.request();
    allGames = allGames.concat(fetcher.extract(manager));
  }

  const mergedGames: Set<number> = new Set();
  const similarThreshold = 0.85;
  const gameLength = allGames.length;
  let gameScore: number;
  for (let i = 0; i < gameLength; i++) {
    const gameA = allGames[i] as VideoGame;

    for (let j = i + 1; j < gameLength; j++) {
      const gameB = allGames[j] as VideoGame;
      // Already merged this game, so we can skip
      if (mergedGames.has(gameB.id)) continue;

      gameScore = gameA.compareName(gameB);
      if (gameScore >= similarThreshold) {
        // console.log(game.name, ',', similarGame.name, score);
        gameA.merge(gameB);
        mergedGames.add(gameB.id);
      }
    }
  }

  const uniqueGames: Array<VideoGame> = allGames.filter((game) => {
    return !mergedGames.has(game.id);
  });

  console.log(uniqueGames.map((game) => game.toJSON()));
}

init();

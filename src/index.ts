import type { PageFetcher } from './fetchers/PageFetcher.js';
import type { VideoGame } from './VideoGame.js';
import { GamesRadarFetcher } from './fetchers/GamesRadarFetcher.js';
import { TechRadarFetcher } from './fetchers/TechRadarFetcher.js';
import { GameInformerFetcher } from './fetchers/GameInformerFetcher.js';
import { WikipediaFetcher } from './fetchers/WikipediaFetcher.js';
import { MetacriticFetcher } from './fetchers/MetacriticFetcher.js';
import { Platform } from './Platform.js';
import { PlatformManager } from './PlatformManager.js';
import {
  convertEntryToICalEntry,
  createCalendar,
  ICalEntry,
  monthNames,
} from './utils/calendar.js';
import { renderICalTemplate, renderPageTemplate } from './utils/render.js';

const ps5 = new Platform('Playstation 5', 'PS5');
ps5.addKnownAs(['PS5', 'Playstation5', 'PlayStation 5']);
const ps4 = new Platform('Playstation 4', 'PS4');
ps4.addKnownAs(['PS4', 'Playstation4', 'PlayStation 4']);
const psvr = new Platform('Playstation VR', 'PSVR');
psvr.addKnownAs(['PSVR', 'PS VR', 'PlayStation VR']);
const psvr2 = new Platform('Playstation VR 2', 'PSVR2');
psvr2.addKnownAs(['PSVR 2', 'PlayStation VR 2', 'PlayStation VR2']);
const ninSwitch = new Platform('Nintendo Switch', 'NS');
ninSwitch.addKnownAs(['Switch', 'NS']);
const xs = new Platform('Xbox Series X/S', 'XBS');
xs.addKnownAs(['XSX', 'Xbox Series S', 'Xbox Series X', 'XSS']);
const xbo = new Platform('Xbox One', 'XBO');
xbo.addKnownAs(['XBO']);
const stadia = new Platform('Google Stadia', 'GS');
stadia.addKnownAs('Stadia');
const android = new Platform('Android', 'Droid');
android.addKnownAs(['Droid']);
const ios = new Platform('iOS', 'iOS');
const oculusQuest = new Platform('Oculus Quest', 'OQ');
oculusQuest.addKnownAs(['Quest 2', 'Quest']);
const windows = new Platform('Microsoft Windows', 'Win');
windows.addKnownAs(['Win', 'PC']);
const linux = new Platform('Linux', 'Lin');
linux.addKnownAs(['Lin']);
const macintosh = new Platform('Macintosh', 'Mac');
macintosh.addKnownAs(['Mac']);

const manager = new PlatformManager();
manager.add([
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

async function init() {
  let allGames: Array<VideoGame> = [];
  const fetchers: Array<PageFetcher> = [
    new GamesRadarFetcher(),
    new TechRadarFetcher(),
    new GameInformerFetcher(),
    new WikipediaFetcher(),
    new MetacriticFetcher(),
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
        gameA.merge(gameB);
        mergedGames.add(gameB.id);
      }
    }
  }

  const uniqueGames: Array<VideoGame> = allGames.filter((game) => {
    return !mergedGames.has(game.id);
  });

  // console.log(uniqueGames.map((game) => game.toJSON()));
  const calendar = createCalendar(manager, uniqueGames);

  const lastUpdated = new Date(Date.now());
  // const currentMonth = monthNames[lastUpdated.getMonth()] as string;
  const currentMonth = monthNames[11] as string;
  const availablePlatforms = Array.from(manager).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  renderPageTemplate({
    availablePlatforms,
    calendar,
    currentMonth,
    lastUpdated,
    sources: fetchers.map((fetcher) => ({
      name: fetcher.name,
      url: fetcher.homepageUrl,
    })),
  });

  const icalEntries: Array<ICalEntry> = [];
  calendar.months.forEach((month) => {
    month.entries.forEach((entry) => {
      icalEntries.push(convertEntryToICalEntry(entry));
    });
  });
  renderICalTemplate({ entries: icalEntries });
}

init();

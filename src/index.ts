import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// type LongMonth = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';
// type Platform = 'PC' | 'Playstation 4' | 'Playstation 5' | 'Xbox Series X' | 'Xbox Series S' | 'Stadia' | 'Nintendo Switch'

class VideoGame {
  readonly name: string;
  readonly platforms: Array<Platform> = [];
  readonly releaseDates: Array<Date> = [];

  constructor(name: string) {
    this.name = name;
  }

  addPlatform(platform: Platform): void;
  addPlatform(platforms: Array<Platform>): void;
  addPlatform(platforms: unknown): void {
    if (Array.isArray(platforms)) {
      this.platforms.push(...platforms);
    } else if (platforms instanceof Platform) {
      this.platforms.push(platforms);
    }
  }

  addReleaseDate(date: Date) {
    this.releaseDates.push(date);
  }
}

class Platform {
  readonly name: string;
  readonly knownAs: Set<string> = new Set();

  constructor(name: string) {
    this.name = name;
    this.addKnownAs(name);
  }

  addKnownAs(name: string): void;
  addKnownAs(names: Array<string>): void;
  addKnownAs(names: unknown): void {
    if (Array.isArray(names)) {
      names.forEach((name) => this.knownAs.add(name));
    } else if (typeof names === 'string') {
      this.knownAs.add(names);
    }
  }
}

class PlatformManager {
  private platforms: Array<Platform> = [];

  add(platform: Platform): void;
  add(platforms: Array<Platform>): void;
  add(platforms: unknown): void {
    if (Array.isArray(platforms)) {
      this.platforms.push(...platforms);
    } else if (platforms instanceof Platform) {
      this.platforms.push(platforms);
    }
  }

  resolve(name: string): Platform | undefined {
    return this.platforms.find((platform) => {
      return platform.knownAs.has(name);
    });
  }
}

const ps5 = new Platform('Playstation 5');
ps5.addKnownAs(['PS5', 'Playstation5']);
const ps4 = new Platform('Playstation 4');
ps4.addKnownAs(['PS4', 'Playstation4']);
const pc = new Platform('PC');
const ninSwitch = new Platform('Nintendo Switch');
ninSwitch.addKnownAs(['Switch']);
const xsx = new Platform('Xbox Series X');
xsx.addKnownAs(['XSX']);
const xbo = new Platform('Xbox One');
xbo.addKnownAs(['XBO']);
const stadia = new Platform('Google Stadia');
stadia.addKnownAs('Stadia');

const manager = new PlatformManager();
manager.add([ps5, ps4, pc, ninSwitch, xsx, xbo, stadia]);

abstract class PageFetcher {
  protected games: Array<VideoGame> = [];
  protected body: string;
  protected url: string;

  public abstract extract(): void;

  public async request(): Promise<string> {
    const response = await fetch(this.url);
    this.body = await response.text();
    return this.body;
  }
}

function findNextSiblingTagName(
  el: Element,
  tagName: string,
): Element | undefined {
  let child: Element | null = el;
  while (true) {
    child = child.nextElementSibling;
    if (child === null) return undefined;
    if (child.tagName === tagName) return child;
  }
}

class GamesRadarFetcher extends PageFetcher {
  protected url: string =
    'https://www.gamesradar.com/uk/video-game-release-dates/';

  private processDate(dateString: string): Date | undefined {
    const thisYear = new Date().getFullYear();
    const dateValue = Date.parse(`${dateString} ${thisYear}`);
    const date = new Date(dateValue);
    if (isNaN(date.valueOf())) return undefined;
    return date;
  }

  private processPlatforms(platformString: string): Array<Platform> {
    // Example: [PC, PS5, XSX, PS4]
    // Trim off '[' and  ']'
    const tidyString: string = platformString.substring(
      1,
      platformString.length - 1,
    );
    // Split into individual items
    const platformStrings: Array<string> = tidyString.split(', ');
    const platforms: Array<Platform> = [];
    platformStrings.forEach((str) => {
      const platform = manager.resolve(str);
      if (platform) {
        platforms.push(platform);
      } else {
        console.log(`Unknown platform: ${str}`);
      }
    });
    return platforms;
  }

  public extract() {
    this.games.length = 0;
    const dom = new JSDOM(this.body);
    // Find all headings - february-2022-video-game-releases
    const headings = dom.window.document.querySelectorAll(
      '[id$="-video-game-releases"]',
    );
    const re =
      /(.+) (\[.+\]) – ((?:january|february|march|april|may|june|july|august|september|october|november|december) [\d]+)/i;
    headings.forEach((heading: Element) => {
      // Get the next sibling that is a <ul>
      const gameList = findNextSiblingTagName(heading, 'UL');
      if (gameList === undefined) return;
      // Get each list item
      const listItems = gameList.querySelectorAll(':scope li');
      // Parse
      listItems.forEach((listItem: Element) => {
        let text: string | null = listItem.textContent;
        if (text === null) return;
        text = text.trim();
        // Rows are typically structured as:
        // Game [Platform, Platform] - Month Day
        // We want to ignore are dates that are TBC or do not contain one of
        // our months.
        let matches: RegExpMatchArray | null = text.match(re);
        if (matches === null) return;
        const [, gameName, gamePlatforms, gameReleaseDate] = matches;
        const platforms = this.processPlatforms(gamePlatforms as string);
        const releaseDate = this.processDate(gameReleaseDate as string);
        if (gameName && platforms.length > 0 && releaseDate) {
          const videoGame = new VideoGame(gameName);
          videoGame.addPlatform(platforms);
          videoGame.addReleaseDate(releaseDate);
          this.games.push(videoGame);
        }
      });
    });
    return this.games;
  }
}

async function init() {
  const a = new GamesRadarFetcher();
  await a.request();
  console.log(a.extract());
}

init();

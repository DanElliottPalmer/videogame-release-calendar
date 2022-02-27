import type { Platform } from '../Platform.js';
import type { PlatformManager } from '../PlatformManager.js';
import { JSDOM } from 'jsdom';
import { VideoGame } from '../VideoGame.js';
import { PageFetcher } from './PageFetcher.js';

export class GameInformerFetcher extends PageFetcher {
  protected url: string = 'https://www.gameinformer.com/2022';

  private processDate(dateString: string): Date | undefined {
    const thisYear = new Date().getFullYear();
    // TODO: regions? tmz?
    const dateValue = Date.parse(`${dateString} ${thisYear} 00:00:00 UTC`);
    const date = new Date(dateValue);
    if (isNaN(date.valueOf())) return undefined;
    return date;
  }

  private processPlatforms(
    manager: PlatformManager,
    platformString: string,
  ): Array<Platform> {
    // Example: (PC, PS5, XSX, PS4)
    // Trim off '(' and  ')'
    const tidyString: string = platformString.substring(
      1,
      platformString.length - 1,
    );
    // Split into individual items
    const platformStrings: Array<string> = tidyString
      .split(', ')
      .flatMap((str) => {
        if (str === 'Xbox Series X/S')
          return ['Xbox Series X', 'Xbox Series S'];
        return str;
      });
    const platforms: Array<Platform> = [];
    platformStrings.forEach((str) => {
      const platform = manager.resolve(str);
      if (platform) {
        platforms.push(platform);
      } else {
        console.log(`Unknown platform: "${str}"`);
      }
    });
    return platforms;
  }

  public extract(manager: PlatformManager): Array<VideoGame> {
    this.games.length = 0;
    const dom = new JSDOM(this.body);
    // Find all entries - .calendar_entry
    const entries = dom.window.document.querySelectorAll('.calendar_entry');
    const re =
      /(.+)\s+(\(.+\))\s+[–\-]\s+((?:january|february|march|april|may|june|july|august|september|october|november|december) [\d]+)/i;
    entries.forEach((entry: Element) => {
      let text: string | null = entry.textContent;
      if (text === null) return;
      text = text.trim();
      let matches: RegExpMatchArray | null = text.match(re);
      if (matches === null) return;
      const [, gameName, gamePlatforms, gameReleaseDate] = matches;
      const name = (gameName as string).trim();
      const platforms = this.processPlatforms(manager, gamePlatforms as string);
      const releaseDate = this.processDate(gameReleaseDate as string);
      if (name && platforms.length > 0 && releaseDate) {
        const videoGame = new VideoGame(name);
        platforms.forEach((platform) => {
          videoGame.addReleaseDate(platform, releaseDate);
        });
        this.games.push(videoGame);
      }
    });
    return this.games;
  }
}

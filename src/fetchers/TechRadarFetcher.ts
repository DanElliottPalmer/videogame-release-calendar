import type { PlatformManager } from '../PlatformManager.js';
import { JSDOM } from 'jsdom';
import { VideoGame } from '../VideoGame.js';
import { Platform } from '../Platform.js';
import { findNextSiblingMatches } from './utils.js';
import { PageFetcher } from './PageFetcher.js';

export class TechRadarFetcher extends PageFetcher {
  public readonly name: string = 'TechRadar';
  public readonly url: string =
    'https://www.techradar.com/au/news/upcoming-games-2022-release-dates';

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
        if (str === 'XSX/S') return ['Xbox Series X', 'Xbox Series S'];
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

    const headings = dom.window.document.querySelectorAll(
      '[id^="section-upcoming-games-in-"]',
    );
    const re =
      /(.+)\s+[–-]\s+((?:january|february|march|april|may|june|july|august|september|october|november|december) [\d]+) (\(.+\))/i;
    headings.forEach((heading: HTMLElement) => {
      // Get the next sibling that is a <ul>
      const gameList = findNextSiblingMatches(heading, 'UL');
      if (gameList === undefined) return;
      // Get each list item
      const listItems = gameList.querySelectorAll(':scope li');
      // Parse
      listItems.forEach((listItem: HTMLElement) => {
        let text: string | null = listItem.textContent;
        if (text === null) return;
        text = text.trim();
        // Rows are typically structured as:
        // Game - Month Day (Platform, Platform)
        // We want to ignore are dates that are TBC or do not contain one of
        // our months.
        let matches: RegExpMatchArray | null = text.match(re);
        if (matches === null) return;
        const [, gameName, gameReleaseDate, gamePlatforms] = matches;
        const platforms = this.processPlatforms(
          manager,
          gamePlatforms as string,
        );
        const releaseDate = this.processDate(gameReleaseDate as string);
        if (gameName && platforms.length > 0 && releaseDate) {
          const videoGame = new VideoGame(gameName);
          platforms.forEach((platform) => {
            videoGame.addReleaseDate(platform, releaseDate);
          });
          this.games.push(videoGame);
        }
      });
    });
    return this.games;
  }
}

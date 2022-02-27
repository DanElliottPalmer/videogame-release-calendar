import type { Platform } from '../Platform.js';
import type { PlatformManager } from '../PlatformManager.js';
import { JSDOM } from 'jsdom';
import { VideoGame } from '../VideoGame.js';
import { PageFetcher } from './PageFetcher.js';
import { findNextSiblingMatches } from './utils.js';

export class WikipediaFetcher extends PageFetcher {
  protected url: string =
    'https://en.wikipedia.org/wiki/2022_in_video_games#Series_with_new_entries';

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
    // Example: Win, NS, PS4, PS5
    // Split into individual items
    const platformStrings: Array<string> = platformString.split(', ');
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

  protected getWikitables(): Array<Element> {
    const dom = new JSDOM(this.body);
    const tables: Array<Element> = [];
    let node =
      dom.window.document.querySelector('h3 #January–March').parentNode;
    while (true) {
      node = findNextSiblingMatches(node, 'table.wikitable, h3');
      if (node && node.querySelector('#Unscheduled_releases')) break;
      if (node && node.tagName !== 'TABLE') continue;
      tables.push(node);
    }
    return tables;
  }

  protected getCellsFromRow(row: Element): Array<string> {
    return Array.from(row.querySelectorAll('td')).map(
      (cell: Element, index: number) => {
        const italicText = cell.querySelector('i');
        let cellValue: string;
        if (italicText) {
          cellValue = italicText.textContent;
        } else {
          cellValue = cell.textContent;
        }
        return cellValue.trim();
      },
    );
  }

  public extract(manager: PlatformManager): Array<VideoGame> {
    this.games.length = 0;

    const tables = this.getWikitables();
    tables.forEach((table: Element) => {
      const rows = table.querySelectorAll('tr');
      let month: string;
      let dateNumber: number;
      let gameName: string;
      rows.forEach((row: Element, index: number) => {
        // Ignore first row as it is header columns
        if (index === 0) return;
        const cells = this.getCellsFromRow(row);
        let gamePlatforms: string;
        switch (cells.length) {
          case 8:
            month = cells[0];
            dateNumber = parseInt(cells[1], 10);
            gameName = cells[2];
            gamePlatforms = cells[3];
            break;
          case 7:
            dateNumber = parseInt(cells[0], 10);
            gameName = cells[1];
            gamePlatforms = cells[2];
            break;
          case 6:
            gameName = cells[0];
            gamePlatforms = cells[1];
            break;
        }

        // If we have NaN, it means we got a TBA. Skip the row.
        if (isNaN(dateNumber)) return;

        const name = gameName.trim();
        const platforms = this.processPlatforms(manager, gamePlatforms);
        const releaseDate = this.processDate(`${dateNumber} ${month}`);

        if (name && platforms.length > 0 && releaseDate) {
          const videoGame = new VideoGame(name);
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

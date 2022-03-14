import type { Platform } from '../Platform.js';
import type { PlatformManager } from '../PlatformManager.js';
import { JSDOM } from 'jsdom';
import { VideoGame } from '../VideoGame.js';
import { WebPage, PageFetcher } from './PageFetcher.js';
import { findNextSiblingMatches } from './utils.js';

export class WikipediaFetcher extends PageFetcher {
  public readonly name: string = 'Wikipedia';
  public readonly homepageUrl: string = 'https://en.wikipedia.org/';

  protected urls: Array<string> = [
    'https://en.wikipedia.org/wiki/2022_in_video_games#Series_with_new_entries',
  ];

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

  protected getWikitables(page: WebPage): Array<Element> {
    const dom = new JSDOM(page.body);
    const tables: Array<Element> = [];
    let node: HTMLElement | Element | null | undefined =
      dom.window.document.querySelector('h3 #January–March')?.parentElement;

    if (node) {
      while (true) {
        node = findNextSiblingMatches(node, 'table.wikitable, h3');
        if (node === undefined) break;
        if (node.querySelector(':scope #Unscheduled_releases')) break;
        if (node.tagName === 'H3') continue;
        if (node.tagName === 'TABLE') tables.push(node);
      }
    }
    return tables;
  }

  protected getCellsFromRow(row: Element): Array<string> {
    return Array.from(row.querySelectorAll('td')).map((cell: Element) => {
      if (!cell) return '';
      const italicText = cell.querySelector('i');
      if (!italicText) return '';
      let cellValue: string;
      if (italicText) {
        cellValue = italicText.textContent as string;
      } else {
        cellValue = cell.textContent as string;
      }
      return cellValue.trim();
    });
  }

  public extract(manager: PlatformManager): Array<VideoGame> {
    this.games.length = 0;

    for (const page of this.fetchedPages) {
      const tables = this.getWikitables(page);
      tables.forEach((table: Element) => {
        const rows = table.querySelectorAll('tr');
        let month: string;
        let dateNumber: number;
        let gameName: string;
        rows.forEach((row: Element, index: number) => {
          // Ignore first row as it is header columns
          if (index === 0) return;
          let cells = this.getCellsFromRow(row);
          let gamePlatforms: string;
          switch (cells.length) {
            case 8:
              month = cells[0] as string;
              dateNumber = parseInt(cells[1] as string, 10);
              gameName = cells[2] as string;
              gamePlatforms = cells[3] as string;
              break;
            case 7:
              dateNumber = parseInt(cells[0] as string, 10);
              gameName = cells[1] as string;
              gamePlatforms = cells[2] as string;
              break;
            default:
              gameName = cells[0] as string;
              gamePlatforms = cells[1] as string;
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
    }

    return this.games;
  }
}

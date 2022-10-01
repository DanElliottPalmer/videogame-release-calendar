import type { PlatformManager } from '../PlatformManager.js';
import { JSDOM } from 'jsdom';
import { VideoGame } from '../VideoGame.js';
import { WebPage, PageFetcher } from './PageFetcher.js';

export class MetacriticFetcher extends PageFetcher {
  public readonly name: string = 'Metacritic';
  public readonly homepageUrl: string = 'https://www.metacritic.com/';

  protected urls: Array<string> = [
    'https://www.metacritic.com/browse/games/release-date/available/ps5/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/ps5/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/available/ps4/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/ps4/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/available/xbox-series-x/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/xbox-series-x/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/available/xboxone/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/xboxone/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/available/switch/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/switch/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/available/stadia/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/stadia/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/available/ios/date?view=condensed',
    'https://www.metacritic.com/browse/games/release-date/coming-soon/ios/date?view=condensed',

    // Skipping PC for the moment as theres just too many PC games!
    // 'https://www.metacritic.com/browse/games/release-date/available/pc/date?view=condensed',
    // 'https://www.metacritic.com/browse/games/release-date/coming-soon/pc/date?view=condensed',
  ];

  protected async postfetch(page: WebPage): Promise<WebPage> {
    const dom = new JSDOM(page.body);
    const elDates = dom.window.document.querySelectorAll('td.details > span');
    const dates = Array.from(elDates).map((e) => new Date(e.textContent || ''));
    const firstDate = dates[0] as Date;
    const lastDate = dates[dates.length - 1] as Date;
    const lastYearDate = new Date(new Date().getFullYear() - 1, 11, 31);
    const nextYearDate = new Date(new Date().getFullYear() + 1, 0, 1);
    const isAscending = firstDate < lastDate;

    if (!isAscending && lastDate > lastYearDate) {
      const nextPageEl = dom.window.document.querySelector(
        '.flipper.next .action',
      );
      if (nextPageEl && nextPageEl.getAttribute('href')) {
        const nextPageUrl = nextPageEl.getAttribute('href');
        const fullUrl = `https://www.metacritic.com${nextPageUrl}`;
        this.fetchQueue.push(fullUrl);
      }
    } else if (isAscending && lastDate < nextYearDate) {
      const nextPageEl = dom.window.document.querySelector(
        '.flipper.next .action',
      );
      if (nextPageEl && nextPageEl.getAttribute('href')) {
        const nextPageUrl = nextPageEl.getAttribute('href');
        const fullUrl = `https://www.metacritic.com${nextPageUrl}`;
        this.fetchQueue.push(fullUrl);
      }
    }

    return page;
  }

  public extract(manager: PlatformManager): Array<VideoGame> {
    this.games.length = 0;

    const lastYearDate = new Date(
      new Date().getFullYear() - 1,
      11,
      31,
      0,
      0,
      0,
      0,
    );
    const nextYearDate = new Date(
      new Date().getFullYear() + 1,
      0,
      1,
      0,
      0,
      0,
      0,
    );

    for (const page of this.fetchedPages) {
      const dom = new JSDOM(page.body);
      const entries =
        dom.window.document.querySelectorAll('tr.expand_collapse');
      entries.forEach((entry) => {
        const gameName = entry.querySelector('.title h3')?.textContent?.trim();
        if (!gameName) return;

        const gamePlatform = entry
          .querySelector('.platform .data')
          ?.textContent?.trim();
        if (!gamePlatform) return;

        const gameReleaseDate = entry
          .querySelector('td.details > span')
          ?.textContent?.trim();
        if (!gameReleaseDate) return;
        const releaseDate = new Date(gameReleaseDate);

        if (releaseDate >= nextYearDate || releaseDate <= lastYearDate) return;

        const platform = manager.resolve(gamePlatform);
        if (!platform) {
          console.log(`${this.name} - Unknown platform: "${gamePlatform}"`);
          return;
        }

        // Find the Metacritic and User score
        const lblMetacriticScore = entry.querySelector(
          ':scope > .score .game',
        )?.textContent;
        let metacriticScore: number | undefined;
        if (lblMetacriticScore && lblMetacriticScore !== 'tbd') {
          metacriticScore = parseInt(lblMetacriticScore, 10);
        }
        const lblUserScore = entry.querySelector(
          ':scope > .details .score .game',
        )?.textContent;
        let userScore: number | undefined;
        if (lblUserScore && lblUserScore !== 'tbd') {
          userScore = parseFloat(lblUserScore);
        }

        if (gameName && platform && releaseDate) {
          const videoGame = new VideoGame(gameName);
          videoGame.addReleaseDate(platform, releaseDate);
          if (metacriticScore !== undefined) {
            videoGame.addScore('metacritic', metacriticScore);
          }
          if (userScore !== undefined) {
            videoGame.addScore('user', userScore);
          }
          this.games.push(videoGame);
        }
      });
    }

    return this.games;
  }
}

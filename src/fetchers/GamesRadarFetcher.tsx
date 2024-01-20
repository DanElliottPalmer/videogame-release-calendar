import {
  convertRomanNumerals,
  isDefined,
  isNonEmptyArray,
  nextElementSiblingMatches,
} from "../utils.ts";
import { VideoGame } from "../game/VideoGame.ts";
import { PageFetcher } from "./PageFetcher.ts";
import type { Platform } from "../platform/Platform.ts";
import { Element } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { PLATFORM_MANAGER } from "../platform/index.ts";

const RE_ENTRY =
  /(.+) (\[.+\]) – ((?:january|february|march|april|may|june|july|august|september|october|november|december) [\d]+)/i;

class GamesRadarFetcher extends PageFetcher {
  protected readonly pageUrls: Array<string> = [
    "https://www.gamesradar.com/video-game-release-dates/",
  ];
  protected readonly name = "GamesRadarFetcher";

  private processDate(dateString: string): Date | undefined {
    const dateValue = Date.parse(`${dateString} 2024 00:00:00 UTC`);
    const date = new Date(dateValue);
    if (isNaN(date.valueOf())) return undefined;
    return date;
  }

  private processPlatforms(
    platformString: string,
  ): Array<Platform> {
    // Example: [PC, PS5, XSX, PS4]
    // Trim off '[' and  ']'
    const tidyString: string = platformString.substring(
      1,
      platformString.length - 1,
    );
    // Split into individual items
    const platformStrings: Array<string> = tidyString.split(", ");
    const platforms: Array<Platform> = [];
    platformStrings.forEach((str) => {
      const platform = PLATFORM_MANAGER.resolveByName(str);
      if (platform) {
        platforms.push(platform);
      } else {
        console.warn(`${this.name} - Unknown platform: "${str}"`);
      }
    });
    return platforms;
  }

  extract(): VideoGame[] {
    const videoGames: Array<VideoGame> = [];

    for (const pageResponse of this.iterateResponses()) {
      const headings = pageResponse.querySelectorAll(
        '[id="tbc-2024-video-game-releases"]',
      ) as unknown as Array<Element>;
      headings.forEach((heading) => {
        // Get the next sibling that is a <ul>
        const gameList = nextElementSiblingMatches(heading, "UL");
        if (gameList === undefined) return;
        // Get each list item
        const listItems = gameList.querySelectorAll(
          ":scope li",
        ) as unknown as Array<Element>;
        listItems.forEach((listItem) => {
          let text: string | null = listItem.textContent;
          if (text === null) return;
          text = text.trim();
          // Rows are typically structured as:
          // Game [Platform, Platform] - Month Day
          // We want to ignore are dates that are TBC or do not contain one of
          // our months.
          const matches: RegExpMatchArray | null = text.match(RE_ENTRY);
          if (matches === null) return;
          const [, gameName, gamePlatforms, gameReleaseDate] = matches;
          const videoGameTitle = gameName.trim();
          const videoGamePlatforms = this.processPlatforms(gamePlatforms);
          const entryDate = this.processDate(gameReleaseDate);

          if (
            isDefined(name) && isNonEmptyArray(videoGamePlatforms) &&
            isDefined(entryDate)
          ) {
            const videoGame = new VideoGame();
            videoGame.addAlias(videoGameTitle);
            const alternativeRomanNumeralTitle = convertRomanNumerals(
              videoGameTitle,
            );
            if (videoGameTitle !== alternativeRomanNumeralTitle) {
              videoGame.addAlias(alternativeRomanNumeralTitle);
            }
            videoGamePlatforms.forEach((platform) =>
              videoGame.addReleaseDate(platform, entryDate)
            );
            videoGames.push(videoGame);
          }
        });
      });
    }

    return videoGames;
  }
}

export const fetcher = new GamesRadarFetcher();

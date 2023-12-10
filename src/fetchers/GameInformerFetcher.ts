import { VideoGame } from "../game/VideoGame.ts";
import { Platform } from "../platform/Platform.ts";
import { PLATFORM_MANAGER } from "../platform/index.ts";
import { convertRomanNumerals, isDefined, isNonEmptyArray } from "../utils.ts";
import { PageFetcher } from "./PageFetcher.ts";

const RE_ENTRY =
  /(.+)\s+(\(.+\))\s+[–\-]\s+((?:january|february|march|april|may|june|july|august|september|october|november|december) [\d]+)/i;

class GameInformerFetcher extends PageFetcher {
  protected readonly pageUrls: Array<string> = [
    "https://www.gameinformer.com/2024",
  ];
  protected readonly name = "GameInformerFetcher";

  private processDate(dateString: string): Date | undefined {
    const dateValue = Date.parse(`${dateString} 2024 00:00:00 UTC`);
    const date = new Date(dateValue);
    if (isNaN(date.valueOf())) return undefined;
    return date;
  }

  private processPlatforms(platformString: string): Array<Platform> {
    // Example: (PC, PS5, XSX, PS4)
    // Trim off '(' and  ')'
    const tidyString: string = platformString.substring(
      1,
      platformString.length - 1,
    );
    // Split into individual items
    const platformStrings: Array<string> = tidyString
      .split(", ")
      .flatMap((str) => {
        if (str === "Xbox Series X/S") {
          return ["Xbox Series X", "Xbox Series S"];
        }
        return str;
      });
    const platforms: Array<Platform> = [];
    platformStrings.forEach((str) => {
      const platform = PLATFORM_MANAGER.resolveByName(str);
      if (isDefined(platform)) {
        platforms.push(platform);
      } else {
        console.log(`${this.name} - Unknown platform: "${str}"`);
      }
    });
    return platforms;
  }

  extract(): VideoGame[] {
    const videoGames: Array<VideoGame> = [];
    for (const doc of this.iterateResponses()) {
      const calendarEntries = doc.querySelectorAll(".calendar_entry");
      for (const entry of calendarEntries) {
        let text: string | null = entry.textContent;
        if (text === null) continue;
        text = text.trim();
        const matches: RegExpMatchArray | null = text.match(RE_ENTRY);
        if (matches === null) continue;
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
      }
    }
    return videoGames;
  }
}

export const fetcher = new GameInformerFetcher();

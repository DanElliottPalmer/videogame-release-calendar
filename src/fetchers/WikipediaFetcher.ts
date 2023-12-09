import { PLATFORM_MANAGER } from "../platform/index.ts";
import { VideoGame } from "../game/VideoGame.ts";
import {
  Element,
  HTMLDocument,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import {
  convertRomanNumerals,
  isDefined,
  isNonEmptyArray,
  nextElementSiblingMatches,
} from "../utils.ts";
import { PageFetcher } from "./PageFetcher.ts";

type TableHeaderCell =
  | "Month"
  | "Day"
  | "Title"
  | "Platform(s)"
  | "Genre(s)"
  | "Developer(s)"
  | "Publisher(s)"
  | "Ref.";

class WikipediaFetcher extends PageFetcher {
  protected readonly pageUrls: Array<string> = [
    "https://en.wikipedia.org/wiki/2024_in_video_games",
  ];

  protected getWikitables(doc: HTMLDocument) {
    const tables: Array<Element> = [];

    let node: Element | null | undefined = doc.querySelector(
      "h3 #January–March",
    )?.parentElement;
    if (isDefined(node)) {
      while (true) {
        node = nextElementSiblingMatches(node, "table.wikitable, h3");
        if (node === undefined) break;
        if (node.querySelector(":scope #Unscheduled_releases")) break;
        if (node.tagName === "H3") continue;
        if (node.tagName === "TABLE") tables.push(node);
      }
    }

    return tables;
  }

  protected parseHTMLTableToJSON(
    table: Element,
  ): Array<{ [key in TableHeaderCell]?: string }> {
    const rows: Array<Array<string>> = [];
    const tableHeaderCells: Array<string> = [];
    let rowspans: Array<{ amount: number; value: string } | null>;
    let colspans: Array<string | null>;

    const trs = table.querySelectorAll("tr");
    trs.forEach((tr, rowIndex) => {
      // First row is the header with the keys of the properties
      if (rowIndex === 0) {
        const ths = (tr as Element).querySelectorAll("th");
        tableHeaderCells.push(
          ...Array.from(ths).map((th) => (th as Element).innerText.trim()),
        );
        rowspans = new Array(tableHeaderCells.length);
        colspans = new Array(tableHeaderCells.length);
        return;
      }

      const tds = (tr as Element).querySelectorAll("td");
      let cellOffset = 0;

      const cells = new Array(tableHeaderCells.length).fill(null).map(
        (_, index) => {
          // Check if there are any rowspan values first
          const rowspan = rowspans[index];
          if (isDefined(rowspan)) {
            cellOffset--;
            rowspan.amount--;
            if (rowspan.amount === 0) rowspans[index] = null;
            return rowspan.value;
          }

          // Check if there are any colspans
          const colspan = colspans[index];
          if (isDefined(colspan)) {
            cellOffset--;
            colspans[index] = null;
            return colspan;
          }

          // Calculate our real cell index using the offset.
          const cellIndex = index + cellOffset;
          const maybeTd = tds[cellIndex];

          if (!isDefined(maybeTd)) {
            throw new RangeError(
              `The index must be between 0 and ${
                tds.length - 1
              } - ${cellIndex}`,
            );
          }

          const td = maybeTd as Element;
          const cellValue = td.innerText.trim();

          // Set rowspan if it exists
          if (td.hasAttribute("rowspan")) {
            rowspans[index] = {
              // Minus one from the value as we are already on the cell that is
              // using the value.
              amount: parseInt(td.getAttribute("rowspan") ?? "0", 10) - 1,
              value: cellValue,
            };
          }

          if (td.hasAttribute("colspan")) {
            const colspanValue = parseInt(
              td.getAttribute("colspan") ?? "0",
              10,
            );
            for (let j = index + 1; j <= index + colspanValue; j++) {
              colspans[j] = cellValue;
            }
          }

          return cellValue;
        },
      );
      rows.push(cells);
    });

    return rows.map((row) => {
      const accumulator: { [key in TableHeaderCell]?: string } = {};
      return row.reduce((previousValue, currentValue, index) => {
        const headerCell = tableHeaderCells[index] as TableHeaderCell;
        previousValue[headerCell] = currentValue;
        return previousValue;
      }, accumulator);
    });
  }

  protected processDate(day: string, month: string): Date | undefined {
    const dayAsNumber = parseInt(day, 10);
    if (isNaN(dayAsNumber)) return;
    const fullDate = `${dayAsNumber} ${month} 2024`;
    const date = new Date(fullDate);
    return isNaN(date.getTime()) ? undefined : date;
  }

  extract() {
    const videoGames: Array<VideoGame> = [];
    for (const pageUrl of this.pageUrls) {
      const doc = this.parseResponse(pageUrl);
      const wikitables = this.getWikitables(doc);
      for (const wikitable of wikitables) {
        const tableRows = this.parseHTMLTableToJSON(wikitable);
        for (const row of tableRows) {
          const entryDate = this.processDate(row.Day ?? "", row.Month ?? "");
          const videoGameTitle = row.Title;
          const videoGamePlatforms =
            row["Platform(s)"]?.split(", ").map((platform) =>
              PLATFORM_MANAGER.resolveByName(platform)
            ).filter(isDefined) ?? [];
          if (
            !isDefined(entryDate) || !isDefined(videoGameTitle) ||
            !isNonEmptyArray(videoGamePlatforms)
          ) continue;
          const videoGame = new VideoGame();
          videoGame.addAlias(videoGameTitle);
          const alternativeRomanNumeralTitle = convertRomanNumerals(
            videoGameTitle,
          );
          if (videoGameTitle !== alternativeRomanNumeralTitle) {
            videoGame.addAlias(alternativeRomanNumeralTitle);
          }
          const developer = row["Developer(s)"]?.trim() ?? "";
          if (developer) videoGame.addDeveloper(developer);
          const publisher = row["Publisher(s)"]?.trim() ?? "";
          if (publisher) videoGame.addPublisher(publisher);

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

export const fetcher = new WikipediaFetcher();

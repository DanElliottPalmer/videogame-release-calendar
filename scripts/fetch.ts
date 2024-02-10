import { resolve } from "https://deno.land/std@0.209.0/path/mod.ts";
import { fetcher as wikipediaFetcher } from "../src/fetchers/WikipediaFetcher.ts";
import { fetcher as gameInformerFetcher } from "../src/fetchers/GameInformerFetcher.ts";
import { fetcher as gamesRadarFetcher } from "../src/fetchers/GamesRadarFetcher.tsx";
import { VIDEO_GAME_MANAGER } from "../src/game/index.ts";
import { Calendar } from "../src/calendar/Calendar.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const OUTPUT_DIR = resolve(__dirname, "../docs");

const FETCHERS = [
  wikipediaFetcher,
  gameInformerFetcher,
  gamesRadarFetcher,
];
const CALENDAR = new Calendar();

//==============================================================================
// Execution
//==============================================================================

await run();

//==============================================================================
// Helpers
//==============================================================================

async function run() {
  for (const fetcher of FETCHERS) {
    await fetcher.fetch();
    const games = fetcher.extract();
    VIDEO_GAME_MANAGER.add(games, fetcher !== wikipediaFetcher);
  }

  console.info(`Total games: ${VIDEO_GAME_MANAGER.length}`);

  for (const videoGame of Array.from(VIDEO_GAME_MANAGER)) {
    await videoGame.generateUID();
    CALENDAR.addVideoGame(videoGame);
  }
  CALENDAR.sort();

  await writeFile("calendar-all-months.json", JSON.stringify(CALENDAR));
  for (const month of CALENDAR) {
    await writeFile(
      `calendar-${month.name.toLowerCase()}.json`,
      JSON.stringify(CALENDAR.toMonthJSON(month.index)),
    );
  }
}

async function writeFile(filename: string, fileContents: string) {
  await Deno.writeTextFile(resolve(OUTPUT_DIR, filename), fileContents);
}

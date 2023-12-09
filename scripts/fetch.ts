import { fetcher as wikipediaFetcher } from "../src/fetchers/WikipediaFetcher.ts";
import { fetcher as gameInformerFetcher } from "../src/fetchers/GameInformerFetcher.ts";
import { VIDEO_GAME_MANAGER } from "../src/game/index.ts";

const fetchers = [
  wikipediaFetcher,
  gameInformerFetcher,
];

async function main() {
  for (const fetcher of fetchers) {
    await fetcher.fetch();
    const games = fetcher.extract();
    VIDEO_GAME_MANAGER.add(games, true);
    console.log("Total games", VIDEO_GAME_MANAGER.length);
  }
  console.log(Array.from(VIDEO_GAME_MANAGER));
  console.log("Total games", VIDEO_GAME_MANAGER.length);
}

main();

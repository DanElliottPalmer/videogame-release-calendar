import { fetcher } from "../src/fetchers/WikipediaFetcher.ts";
import { VIDEO_GAME_MANAGER } from "../src/game/index.ts";

async function main() {
  await fetcher.fetch();
  const games = fetcher.extract();
  VIDEO_GAME_MANAGER.add(games);
}

main();

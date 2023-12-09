import { isDefined } from "../utils.ts";
import type { VideoGame } from "./VideoGame.ts";

const SIMILAR_GAME_THRESHOLD = 0.85;

export class VideoGameManager {
  private readonly games: Map<VideoGame["id"], VideoGame> = new Map();
  private readonly names: Map<string, VideoGame["id"]> = new Map();

  add(videoGame: Array<VideoGame> | VideoGame, merge?: boolean) {
    if (Array.isArray(videoGame)) {
      videoGame.forEach((game) => this.add(game, merge));
    } else {
      if (this.games.has(videoGame.id)) return;

      if (merge) {
        for (const [_, existingGame] of this.games) {
          if (existingGame.compare(videoGame) >= SIMILAR_GAME_THRESHOLD) {
            existingGame.merge(videoGame);
            return;
          }
        }
      }

      this.games.set(videoGame.id, videoGame);
      videoGame._manager = this;
      this.cacheAliases(videoGame.id);
    }
  }

  cacheAliases(gameId: VideoGame["id"]) {
    const game = this.games.get(gameId);
    if (!isDefined(game)) return;
    for (const gameAlias of game.getAliases()) {
      this.names.set(gameAlias, gameId);
    }
  }

  findGameByAlias(alias: string) {
    const gameId = this.names.get(alias);
    if (isDefined(gameId)) return this.games.get(gameId);
  }
}

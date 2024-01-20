import type { VideoGame } from "./VideoGame.ts";

const SIMILAR_GAME_THRESHOLD = 0.85;

export class VideoGameManager {
  private readonly games: Map<VideoGame["id"], VideoGame> = new Map();

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
    }
  }

  get length() {
    return this.games.size;
  }

  *[Symbol.iterator]() {
    for (const [, game] of this.games) {
      yield game;
    }
  }
}

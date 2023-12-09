import type { Platform } from "../platform/Platform.ts";
import type { VideoGameManager } from "../game/VideoGameManager.ts";
import { isDefined } from "../utils.ts";
import { Aliases } from "../Aliases.ts";
import { PLATFORM_MANAGER } from "../platform/index.ts";

let VIDEO_GAME_ID = 0;

export class VideoGame {
  readonly id: number = VIDEO_GAME_ID++;

  private readonly aliases: Aliases = new Aliases();
  private readonly developers: Aliases = new Aliases();
  private readonly publishers: Aliases = new Aliases();
  private readonly releaseDates: Map<Platform["id"], Aliases> = new Map();
  _manager: VideoGameManager | undefined;

  addAlias(names: string | Array<string>): void {
    this.aliases.addAlias(names);
    if (isDefined(this._manager)) {
      this._manager.cacheAliases(this.id);
    }
  }

  isAlias(name: string): boolean {
    return this.aliases.isAlias(name);
  }

  getAliases() {
    return Array.from(this.aliases);
  }

  addReleaseDate(platform: Platform, releaseDate: Date) {
    if (!this.releaseDates.has(platform.id)) {
      this.releaseDates.set(platform.id, new Aliases());
    }
    const platformReleaseDates = this.releaseDates.get(platform.id);
    if (!isDefined(platformReleaseDates)) {
      throw new Error(`Unknown platform for release dates: ${platform}`);
    }
    platformReleaseDates.addAlias(releaseDate.toISOString());
  }

  getReleaseDates() {
    return Array.from(this.releaseDates);
  }

  addDeveloper(names: string | Array<string>): void {
    this.developers.addAlias(names);
  }

  getDevelopers() {
    return Array.from(this.developers);
  }

  addPublisher(names: string | Array<string>): void {
    this.publishers.addAlias(names);
  }

  getPublishers() {
    return Array.from(this.publishers);
  }

  compare(videoGame: VideoGame) {
    return this.aliases.compare(videoGame.aliases);
  }

  merge(videoGame: VideoGame) {
    // Aliases
    this.addAlias(videoGame.getAliases());
    // Developers
    this.addDeveloper(videoGame.getDevelopers());
    // Publishers
    this.addPublisher(videoGame.getPublishers());
    // Release dates
    for (const [platformId, releaseDates] of videoGame.getReleaseDates()) {
      const platform = PLATFORM_MANAGER.resolveById(platformId);
      if (!isDefined(platform)) continue;
      for (const [releaseDateString] of releaseDates) {
        this.addReleaseDate(platform, new Date(releaseDateString));
      }
    }
  }

  get developer() {
    return this.developers.getTopAlias();
  }

  get name() {
    return this.aliases.getTopAlias();
  }

  get publisher() {
    return this.publishers.getTopAlias();
  }

  get [Symbol.toStringTag]() {
    return this.name;
  }

  toJSON() {
    return {
      developer: this.developer,
      name: this.name,
      publisher: this.publisher,
      releaseDates: Array.from(this.releaseDates).reduce(
        (acc, currentValue) => {
          const platform = PLATFORM_MANAGER.resolveById(currentValue[0]);
          if (platform) {
            acc[platform.name] = new Date(currentValue[1].getTopAlias());
          }
          return acc;
        },
        {} as { [key: string]: Date },
      ),
    };
  }
}

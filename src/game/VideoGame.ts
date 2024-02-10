import type { Platform, PlatformJson } from "../platform/Platform.ts";
import { generateDeterministicId, isDefined } from "../utils.ts";
import { Aliases } from "../Aliases.ts";
import { PLATFORM_MANAGER } from "../platform/index.ts";

let VIDEO_GAME_ID = 0;

interface VideoGameJson {
  developer: string | undefined;
  name: string | undefined;
  publisher: string | undefined;
  releaseDates: Record<Platform["name"], Date>;
  uid: string | undefined;
}

export interface VideoGameCalendarEntry {
  developer: string | undefined;
  name: string | undefined;
  platforms: Array<PlatformJson>;
  publisher: string | undefined;
  releaseDate: Date;
  uid: string | undefined;
}

export class VideoGame {
  readonly id: number = VIDEO_GAME_ID++;

  private readonly aliases: Aliases = new Aliases();
  private readonly developers: Aliases = new Aliases();
  private readonly publishers: Aliases = new Aliases();
  private readonly releaseDates: Map<Platform["id"], Aliases> = new Map();

  #uid: string | undefined = undefined;

  async generateUID() {
    if (this.name) {
      this.#uid = await generateDeterministicId(this.name);
    } else {
      this.#uid = undefined;
    }
    return this.#uid;
  }

  addAlias(names: string | Array<string>): void {
    this.aliases.addAlias(names);
  }

  isAlias(name: string): boolean {
    return this.aliases.isAlias(name);
  }

  getAliases() {
    return Array.from(this.aliases);
  }

  addReleaseDate(platform: Platform, releaseDate: Date, count?: number) {
    if (!this.releaseDates.has(platform.id)) {
      this.releaseDates.set(platform.id, new Aliases());
    }
    const platformReleaseDates = this.releaseDates.get(platform.id);
    if (!isDefined(platformReleaseDates)) {
      throw new Error(`Unknown platform for release dates: ${platform}`);
    }
    platformReleaseDates.addAlias(releaseDate.toISOString(), count);
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
      for (
        const [releaseDateString, releaseDateCount] of releaseDates.getAliases()
      ) {
        this.addReleaseDate(
          platform,
          new Date(releaseDateString),
          releaseDateCount,
        );
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

  get uid() {
    if (!isDefined(this.#uid)) {
      console.warn(`uid is not generated for ${this.name}`);
    }
    return this.#uid;
  }

  toString() {
    return this.name;
  }

  toJSON(): VideoGameJson | null {
    const name = this.name;
    if (!name) return null;
    return {
      developer: this.developer,
      name,
      publisher: this.publisher,
      releaseDates: this.getReleaseDates().reduce(
        (acc, currentValue) => {
          const platform = PLATFORM_MANAGER.resolveById(currentValue[0]);
          const dateString = currentValue[1].getTopAlias();
          if (isDefined(platform) && isDefined(dateString)) {
            acc[platform.name] = new Date(dateString);
          }
          return acc;
        },
        {} as Record<Platform["name"], Date>,
      ),
      uid: this.uid,
    };
  }

  toCalendarEntries(): Array<VideoGameCalendarEntry> {
    const datesToPlatformId = new Map<string, Array<Platform["id"]>>();
    for (const [platformId, datesAlias] of this.getReleaseDates()) {
      const dateString = datesAlias.getTopAlias();
      if (isDefined(dateString)) {
        if (!datesToPlatformId.has(dateString)) {
          datesToPlatformId.set(dateString, []);
        }
        datesToPlatformId.get(dateString)?.push(platformId);
      }
    }

    if (datesToPlatformId.size === 0) return [];

    const baseVideoGameJSON = {
      developer: this.developer,
      name: this.name,
      publisher: this.publisher,
      uid: this.uid,
    };
    return Array.from(datesToPlatformId).map((entry) => {
      const [dateString, platformIds] = entry;
      return {
        ...baseVideoGameJSON,
        platforms: platformIds.map((platformId) =>
          PLATFORM_MANAGER.resolveById(platformId)?.toJSON()
        ).filter(isDefined),
        releaseDate: new Date(dateString),
      };
    });
  }
}

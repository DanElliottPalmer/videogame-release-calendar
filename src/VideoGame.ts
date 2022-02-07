import { Platform } from './Platform.js';

let GAME_ID = 0;

type ReleaseMap = Map<string, number>;

export class VideoGame {
  readonly id: number;
  readonly knownAs: Map<string, number> = new Map();
  readonly name: string;
  readonly releases: Map<string, ReleaseMap> = new Map();

  constructor(name: string) {
    this.name = name;
    this.id = GAME_ID++;
    this.knownAs.set(name, 1);
  }

  addReleaseDate(platform: Platform, date: Date) {
    const platformName = platform.toString();
    if (!this.releases.has(platformName)) {
      this.releases.set(platformName, new Map());
    }
    const platformGroup = this.releases.get(platformName) as ReleaseMap;
    const dateString = date.toISOString();
    if (!platformGroup.has(dateString)) {
      platformGroup.set(dateString, 1);
    } else {
      platformGroup.set(
        dateString,
        (platformGroup.get(dateString) as number) + 1,
      );
    }
  }

  merge(videoGame: VideoGame) {
    // Add to knownAs
    if (this.knownAs.has(videoGame.name)) {
      this.knownAs.set(
        videoGame.name,
        (this.knownAs.get(videoGame.name) as number) + 1,
      );
    } else {
      this.knownAs.set(videoGame.name, 1);
    }
    // Add to releases
    for (const [platformName, releaseMap] of videoGame.releases) {
      for (const [releaseDateString, count] of releaseMap) {
        if (!this.releases.has(platformName)) {
          this.releases.set(platformName, new Map());
        }
        const platformGroup = this.releases.get(platformName) as ReleaseMap;
        if (!platformGroup.has(releaseDateString)) {
          platformGroup.set(releaseDateString, count);
        } else {
          platformGroup.set(
            releaseDateString,
            (platformGroup.get(releaseDateString) as number) + count,
          );
        }
      }
    }
  }

  private getName(): string {
    let name: string = this.name;
    if (this.knownAs.size > 1) {
      type KnownAsItem = [string, number];
      const sortedKnownAs: Array<KnownAsItem> = Array.from(this.knownAs).sort(
        (a, b) => {
          return b[1] - a[1];
        },
      );
      // If the top answer is more than one, use it, otherwise lets just stick
      // with the first name we had
      if ((sortedKnownAs[0] as KnownAsItem)[1] > 1) {
        name = (sortedKnownAs[0] as KnownAsItem)[0];
      }
    }
    return name;
  }

  private getReleases(): Record<string, string> {
    const releases: Record<string, string> = {};
    type ReleaseItem = [string, number];
    for (const [platformName, releaseMap] of this.releases) {
      const sortedReleases: Array<ReleaseItem> = Array.from(releaseMap).sort(
        (a, b) => {
          return b[1] - a[1];
        },
      );
      releases[platformName] = (sortedReleases[0] as ReleaseItem)[0];
    }
    return releases;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.getName(),
      releases: this.getReleases(),
    };
  }
}

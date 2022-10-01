import { Platform } from './Platform.js';
import { diceCoefficient } from './utils/diceCoefficient.js';
import { convertRomanNumerals } from './utils/romanNumerals.js';

let GAME_ID = 0;

type ReleaseMap = Map<string, number>;
interface VideoGameJSON {
  id: number;
  name: string;
  releases: Record<string, string>;
  scores: Record<string, number>;
}

function getCleanNames(game: VideoGame): Array<string> {
  type KnownAsItem = [string, number];
  const knownAsEntries: Array<KnownAsItem> = Array.from(game.knownAs.entries());
  // Sort with most used name first
  knownAsEntries.sort((entryA, entryB) => entryB[1] - entryA[1]);
  let knownAs: Array<string> = knownAsEntries.map(
    ([name]: KnownAsItem): string => {
      return (
        name
          .toLowerCase()
          // Replace all - with spaces
          .replace(/-/g, ' ')
          // Replace anything that is not a letter, number or space with nothing
          .replace(/[^\w\d\s]+/gi, '')
          // Replace multiple whitespaces with a single space
          .replace(/(\s\s)+/, ' ')
      );
    },
  );
  // Create a unique list of names
  knownAs = Array.from(new Set(knownAs));
  return knownAs;
}

export class VideoGame {
  readonly id: number;
  readonly knownAs: Map<string, number> = new Map();
  readonly name: string;
  readonly releases: Map<string, ReleaseMap> = new Map();
  readonly scores: Map<string, Array<number>> = new Map();

  constructor(name: string) {
    this.name = name;
    this.id = GAME_ID++;
    this.knownAs.set(name, 1);

    const romanNumeraledName = convertRomanNumerals(this.name);
    if (this.name !== romanNumeraledName) {
      // Bump the original name to give more priority
      this.knownAs.set(name, 2);
      this.knownAs.set(romanNumeraledName, 1);
    }
  }

  addScore(groupName: string, value: number) {
    if (!this.scores.has(groupName)) {
      this.scores.set(groupName, []);
    }
    const scoreGroup = this.scores.get(groupName) as Array<number>;
    scoreGroup.push(value);
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

  compareName(game: VideoGame): number {
    const coefficients: Array<number> = [];
    let coefficient: number;

    const gameNames = getCleanNames(game);
    const thisNames = getCleanNames(this);

    for (const gameKnownAs of gameNames) {
      const cleanGameName = gameKnownAs
        .toLowerCase()
        .replace(/[^\w\d\s]+/gi, '');

      for (const thisKnownAs of thisNames) {
        const cleanThisName = thisKnownAs
          .toLowerCase()
          .replace(/[^\w\d\s]+/gi, '');
        coefficient = diceCoefficient(cleanGameName, cleanThisName);
        // Complete match, skip everything else
        if (coefficient === 1) return 1;
        coefficients.push(coefficient);
      }
    }

    const normalisedValue =
      coefficients.reduce((acc, value) => acc + value, 0) / coefficients.length;
    return normalisedValue;
  }

  merge(videoGame: VideoGame) {
    // Add to knownAs
    for (const [knownAsName, knownAsValue] of videoGame.knownAs) {
      if (this.knownAs.has(knownAsName)) {
        this.knownAs.set(
          knownAsName,
          (this.knownAs.get(videoGame.name) as number) + knownAsValue,
        );
      } else {
        this.knownAs.set(knownAsName, knownAsValue);
      }
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

    // Add to scores
    for (const [groupName, scores] of videoGame.scores) {
      if (!this.scores.has(groupName)) {
        this.scores.set(groupName, scores);
      } else {
        const existingScores = this.scores.get(groupName) as Array<number>;
        existingScores.push(...scores);
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

  private getScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const [groupName, scoreValues] of this.scores) {
      const meanScore =
        scoreValues.reduce((acc, value) => acc + value, 0) / scoreValues.length;
      scores[groupName] = roundToDecimal(meanScore);
    }
    return scores;
  }

  toJSON(): VideoGameJSON {
    return {
      id: this.id,
      name: this.getName(),
      releases: this.getReleases(),
      scores: this.getScores(),
    };
  }
}

function roundToDecimal(value: number, decimals: number = 1): number {
  const a = 10 ** decimals;
  return Math.round(value * a) / a;
}

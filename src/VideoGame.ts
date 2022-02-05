import { Platform } from './Platform.js';

export class VideoGame {
  readonly name: string;
  readonly platforms: Array<Platform> = [];
  readonly releaseDates: Array<Date> = [];

  constructor(name: string) {
    this.name = name;
  }

  addPlatform(platform: Platform): void;
  addPlatform(platforms: Array<Platform>): void;
  addPlatform(platforms: unknown): void {
    if (Array.isArray(platforms)) {
      this.platforms.push(...platforms);
    } else if (platforms instanceof Platform) {
      this.platforms.push(platforms);
    }
  }

  addReleaseDate(date: Date) {
    this.releaseDates.push(date);
  }
}

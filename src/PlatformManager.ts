import { Platform } from './Platform.js';

export class PlatformManager {
  private platforms: Array<Platform> = [];

  add(platform: Platform): void;
  add(platforms: Array<Platform>): void;
  add(platforms: unknown): void {
    if (Array.isArray(platforms)) {
      this.platforms.push(...platforms);
    } else if (platforms instanceof Platform) {
      this.platforms.push(platforms);
    }
  }

  resolve(name: string): Platform | undefined {
    return this.platforms.find((platform) => {
      return platform.knownAs.has(name);
    });
  }
}

import { Platform } from "./Platform.ts";

export class PlatformManager {
  private platforms: Map<Platform["id"], Platform> = new Map();

  add(platform: Platform | Array<Platform>): void {
    if (Array.isArray(platform)) {
      platform.forEach((p) => this.add(p));
    } else {
      if (!this.platforms.has(platform.id)) {
        this.platforms.set(platform.id, platform);
      }
    }
  }

  resolveById(id: number): Platform | undefined {
    return this.platforms.get(id);
  }

  resolveByName(name: string): Platform | undefined {
    for (const platform of this) {
      if (platform.isAlias(name)) return platform;
    }
  }

  *[Symbol.iterator]() {
    for (const [, platform] of this.platforms) {
      yield platform;
    }
  }
}

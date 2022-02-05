import fetch from 'node-fetch';
import type { PlatformManager } from '../PlatformManager.js';
import type { VideoGame } from '../VideoGame.js';

export abstract class PageFetcher {
  protected games: Array<VideoGame> = [];
  protected body: string;
  protected url: string;

  public abstract extract(manager: PlatformManager): void;

  public async request(): Promise<string> {
    const response = await fetch(this.url);
    this.body = await response.text();
    return this.body;
  }
}

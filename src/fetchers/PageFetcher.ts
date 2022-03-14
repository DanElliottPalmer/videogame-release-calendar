import fetch from 'node-fetch';
import type { PlatformManager } from '../PlatformManager.js';
import type { VideoGame } from '../VideoGame.js';

export interface WebPage {
  body: string;
  url: string;
}

export abstract class PageFetcher {
  public readonly name: string;
  public readonly homepageUrl: string;

  protected games: Array<VideoGame> = [];
  protected fetchQueue: Array<string> = [];
  protected fetchedPages: Array<WebPage> = [];
  protected urls: Array<string> = [];

  protected async prefetch(url: string): Promise<string> {
    return url;
  }

  protected async fetch(url: string): Promise<WebPage> {
    const response = await fetch(url);
    const body = await response.text();
    const page: WebPage = { body, url };
    return page;
  }

  protected async postfetch(page: WebPage): Promise<WebPage> {
    return page;
  }

  public abstract extract(manager: PlatformManager): Array<VideoGame>;

  public async request(): Promise<Array<WebPage>> {
    this.fetchedPages.length = 0;

    this.fetchQueue = this.urls.slice(0);
    let page: WebPage;
    let url: string;
    while (this.fetchQueue.length > 0) {
      url = this.fetchQueue.shift() as string;
      url = await this.prefetch(url);
      page = await this.fetch(url);
      page = await this.postfetch(page);
      this.fetchedPages.push(page);
    }

    return this.fetchedPages;
  }
}

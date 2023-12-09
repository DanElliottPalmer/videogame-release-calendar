import { VideoGame } from "../game/VideoGame.ts";
import {
  DOMParser,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { isDefined } from "../utils.ts";

export abstract class PageFetcher {
  protected readonly pageResponses: Map<string, string> = new Map();
  protected readonly pageUrls: Array<string> = [];
  protected readonly name: string = "";

  protected parseResponse(url: string) {
    const maybeResponse = this.pageResponses.get(url);
    if (!isDefined(maybeResponse)) {
      throw new Error(`Unknown url: ${url}`);
    }
    const doc = new DOMParser().parseFromString(maybeResponse, "text/html");
    if (!isDefined(doc)) {
      throw new Error(`DOM document is null: ${url}`);
    }
    return doc;
  }

  async fetch() {
    for (const pageUrl of this.pageUrls) {
      console.debug(`Fetching url: ${pageUrl}`);
      const response = await fetch(pageUrl);
      if (response.ok) {
        console.debug(`Success loading url: ${pageUrl} - ${response.status}`);
        this.pageResponses.set(pageUrl, await response.text());
      } else {
        console.error(`Failure to load url: ${pageUrl} - ${response.status}`);
      }
    }
  }

  extract(): Array<VideoGame> {
    return [];
  }
}

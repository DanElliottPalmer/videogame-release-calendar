import { extract } from "https://deno.land/std@0.212.0/front_matter/yaml.ts";
import type { JSONObject } from "../types.ts";

const FROZEN_EMPTY_OBJECT = Object.freeze({});

export class PartialTemplate {
  #name = "";
  #markup = "";
  #metadata: Readonly<JSONObject> = {};

  constructor(name: string, markup: string, metadata?: JSONObject) {
    this.#name = name;
    this.#markup = markup;
    this.#metadata = metadata
      ? Object.freeze(structuredClone(metadata))
      : FROZEN_EMPTY_OBJECT;
  }

  get markup() {
    return this.#markup;
  }

  get name() {
    return this.#name;
  }

  get metadata() {
    return this.#metadata;
  }

  toJSON() {
    return {
      markup: this.#markup,
      metadata: this.#metadata,
      name: this.#name,
    };
  }

  get [Symbol.toStringTag]() {
    return this.#name;
  }

  static fromMustache(name: string, mustacheContents: string) {
    try {
      const extractedData = extract(mustacheContents);
      const partialTemplate = new PartialTemplate(
        name,
        extractedData.body,
        extractedData.attrs
      );
      return partialTemplate;
    } catch {
      console.error(
        `There was a problem parsing frontmatter for ${name}. Passing contents as markup.`,
      );
      return new PartialTemplate(name, mustacheContents);
    }
  }
}

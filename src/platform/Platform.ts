import { Aliases } from "../Aliases.ts";

let PLATFORM_ID = 0;

export class Platform {
  readonly id: number = PLATFORM_ID++;
  /**
   * Alias names of the platforms
   */
  private readonly aliases: Aliases = new Aliases();
  /**
   * Name of the platform.
   */
  readonly name: string;
  /**
   * Short name of the platform.
   * @type {string}
   */
  readonly shortName: string;

  constructor(name: string, shortName: string) {
    this.name = name;
    this.shortName = shortName;
    this.addAlias(name);
  }

  addAlias(names: string | Array<string>): void {
    this.aliases.addAlias(names);
  }

  isAlias(name: string): boolean {
    return this.aliases.isAlias(name);
  }

  get [Symbol.toStringTag]() {
    return this.name;
  }

  toJSON() {
    return {
      aliases: Array.from(this.aliases),
      name: this.name,
      shortName: this.shortName,
    };
  }
}

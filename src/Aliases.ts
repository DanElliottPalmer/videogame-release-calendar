import { diceCoefficient } from "./utils.ts";

type AliasName = string;
type AliasCount = number;

export class Aliases {
  private readonly aliases = new Map<AliasName, AliasCount>();

  addAlias(names: string | Array<string>, count?: number): void {
    if (Array.isArray(names)) {
      names.forEach((name) => this.addAlias(name, count));
    } else {
      const aliasCount = this.aliases.get(names) ?? 0;
      this.aliases.set(names, aliasCount + (count ?? 1));
    }
  }

  compare(aliases: Aliases) {
    const coefficients: Array<number> = [];
    let coefficient: number;

    const thisAliases = this.normalise();
    const themAliases = aliases.normalise();

    for (const thisAlias of thisAliases) {
      for (const themAlias of themAliases) {
        coefficient = diceCoefficient(thisAlias, themAlias);
        // Complete match, skip everything else
        if (coefficient === 1) return 1;
        coefficients.push(coefficient);
      }
    }

    return coefficients.reduce((acc, value) => acc + value, 0) /
      coefficients.length;
  }

  getAliases() {
    return Array.from(this.aliases);
  }

  getTopAlias() {
    if (this.aliases.size === 0) return;
    const aliasCounts = Array.from(this.aliases).sort((a, b) => a[1] - b[1]);
    return aliasCounts[0][0];
  }

  isAlias(name: string): boolean {
    return this.aliases.has(name);
  }

  normalise() {
    const aliasEntries = Array.from(this.aliases.entries());
    // Sort with most used name first
    aliasEntries.sort((entryA, entryB) => entryB[1] - entryA[1]);
    // Normalise all the names
    let aliases: Array<string> = aliasEntries.map(
      ([name]): string => {
        return (
          name
            .toLowerCase()
            // Replace all - with spaces
            .replace(/-/g, " ")
            // Replace anything that is not a letter, number or space with nothing
            .replace(/[^\w\d\s]+/gi, "")
            // Replace multiple whitespaces with a single space
            .replace(/(\s\s)+/, " ")
        );
      },
    );
    // Create a unique list of names
    aliases = Array.from(new Set(aliases));
    return aliases;
  }

  *[Symbol.iterator]() {
    for (const [alias] of this.aliases) {
      yield alias;
    }
  }

  toString() {
    return this.getTopAlias() ?? "";
  }
}

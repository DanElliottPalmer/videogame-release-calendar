export class Platform {
  readonly name: string;
  readonly shortName: string;
  readonly knownAs: Set<string> = new Set();

  constructor(name: string, shortName: string) {
    this.name = name;
    this.shortName = shortName;
    this.addKnownAs(name);
  }

  addKnownAs(name: string): void;
  addKnownAs(names: Array<string>): void;
  addKnownAs(names: unknown): void {
    if (Array.isArray(names)) {
      names.forEach((name) => this.knownAs.add(name));
    } else if (typeof names === 'string') {
      this.knownAs.add(names);
    }
  }

  toString(): string {
    return this.name;
  }
}

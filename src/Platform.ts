export class Platform {
  readonly name: string;
  readonly knownAs: Set<string> = new Set();

  constructor(name: string) {
    this.name = name;
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
}

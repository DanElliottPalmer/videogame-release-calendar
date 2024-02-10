import type { PartialTemplate } from "./PartialTemplate.ts";

class PartialsMap {
  #templates: Map<PartialTemplate["name"], PartialTemplate> = new Map();

  addTemplate(template: PartialTemplate) {
    this.#templates.set(template.name, template);
  }

  clear() {
    this.#templates.clear();
  }

  getTemplate(templateName: string) {
    return this.#templates.get(templateName);
  }

  toMarkupMap(): Record<PartialTemplate["name"], PartialTemplate["markup"]> {
    return Array.from(this.#templates.entries()).reduce((acc, current) => {
      const [name, template] = current;
      acc[name] = template.markup;
      return acc;
    }, {} as Record<PartialTemplate["name"], PartialTemplate["markup"]>);
  }
}

export const PARTIALS_MAP = new PartialsMap();

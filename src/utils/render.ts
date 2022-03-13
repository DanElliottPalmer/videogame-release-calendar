// Workaround for Typescript not having Intl.ListFormat... yet
// https://github.com/microsoft/TypeScript/issues/46907
declare namespace Intl {
  type ListType = 'conjunction' | 'disjunction';

  interface ListFormatOptions {
    localeMatcher?: 'lookup' | 'best fit';
    type?: ListType;
    style?: 'long' | 'short' | 'narrow';
  }

  interface ListFormatPart {
    type: 'element' | 'literal';
    value: string;
  }

  class ListFormat {
    constructor(locales?: string | string[], options?: ListFormatOptions);
    format(values: any[]): string;
    formatToParts(values: any[]): ListFormatPart[];
    supportedLocalesOf(
      locales: string | string[],
      options?: ListFormatOptions,
    ): string[];
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mustache from 'mustache';
import type { Calendar, Entry } from './calendar.js';
import { monthNames } from './calendar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.resolve(__dirname, '../../static/template.mustache');
const mustacheTemplate = fs.readFileSync(templatePath, 'utf8');
const outputPath = path.resolve(__dirname, '../../');

interface Source {
  name: string;
  url: string;
}

interface RenderOptions {
  calendar: Calendar;
  renderDate: Date;
  sources: Array<Source>;
}

interface RenderData {
  calendar: Calendar;
  renderDate: string;
  sources: Array<Source>;
  utils: Record<string, Function>;
}

export function render({ calendar, renderDate, sources }: RenderOptions) {
  const data: RenderData = {
    calendar,
    renderDate: renderDate.toISOString(),
    sources,
    utils: {
      entryGetDate(this: Entry): string {
        return String(this.date.getDate()).padStart(2, '0');
      },
      entryGetMonthId(this: Entry): string {
        const now = new Date(Date.now());
        const nowMonth = monthNames[now.getMonth()];

        if (this.name === nowMonth) {
          return 'now';
        } else {
          return this.name;
        }
      },
      entryDateToISOString(this: Entry): string {
        return this.date.toISOString();
      },
      renderSourcesListFormat(this: RenderData): string {
        const formatter = new Intl.ListFormat('en', {
          style: 'long',
          type: 'conjunction',
        });
        return formatter.format(
          this.sources.map(
            (source) => `<a href="${source.url}">${source.name}</a>`,
          ),
        );
      },
    },
  };
  const html = Mustache.render(mustacheTemplate, data);

  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'index.html'), html);
}

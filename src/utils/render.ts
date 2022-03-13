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
  currentMonth: string;
  lastUpdated: Date;
  sources: Array<Source>;
}

interface RenderData {
  calendar: Calendar;
  currentMonth: string;
  lastUpdated: string;
  sources: Array<Source>;
  utils: Record<string, Function>;
}

type EntryDateHasPastFunction = (this:Entry, text:string) => string;

export function render({ calendar, currentMonth, lastUpdated, sources }: RenderOptions) {
  const data: RenderData = {
    calendar,
    currentMonth,
    lastUpdated: lastUpdated.toISOString(),
    sources,
    utils: {
      entryGetDate(this: Entry): string {
        return String(this.date.getDate()).padStart(2, '0');
      },
      entryDateToISOString(this: Entry): string {
        return this.date.toISOString();
      },
      entryDateHasPast(): EntryDateHasPastFunction {
        const today = new Date(Date.now());
        return function(this: Entry, text: string): string {
          if(this.date < today){
            return text;
          } else {
            return '';
          }
        }
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

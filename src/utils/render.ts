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
import type { Platform } from '../Platform.js';
import type { Calendar, Entry, ICalEntry } from './calendar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pageTemplate = path.resolve(__dirname, '../../static/template.mustache');
const iCalTemplate = path.resolve(__dirname, '../../static/ical.mustache');
const mustachePageTemplate = fs.readFileSync(pageTemplate, 'utf8');
const mustacheICalTemplate = fs.readFileSync(iCalTemplate, 'utf8');
const outputPath = path.resolve(__dirname, '../../');

interface Source {
  name: string;
  url: string;
}

interface ICalRenderOptions {
  entries: Array<ICalEntry>;
}

interface ICalRenderData {
  events: Array<ICalEntry>;
}

interface PageRenderOptions {
  availablePlatforms: Array<Platform>;
  calendar: Calendar;
  currentMonth: string;
  lastUpdated: Date;
  sources: Array<Source>;
}

interface PageRenderDataCheckbox {
  label: string;
  value: string;
}

interface PageRenderData {
  calendar: Calendar;
  currentMonth: string;
  lastUpdated: string;
  platformCheckboxes: Array<PageRenderDataCheckbox>;
  sources: Array<Source>;
  utils: Record<string, Function>;
}

type MustacheLambda = (this: Entry, text: string) => string;

export function renderICalTemplate({ entries }: ICalRenderOptions) {
  const data: ICalRenderData = {
    events: entries,
  };
  const ical = Mustache.render(mustacheICalTemplate, data);
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'games.ics'), ical);
}

let isEntryNow: boolean = false;

export function renderPageTemplate({
  availablePlatforms,
  calendar,
  currentMonth,
  lastUpdated,
  sources,
}: PageRenderOptions) {
  const data: PageRenderData = {
    calendar,
    currentMonth,
    lastUpdated: lastUpdated.toISOString(),
    platformCheckboxes: availablePlatforms.map((platform) => ({
      label: `${platform.name} (${platform.shortName})`,
      value: platform.shortName.toLowerCase(),
    })),
    sources,
    utils: {
      entryDateHasPast(): MustacheLambda {
        const today = new Date(Date.now());
        return function (this: Entry, text: string): string {
          if (this.date < today) {
            return text;
          } else {
            return '';
          }
        };
      },
      entryDateToISOString(this: Entry): string {
        return this.date.toISOString();
      },
      entryGetDate(this: Entry): string {
        return String(this.date.getDate()).padStart(2, '0');
      },
      entryGetPlatformClasses(this: Entry): string {
        return this.platforms
          .map((platform: Platform) => {
            return `has-platform-${platform.shortName.toLowerCase()}`;
          })
          .join(' ');
      },
      entryIsNow(): MustacheLambda {
        const today = new Date(Date.now());
        return function (this: Entry, text: string): string {
          if (!isEntryNow && this.date >= today) {
            isEntryNow = true;
            return text;
          } else {
            return '';
          }
        };
      },
      renderSourcesListFormat(this: PageRenderData): string {
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
  const html = Mustache.render(mustachePageTemplate, data);

  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'index.html'), html);
}

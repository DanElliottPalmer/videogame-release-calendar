import crypto from 'node:crypto';
import type { Platform } from '../Platform.js';
import type { PlatformManager } from '../PlatformManager.js';
import type { VideoGame } from '../VideoGame.js';

interface EntryScore {
  label: string;
  value: number;
}

export interface Entry {
  date: Date;
  name: string;
  platforms: Array<Platform>;
  scores: Array<EntryScore>;
  uid: string;
}

export interface ICalEntry {
  date: string;
  dtstamp: string;
  summary: string;
  uid: string;
}

export interface Month {
  entries: Array<Entry>;
  name: string;
}

export interface Calendar {
  months: Array<Month>;
}

export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function createCalendar(
  manager: PlatformManager,
  videoGames: Array<VideoGame>,
): Calendar {
  const calendar: Calendar = { months: [] };

  videoGames.forEach((videoGame: VideoGame) => {
    const { name, releases, scores } = videoGame.toJSON();
    const releaseDateGroups: Record<string, Array<string>> = {};
    const scoreGroups = Array.from(Object.entries(scores))
      .map(([name, value]) => ({
        label: toCapitalise(name),
        value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    Object.entries(releases).forEach(([platformName, releaseDate]) => {
      let releaseDateGroup = releaseDateGroups[releaseDate];
      if (!releaseDateGroup) {
        releaseDateGroup = releaseDateGroups[releaseDate] = [];
      }
      releaseDateGroup.push(platformName);
    });

    Object.entries(releaseDateGroups).forEach(([releaseDate, platforms]) => {
      const date = new Date(releaseDate);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex] as string;
      let month = calendar.months[monthIndex];
      if (!month) {
        month = calendar.months[monthIndex] = {
          entries: [],
          name: monthName,
        };
      }
      const entry: Entry = {
        date,
        name,
        platforms: platforms
          .map((platformName) => manager.resolve(platformName) as Platform)
          .sort((a, b) => a.shortName.localeCompare(b.shortName)),
        scores: scoreGroups,
        uid: crypto.randomUUID(),
      };
      month.entries.push(entry);
    });
  });

  calendar.months = calendar.months.filter((month) => month);

  calendar.months.forEach((month) => {
    month.entries.sort((entryA, entryB) => {
      // Sort my date
      const sortedDate = entryA.date.getTime() - entryB.date.getTime();
      if (sortedDate !== 0) return sortedDate;
      // Then sort by name
      return entryA.name.localeCompare(entryB.name);
    });
  });

  return calendar;
}

function escape(text: string): string {
  return text
    .replace(/[\\;,]/g, (match) => `\\${match}`)
    .replace(/(?:\r\n|\r|\n)/g, '\\n');
}

export function convertEntryToICalEntry(entry: Entry): ICalEntry {
  const platforms = entry.platforms
    .map(({ shortName }) => shortName)
    .join(', ');
  const summary = escape(`${entry.name} - ${platforms}`);
  const year = entry.date.getUTCFullYear();
  const month = String(entry.date.getUTCMonth() + 1).padStart(2, '0');
  const date = String(entry.date.getUTCDate()).padStart(2, '0');
  return {
    date: [year, month, date].join(''),
    dtstamp: new Date().toISOString().replace(/[^\dtz]/gi, ''),
    summary,
    uid: entry.uid,
  };
}

function toCapitalise(str: string): string {
  return `${str.substring(0, 1).toUpperCase()}${str.substring(1)}`;
}

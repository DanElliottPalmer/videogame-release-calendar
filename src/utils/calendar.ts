import type { Platform } from '../Platform.js';
import type { PlatformManager } from '../PlatformManager.js';
import type { VideoGame } from '../VideoGame.js';

export interface Entry {
  date: Date;
  name: string;
  platforms: Array<string>;
}

export interface Month {
  entries: Array<Entry>;
  name: string;
}

export interface Calendar {
  months: Array<Month>;
}

const monthNames = [
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
    const { name, releases } = videoGame.toJSON();
    const releaseDateGroups: Record<string, Array<string>> = {};

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
          .map((platformName) => {
            const p = manager.resolve(platformName) as Platform;
            return p.shortName;
          })
          .sort((a, b) => a.localeCompare(b)),
      };
      month.entries.push(entry);
    });
  });

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

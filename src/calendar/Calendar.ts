import type { VideoGame, VideoGameCalendarEntry } from "../game/VideoGame.ts";
import { isDefined } from "../utils.ts";

interface MonthEntry {
  entries: Array<VideoGameCalendarEntry>;
  index: number;
  name: string;
}

interface CalendarJson {
  months: Array<Omit<CalendarMonthJson, "updatedAt">>;
  updatedAt: Date;
}

export interface CalendarMonthJson {
  entries: Array<VideoGameCalendarEntry>;
  index: number;
  name: string;
  updatedAt: Date;
}

export class Calendar {
  protected months: ReadonlyArray<MonthEntry> = [
    { entries: [], index: 0, name: "January" },
    { entries: [], index: 1, name: "February" },
    { entries: [], index: 2, name: "March" },
    { entries: [], index: 3, name: "April" },
    { entries: [], index: 4, name: "May" },
    { entries: [], index: 5, name: "June" },
    { entries: [], index: 6, name: "July" },
    { entries: [], index: 7, name: "August" },
    { entries: [], index: 8, name: "September" },
    { entries: [], index: 9, name: "October" },
    { entries: [], index: 10, name: "November" },
    { entries: [], index: 11, name: "December" },
  ];

  addVideoGame(videoGame: VideoGame) {
    for (const entry of videoGame.toCalendarEntries()) {
      const monthIndex = entry.releaseDate.getMonth();
      this.months[monthIndex].entries.push(entry);
    }
  }

  sort() {
    for (const month of this.months) {
      month.entries.sort((entryA, entryB) => {
        // Sort by date
        if (entryA.releaseDate !== entryB.releaseDate) {
          return entryA.releaseDate.getTime() - entryB.releaseDate.getTime();
        }

        // Sort by name
        if (isDefined(entryA.name) && isDefined(entryB.name)) {
          return entryA.name.localeCompare(entryB.name);
        }

        return 0;
      });
    }
  }

  toMonthJSON(monthIndex: number): CalendarMonthJson {
    if (monthIndex < 0 || monthIndex >= this.months.length) {
      throw new RangeError(
        `Month index must be from 0 to ${this.months.length - 1}`,
      );
    }
    const month = this.months[monthIndex];
    return {
      entries: structuredClone(month.entries),
      index: month.index,
      name: month.name,
      updatedAt: new Date(),
    };
  }

  toJSON(): CalendarJson {
    return {
      months: this.months.map((month) => ({
        entries: structuredClone(month.entries),
        index: month.index,
        name: month.name,
      })),
      updatedAt: new Date(),
    };
  }

  *[Symbol.iterator]() {
    for (const month of this.months) {
      yield month;
    }
  }
}

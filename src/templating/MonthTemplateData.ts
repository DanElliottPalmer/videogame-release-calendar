import { format } from "https://deno.land/std@0.212.0/datetime/mod.ts";
import { chunk, isDefined } from "../utils.ts";
import type { CalendarMonthJson } from "../calendar/Calendar.ts";

interface CalendarDate {
  date: Date;
  hasGames: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  text: string;
  url: string | null;
}

interface CalendarMonthLink {
  text: string;
  url: string | null;
}

interface CalendarMonth {
  dates: Array<Array<CalendarDate>>;
  nextMonth: CalendarMonthLink;
  previousMonth: CalendarMonthLink;
  text: string;
}

interface VideoGameEntry {
  id: string;
  platforms: Array<{ name: string, shortName: string}>
  publisher?: string
  releaseDate: Date;
  title: string;
}

interface VideoGameSection {
  date: Date;
  entries: Array<VideoGameEntry>;
  id: string;
  title: string;
}

interface MonthTemplateDataJson {
  calendar: CalendarMonth;
  sections: Array<VideoGameSection>;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const THIS_YEAR = new Date().getFullYear();

const PLURAL_RULES = new Intl.PluralRules("en-US", { type: "ordinal" });
const ORDINAL_SUFFIXES = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
]);

export class MonthTemplateData {
  #calendar: Readonly<CalendarMonth>;
  #sections: Array<VideoGameSection>;

  constructor(value: CalendarMonthJson) {
    this.#calendar = generateCalendar(value);
    this.#sections = generateSections(value);
  }

  toJSON(): MonthTemplateDataJson {
    return {
      calendar: this.#calendar,
      sections: this.#sections.length > 0 ? this.#sections : [],
    };
  }
}

function generateCalendar(value: CalendarMonthJson): CalendarMonth {
  const datesWithGames: Set<string> = new Set(
    value.entries.map((entry) =>
      format(new Date(entry.releaseDate), "yyyy-MM-dd")
    ),
  );
  const today = new Date();
  const totalDays = new Date(2024, value.index + 1, 0, 0, 0, 0, 0).getDate();
  const dates: Array<CalendarDate> = new Array(totalDays).fill(0).map(
    (_, index) => {
      const thisDate = new Date(2024, value.index, index + 1, 0, 0, 0, 0);
      const hasGames = datesWithGames.has(format(thisDate, "yyyy-MM-dd"));
      return {
        date: thisDate,
        hasGames,
        isCurrentMonth: true,
        isToday: isDateSameDay(today, thisDate),
        text: thisDate.getDate().toString(),
        url: hasGames ? `#day-${thisDate.getDate()}` : null,
      };
    },
  );
  // Check if we need to fill out days for the beginning of the week or end of
  // the week.
  // Beginning
  const dayAtBeginning = offsetDay(new Date(2024, value.index, 1).getDay());
  if (dayAtBeginning > 0) {
    const previousDates = new Array(dayAtBeginning).fill(0).map((_, index) => {
      const thisDate = new Date(2024, value.index, -index, 0, 0, 0, 0);
      return {
        date: thisDate,
        hasGames: false,
        isCurrentMonth: false,
        isToday: false,
        text: thisDate.getDate().toString(),
        url: null,
      };
    });
    dates.unshift(...previousDates.reverse());
  }
  // End
  const dayAtEnd = offsetDay(new Date(2024, value.index + 1, 0).getDay());
  if (dayAtEnd < 6) {
    const nextDates = new Array(6 - dayAtEnd).fill(0).map((_, index) => {
      const thisDate = new Date(2024, value.index + 1, index + 1, 0, 0, 0, 0);
      return {
        date: thisDate,
        hasGames: false,
        isCurrentMonth: false,
        isToday: false,
        text: thisDate.getDate().toString(),
        url: null,
      };
    });
    dates.push(...nextDates);
  }

  const previousMonthDate = new Date(2024, value.index - 1, 1, 0, 0, 0, 0);
  const previousMonth = {
    text: MONTHS[previousMonthDate.getMonth()],
    url: previousMonthDate.getFullYear() === THIS_YEAR
      ? `${MONTHS[previousMonthDate.getMonth()].toLowerCase()}.html`
      : null,
  };

  const nextMonthDate = new Date(2024, value.index + 1, 1, 0, 0, 0, 0);
  const nextMonth = {
    text: MONTHS[nextMonthDate.getMonth()],
    url: nextMonthDate.getFullYear() === THIS_YEAR
      ? `${MONTHS[nextMonthDate.getMonth()].toLowerCase()}.html`
      : null,
  };

  return {
    dates: Array.from(chunk(dates, 7)),
    nextMonth,
    previousMonth,
    text: value.name,
  };
}

function generateSections(value: CalendarMonthJson): Array<VideoGameSection> {
  const sortedEntries: VideoGameSection["entries"] = value.entries.map(
    (entry) => {
      if (isDefined(entry.uid) && isDefined(entry.name)) {
        return {
          id: entry.uid,
          platforms: entry.platforms.slice(0),
          publisher: entry.publisher,
          releaseDate: new Date(entry.releaseDate),
          title: entry.name,
        };
      }
    },
  ).filter(<T>(entry: T): entry is NonNullable<T> => isDefined(entry)).toSorted(
    (a, b) => a.releaseDate.getTime() - b.releaseDate.getTime(),
  );

  const sections = [];
  let currentSection: VideoGameSection | undefined = undefined;
  for (const entry of sortedEntries) {
    if (
      !isDefined(currentSection) ||
      !isDateSameDay(currentSection.date, entry.releaseDate)
    ) {
      const sectionDate = new Date(entry.releaseDate);
      sectionDate.setHours(0);
      sectionDate.setMinutes(0);
      sectionDate.setSeconds(0);
      sectionDate.setMilliseconds(0);
      currentSection = {
        date: sectionDate,
        entries: [entry],
        id: `day-${sectionDate.getDate()}`,
        title: getOrdinal(sectionDate.getDate()),
      };
      sections.push(currentSection);
    } else {
      currentSection.entries.push(entry);
    }
  }

  return sections;
}

function getOrdinal(value: number) {
  const rule = PLURAL_RULES.select(value);
  const suffix = ORDINAL_SUFFIXES.get(rule);
  return `${value}${suffix}`;
}

function isDateSameDay(dateA: Date, dateB: Date): boolean {
  return dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();
}

// Weeks start on a Monday
function offsetDay(dayIndex: number): number {
  const offsetDayIndex = dayIndex - 1;
  if (offsetDayIndex < 0) return 6;
  return offsetDayIndex;
}

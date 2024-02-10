import {
  basename,
  extname,
  resolve,
} from "https://deno.land/std@0.209.0/path/mod.ts";
import { minify } from "npm:html-minifier@4.0.0";
import Mustache from "npm:mustache@4.2.0";
import type { CalendarMonthJson } from "../src/calendar/Calendar.ts";
import { isDefined } from "../src/utils.ts";
import { PartialTemplate } from "../src/templating/PartialTemplate.ts";
import { PARTIALS_MAP } from "../src/templating/PartialsMap.ts";
import { MonthTemplateData } from "../src/templating/MonthTemplateData.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const TEMPLATE_DIR = resolve(__dirname, "../templates");
const OUTPUT_DIR = resolve(__dirname, "../docs");

const CALENDAR_JSON_ALL_MONTHS: CalendarMonthJson = await Deno.readTextFile(
  resolve(OUTPUT_DIR, "calendar-all-months.json"),
);
const CALENDAR_JSON_MONTH_FILES: ReadonlyArray<CalendarMonthJson> = [
  await loadCalendarDataFile("calendar-january.json"),
  await loadCalendarDataFile("calendar-february.json"),
  await loadCalendarDataFile("calendar-march.json"),
  await loadCalendarDataFile("calendar-april.json"),
  await loadCalendarDataFile("calendar-may.json"),
  await loadCalendarDataFile("calendar-june.json"),
  await loadCalendarDataFile("calendar-july.json"),
  await loadCalendarDataFile("calendar-august.json"),
  await loadCalendarDataFile("calendar-september.json"),
  await loadCalendarDataFile("calendar-october.json"),
  await loadCalendarDataFile("calendar-november.json"),
  await loadCalendarDataFile("calendar-december.json"),
];
const FILES_TO_COPY: ReadonlyArray<string> = [
  resolve(TEMPLATE_DIR, "main.css"),
];

//==============================================================================
// Execution
//==============================================================================

await run();

if (Deno.args.includes("--watch")) {
  console.info("Watching template directory for changes");
  const watcher = Deno.watchFs(TEMPLATE_DIR);
  for await (const event of watcher) {
    console.info(`Change detected in ${event.paths[0]}`);
    await run();
  }
}

//==============================================================================
// Helpers
//==============================================================================

async function copyFiles() {
  for (const src of FILES_TO_COPY) {
    const partialName = basename(src);
    await Deno.copyFile(src, resolve(OUTPUT_DIR, partialName));
  }
}

async function loadCalendarDataFile(filename: string): CalendarMonthJson {
  const fileContents = await Deno.readTextFile(resolve(OUTPUT_DIR, filename));
  return JSON.parse(fileContents);
}

async function loadAndParseTemplates() {
  for await (const file of Deno.readDir(TEMPLATE_DIR)) {
    if (!file.isFile || extname(file.name) !== ".mustache") continue;
    const partialName = basename(file.name, extname(file.name));
    const templateFilename = resolve(TEMPLATE_DIR, file.name);
    console.debug(`Loading partial: ${templateFilename}`);
    const fileContents = await Deno.readTextFile(templateFilename);
    const partialTemplate = PartialTemplate.fromMustache(
      partialName,
      fileContents,
    );
    Mustache.parse(partialTemplate.markup);
    PARTIALS_MAP.addTemplate(partialTemplate);
  }
  console.log("PARTIALS_MAP", PARTIALS_MAP.toMarkupMap());
}

function renderIndex() {
  const indexTemplate = PARTIALS_MAP.getTemplate("index");
  if (!isDefined(indexTemplate)) {
    throw new Error(`index template is missing`);
  }
  return Mustache.render(
    indexTemplate.markup,
    CALENDAR_JSON_ALL_MONTHS,
    PARTIALS_MAP.toMarkupMap(),
  );
}

function renderMonth(data: CalendarMonthJson) {
  const monthTemplate = PARTIALS_MAP.getTemplate("month");
  if (!isDefined(monthTemplate)) {
    throw new Error(`month template is missing`);
  }
  return Mustache.render(
    monthTemplate.markup,
    (new MonthTemplateData(data)).toJSON(),
    PARTIALS_MAP.toMarkupMap(),
  );
}

async function run() {
  PARTIALS_MAP.clear();
  await copyFiles();
  await loadAndParseTemplates();
  writeFile("index.html", minify(renderIndex()));
  CALENDAR_JSON_MONTH_FILES.forEach((jsonFile) => {
    const filename = `${jsonFile.name.toLowerCase()}.html`;
    writeFile(filename, minify(renderMonth(jsonFile)));
  });
}

async function writeFile(filename: string, fileContents: string) {
  await Deno.writeTextFile(resolve(OUTPUT_DIR, filename), fileContents);
}

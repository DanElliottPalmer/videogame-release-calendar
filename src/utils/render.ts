import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mustache from 'mustache';
import type { Calendar, Entry } from './calendar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.resolve(__dirname, '../../static/template.mustache');
const mustacheTemplate = fs.readFileSync(templatePath, 'utf8');
const outputPath = path.resolve(__dirname, '../../rendered');

interface RenderData {
  calendar: Calendar;
}

export function render({ calendar }: RenderData) {
  const html = Mustache.render(mustacheTemplate, {
    calendar,
    utils: {
      dateGetDate(this: Entry): string {
        return String(this.date.getDate()).padStart(2, '0');
      },
      dateToISOString(this: Entry): string {
        return this.date.toISOString();
      },
    },
  });

  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'index.html'), html);
}

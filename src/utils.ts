import { v5 } from "https://deno.land/std@0.207.0/uuid/mod.ts";
import { Element } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const TEXT_ENCODER = new TextEncoder();

export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

type NonEmptyArray<T> = [T, ...T[]];
export function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

export function nextElementSiblingMatches(
  el: Element,
  selector: string,
): Element | undefined {
  let child: Element | null = el;
  while (true) {
    child = child.nextElementSibling;
    if (child === null) return undefined;
    if (child.matches(selector)) return child;
  }
}

const ROMAN_NUMERALS = new Map([
  ["I", 1],
  ["V", 5],
  ["X", 10],
  ["L", 50],
  ["C", 100],
  ["D", 500],
  ["M", 1000],
]);

const reRomanNumerals = new RegExp(
  "^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$",
  "i",
);

function getRomanNumeralValue(str: string): number {
  let totalValue = 0;
  let currentValue = 0;
  let previousValue = 0;
  for (const char of str.toUpperCase().split("").reverse()) {
    currentValue = ROMAN_NUMERALS.get(char) as number;
    if (currentValue >= previousValue) {
      totalValue += currentValue;
    } else {
      totalValue -= currentValue;
    }
    previousValue = currentValue;
  }
  return totalValue;
}

export function convertRomanNumerals(str: string) {
  return str
    .split(" ")
    .map((word) => {
      if (reRomanNumerals.test(word)) {
        return getRomanNumeralValue(word);
      }
      return word;
    })
    .join(" ");
}

type Bigrams = Set<string>;

function getBigrams(str: string): Bigrams {
  const bigrams: Bigrams = new Set();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

function intersect(set1: Bigrams, set2: Bigrams): Bigrams {
  return new Set([...set1].filter((x) => set2.has(x)));
}

// Sørensen–Dice coefficient
export function diceCoefficient(str1: string, str2: string): number {
  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);
  return (
    (2 * intersect(bigrams1, bigrams2).size) / (bigrams1.size + bigrams2.size)
  );
}

export async function generateDeterministicId(str: string): Promise<string> {
  return await v5.generate(
    "00000000-0000-0000-0000-000000000000",
    TEXT_ENCODER.encode(str),
  );
}

export function* chunk<Item>(
  iter: Iterable<Item>,
  chunkSize: number,
): Array<Array<Item>> {
  let chunk = [];
  for (const v of iter) {
    chunk.push(v);
    if (chunk.length === chunkSize) {
      yield chunk;
      chunk = [];
    }
  }
  if (chunk.length) yield chunk;
}

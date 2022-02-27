const ROMAN_NUMERALS = new Map([
  ['I', 1],
  ['V', 5],
  ['X', 10],
  ['L', 50],
  ['C', 100],
  ['D', 500],
  ['M', 1000],
]);

const reRomanNumerals: RegExp = new RegExp(
  '^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$',
  'i',
);

export function getRomanNumeralValue(str: string): number {
  let totalValue: number = 0;
  let currentValue: number = 0;
  let previousValue: number = 0;
  for (const char of str.toUpperCase().split('').reverse()) {
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
    .split(' ')
    .map((word) => {
      if (reRomanNumerals.test(word)) {
        return getRomanNumeralValue(word);
      }
      return word;
    })
    .join(' ');
}

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

const CONSONANTS = [
  "b",
  "c",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "v",
  "w",
  "z",
];

const VOWELS = [
  //
  "a",
  "e",
  "i",
  "o",
  "u",
  "y",
];

const LETTERS = [...CONSONANTS, ...VOWELS];

function generateNames(): string[] {
  const names: string[] = [];

  for (const ch1 of LETTERS) {
    for (const ch2 of LETTERS) {
      for (const ch3 of LETTERS) {
        for (const ch4 of LETTERS) {
          for (const ch5 of LETTERS) {
            for (const ch6 of LETTERS) {
              names.push(ch1 + ch2 + ch3 + ch4 + ch5 + ch6);
            }
          }
        }
      }
    }
  }

  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [names[i], names[j]] = [names[j], names[i]];
  }

  return names;
}

const NAMES = generateNames().filter(
  (name) => name.includes("mao") && name.includes("lun"),
);

console.log(`Generated ${NAMES.length} names`);

for (const name of NAMES.filter(
  (name) => name.includes("nek") && name.includes("lun"),
).slice(0, 100)) {
  console.log(name);
}

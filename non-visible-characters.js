// Между hello и world вставлены разные невидимые символы:
const sample1 = 'hello​world';   // U+200B zero-width space
const sample2 = 'hello‌world';   // U+200C zero-width non-joiner
const sample3 = 'hello‍world';   // U+200D zero-width joiner
const sample4 = 'hello⁠world';   // U+2060 word joiner
const sample5 = 'hello﻿world';   // U+FEFF zero-width no-break space (BOM)
const sample6 = 'hello‭world';   // U+202D left-to-right override (LTR)
const sample7 = 'hello‬world';   // U+202E right-to-left override (RTL)


const spaces = [
  'hello world',  // U+00A0 no-break space
  'hello world',  // U+2002 en space
  'hello world',  // U+2003 em space
  'hello world',  // U+2009 thin space
  'hello world',  // U+200A hair space
  'hello world',  // U+205F medium math space
  'hello　world',  // U+3000 ideographic space
];
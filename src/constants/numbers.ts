// Number token constants and probability mappings

// Number of dots (probability indicator) for each number
export const NUMBER_DOTS: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

// Quality score for each number (6 and 8 are best)
export const NUMBER_QUALITY: Record<number, number> = {
  2: 0.0,
  3: 0.2,
  4: 0.5,
  5: 0.8,
  6: 1.0,
  8: 1.0,
  9: 0.8,
  10: 0.5,
  11: 0.2,
  12: 0.0,
};

// Standard number distribution for 3-4 player board
export const STANDARD_NUMBER_DISTRIBUTION = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
];

// Probability of rolling each number (out of 36 possible outcomes)
export const ROLL_PROBABILITY: Record<number, number> = {
  2: 1 / 36,
  3: 2 / 36,
  4: 3 / 36,
  5: 4 / 36,
  6: 5 / 36,
  7: 6 / 36, // Robber, doesn't produce resources
  8: 5 / 36,
  9: 4 / 36,
  10: 3 / 36,
  11: 2 / 36,
  12: 1 / 36,
};

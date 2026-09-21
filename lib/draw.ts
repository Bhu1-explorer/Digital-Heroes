/**
 * Pure business logic for the Digital Heroes draw engine.
 * No database connections or UI dependencies here.
 */

export type DrawMode = "random" | "algorithmic";
export type DrawAlgoBias = "frequent" | "rare";

export interface SubscriberInfo {
  id: string;
  plan_type: "monthly" | "yearly";
  price: number; // in paise
  scores: number[]; // exactly 5 scores for eligible users
}

export interface DrawSimulationResult {
  drawNumbers: number[];
  poolTotal: number;
  jackpotCarriedIn: number;
  jackpotCarryOut: number;
  pool5: number;
  pool4: number;
  pool3: number;
  winners5: string[];
  winners4: string[];
  winners3: string[];
  prize5: number; // per winner
  prize4: number; // per winner
  prize3: number; // per winner
  unallocatedRemainder: number; // sum of remainders after integer division, plus any empty 4/3 pools
}

/**
 * Default standard RNG (Math.random)
 */
export const defaultRng = () => Math.random();

/**
 * Calculates the monthly equivalent subscription price in paise.
 */
export function getMonthlyEquivalentPrice(planType: "monthly" | "yearly", pricePaise: number): number {
  if (planType === "yearly") {
    return Math.floor(pricePaise / 12);
  }
  return pricePaise;
}

/**
 * Calculates the match count for a user's scores against the draw numbers.
 */
export function calculateMatchCount(userScores: number[], drawNumbers: number[]): number {
  const distinctScores = new Set(userScores);
  const drawSet = new Set(drawNumbers);
  let matches = 0;
  for (const score of distinctScores) {
    if (drawSet.has(score)) {
      matches++;
    }
  }
  return matches;
}

/**
 * Generates 5 unique draw numbers from 1 to 45.
 * 
 * If mode is random, uses uniform sampling without replacement.
 * If mode is algorithmic, uses weighted sampling without replacement.
 */
export function generateDrawNumbers(
  mode: DrawMode,
  bias: DrawAlgoBias | null,
  eligibleUsers: SubscriberInfo[],
  rng: () => number = defaultRng
): number[] {
  if (mode === "random") {
    return sampleWithoutReplacement(Array.from({ length: 45 }, (_, i) => i + 1), 5, rng);
  }

  // Algorithmic mode
  const frequencies = new Array(46).fill(0); // 1-indexed
  for (const user of eligibleUsers) {
    const distinct = new Set(user.scores);
    for (const s of distinct) {
      if (s >= 1 && s <= 45) {
        frequencies[s]++;
      }
    }
  }

  let maxFreq = 0;
  for (let i = 1; i <= 45; i++) {
    if (frequencies[i] > maxFreq) {
      maxFreq = frequencies[i];
    }
  }

  const itemsWithWeights = [];
  for (let i = 1; i <= 45; i++) {
    const freq = frequencies[i];
    let weight = 1; // Base weight so it never reaches zero
    if (bias === "frequent") {
      weight = 1 + freq;
    } else if (bias === "rare") {
      weight = (maxFreq + 1 - freq);
    }
    itemsWithWeights.push({ item: i, weight });
  }

  return weightedSampleWithoutReplacement(itemsWithWeights, 5, rng);
}

/**
 * Uniform sampling without replacement (Fisher-Yates variant)
 */
function sampleWithoutReplacement<T>(population: T[], k: number, rng: () => number): T[] {
  const result: T[] = [];
  const pool = [...population];
  for (let i = 0; i < k && pool.length > 0; i++) {
    const index = Math.floor(rng() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}

/**
 * Weighted sampling without replacement using A-Res (Algorithm A without replacement)
 * Each item gets a key = rng() ^ (1 / weight). The largest k keys are selected.
 */
function weightedSampleWithoutReplacement<T>(
  population: { item: T; weight: number }[],
  k: number,
  rng: () => number
): T[] {
  const withKeys = population.map(p => {
    // Math.random() is [0, 1). A-Res requires (0, 1].
    let u = rng();
    if (u === 0) u = 1e-10;
    const key = Math.pow(u, 1 / p.weight);
    return { ...p, key };
  });

  // Sort descending by key
  withKeys.sort((a, b) => b.key - a.key);
  
  return withKeys.slice(0, k).map(p => p.item);
}

/**
 * Main simulation function that combines all the business logic.
 */
export function simulateDrawEngine(
  mode: DrawMode,
  bias: DrawAlgoBias | null,
  eligibleUsers: SubscriberInfo[],
  poolPercent: number,
  jackpotCarriedIn: number,
  preDrawnNumbers?: number[],
  rng: () => number = defaultRng
): DrawSimulationResult {
  
  // 1. Generate or use pre-drawn numbers
  const drawNumbers = preDrawnNumbers && preDrawnNumbers.length === 5 
    ? preDrawnNumbers 
    : generateDrawNumbers(mode, bias, eligibleUsers, rng);
  
  // 2. Calculate Total Pool
  let sumMonthlyPrices = 0;
  for (const user of eligibleUsers) {
    sumMonthlyPrices += getMonthlyEquivalentPrice(user.plan_type, user.price);
  }
  const poolTotal = Math.floor(sumMonthlyPrices * (poolPercent / 100));

  // 3. Tier Split (40/35/25)
  // We use floor to ensure we don't accidentally over-allocate by pennies in rounding
  const basePool5 = Math.floor(poolTotal * 0.40);
  const pool4 = Math.floor(poolTotal * 0.35);
  const pool3 = poolTotal - basePool5 - pool4; // remainder goes to pool3 to ensure sum == poolTotal
  const pool5 = basePool5 + jackpotCarriedIn;

  // 4. Find Winners
  const winners5: string[] = [];
  const winners4: string[] = [];
  const winners3: string[] = [];

  for (const user of eligibleUsers) {
    const matches = calculateMatchCount(user.scores, drawNumbers);
    if (matches === 5) winners5.push(user.id);
    else if (matches === 4) winners4.push(user.id);
    else if (matches === 3) winners3.push(user.id);
  }

  // 5. Payouts and Carry-out
  let jackpotCarryOut = 0;
  let unallocatedRemainder = 0;

  let prize5 = 0;
  if (winners5.length > 0) {
    prize5 = Math.floor(pool5 / winners5.length);
    unallocatedRemainder += (pool5 - (prize5 * winners5.length));
  } else {
    // Rollover
    jackpotCarryOut = pool5;
  }

  let prize4 = 0;
  if (winners4.length > 0) {
    prize4 = Math.floor(pool4 / winners4.length);
    unallocatedRemainder += (pool4 - (prize4 * winners4.length));
  } else {
    // Empty tier 4 is unallocated
    unallocatedRemainder += pool4;
  }

  let prize3 = 0;
  if (winners3.length > 0) {
    prize3 = Math.floor(pool3 / winners3.length);
    unallocatedRemainder += (pool3 - (prize3 * winners3.length));
  } else {
    // Empty tier 3 is unallocated
    unallocatedRemainder += pool3;
  }

  return {
    drawNumbers,
    poolTotal,
    jackpotCarriedIn,
    jackpotCarryOut,
    pool5,
    pool4,
    pool3,
    winners5,
    winners4,
    winners3,
    prize5,
    prize4,
    prize3,
    unallocatedRemainder
  };
}

import { describe, it, expect } from 'vitest';
import { 
  simulateDrawEngine, 
  getMonthlyEquivalentPrice, 
  calculateMatchCount,
  SubscriberInfo,
  generateDrawNumbers
} from './draw';

// A simple deterministic PRNG for testing (Linear Congruential Generator)
function createSeededRng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('Draw Engine Pure Logic', () => {
  it('calculates monthly equivalent price correctly', () => {
    expect(getMonthlyEquivalentPrice('monthly', 499)).toBe(499);
    expect(getMonthlyEquivalentPrice('yearly', 4999)).toBe(Math.floor(4999 / 12));
  });

  it('calculates match count correctly with unique sets', () => {
    expect(calculateMatchCount([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(5);
    expect(calculateMatchCount([1, 2, 3, 4, 5], [1, 2, 3, 6, 7])).toBe(3);
    expect(calculateMatchCount([1, 2, 3, 4, 5], [6, 7, 8, 9, 10])).toBe(0);
    
    // Duplicate scores in user input only count as 1 match (distinct)
    expect(calculateMatchCount([1, 1, 1, 1, 1], [1, 2, 3, 4, 5])).toBe(1);
  });

  it('generates 5 unique numbers within range (deterministic RNG)', () => {
    const rng = createSeededRng(12345);
    const users: SubscriberInfo[] = [];
    const draw = generateDrawNumbers('random', null, users, rng);
    
    expect(draw.length).toBe(5);
    const unique = new Set(draw);
    expect(unique.size).toBe(5);
    for (const num of draw) {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(45);
    }
    
    // Test determinism
    const rng2 = createSeededRng(12345);
    const draw2 = generateDrawNumbers('random', null, users, rng2);
    expect(draw).toEqual(draw2);
  });

  describe('Simulation and Money Conservation', () => {
    const generateDemoUsers = (count: number): SubscriberInfo[] => {
      const users: SubscriberInfo[] = [];
      const rng = createSeededRng(42);
      for (let i = 0; i < count; i++) {
        // Generate exactly 5 distinct scores for each user
        const scores = new Set<number>();
        while (scores.size < 5) {
          scores.add(Math.floor(rng() * 45) + 1);
        }
        users.push({
          id: `user-${i}`,
          plan_type: 'monthly',
          price: 499,
          scores: Array.from(scores)
        });
      }
      return users;
    };

    it('conserves money across all tiers in random scenarios', () => {
      const rng = createSeededRng(999);
      for (let i = 0; i < 10; i++) {
        const users = generateDemoUsers(50);
        const carriedIn = Math.floor(rng() * 10000);
        
        const result = simulateDrawEngine(
          'random',
          null,
          users,
          50, // 50% pool
          carriedIn,
          undefined,
          rng
        );

        // Calculate expected conservation
        // Tier 5
        let tier5Paid = result.winners5.length * result.prize5;
        let tier5Unallocated = 0;
        if (result.winners5.length === 0) {
          expect(result.jackpotCarryOut).toBe(result.pool5);
        } else {
          expect(result.jackpotCarryOut).toBe(0);
          tier5Unallocated = result.pool5 - tier5Paid;
        }

        // Tier 4
        let tier4Paid = result.winners4.length * result.prize4;
        let tier4Unallocated = result.pool4 - tier4Paid; // Empty tier4 is completely unallocated

        // Tier 3
        let tier3Paid = result.winners3.length * result.prize3;
        let tier3Unallocated = result.pool3 - tier3Paid;

        const totalPaid = tier5Paid + tier4Paid + tier3Paid;
        const expectedUnallocated = tier5Unallocated + tier4Unallocated + tier3Unallocated;
        
        expect(result.unallocatedRemainder).toBe(expectedUnallocated);
        
        // Ensure the split total equals the total pool exactly (without carry in)
        expect(result.poolTotal).toBe((result.pool5 - carriedIn) + result.pool4 + result.pool3);
      }
    });

    it('maintains a continuous jackpot chain across 3 months', () => {
      const rng = createSeededRng(100);
      
      // Ensure no tier 5 winners by passing empty users
      const usersMonth1: SubscriberInfo[] = [{
        id: 'u1', plan_type: 'monthly', price: 49900, scores: [1, 2, 3, 4, 5]
      }];
      
      // Month 1
      const res1 = simulateDrawEngine('random', null, usersMonth1, 50, 0, [6, 7, 8, 9, 10], rng);
      expect(res1.winners5.length).toBe(0);
      expect(res1.jackpotCarryOut).toBe(res1.pool5); // All of tier 5 pool rolled over
      
      // Month 2
      const res2 = simulateDrawEngine('random', null, usersMonth1, 50, res1.jackpotCarryOut, [11, 12, 13, 14, 15], rng);
      expect(res2.jackpotCarriedIn).toBe(res1.jackpotCarryOut);
      expect(res2.winners5.length).toBe(0);
      expect(res2.jackpotCarryOut).toBe(res2.pool5); // base tier 5 + carried in
      
      // Month 3: Someone wins
      const usersMonth3: SubscriberInfo[] = [{
        id: 'u1', plan_type: 'monthly', price: 49900, scores: [11, 12, 13, 14, 15]
      }];
      const res3 = simulateDrawEngine('random', null, usersMonth3, 50, res2.jackpotCarryOut, [11, 12, 13, 14, 15], rng);
      expect(res3.jackpotCarriedIn).toBe(res2.jackpotCarryOut);
      expect(res3.winners5.length).toBe(1);
      expect(res3.jackpotCarryOut).toBe(0);
      
      // The prize should be floor(pool5 / 1), which is pool5.
      expect(res3.prize5).toBe(res3.pool5);
    });
  });
});

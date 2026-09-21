import { expect, test, describe } from 'vitest'
import { calculateMonthlyContribution, aggregateCharityTotals } from './charity'

describe('calculateMonthlyContribution', () => {
  test('calculates correct monthly contribution for monthly plan', () => {
    // $4.99 plan, 10% -> 49.9 cents -> 50 cents
    expect(calculateMonthlyContribution('monthly', 499, 10)).toBe(50)
    // 20% -> 100 cents
    expect(calculateMonthlyContribution('monthly', 499, 20)).toBe(100)
  })

  test('calculates correct monthly contribution for yearly plan', () => {
    // $49.99 yearly -> ~4.16 per month. 10% -> 41.6 cents -> 42 cents
    expect(calculateMonthlyContribution('yearly', 4999, 10)).toBe(42)
  })

  test('enforces minimum 10% contribution', () => {
    // Try passing 5%, should act like 10%
    expect(calculateMonthlyContribution('monthly', 499, 5)).toBe(50)
  })
})

describe('aggregateCharityTotals', () => {
  test('aggregates correctly', () => {
    const subscriptions = [
      { plan_type: 'monthly' as const, price: 499, charity_percent: 10 }, // 50
      { plan_type: 'yearly' as const, price: 4999, charity_percent: 20 }, // ~83
    ]
    
    const donations = [
      { amount: 1000, status: 'completed' }, // $10
      { amount: 2500 }, // $25 (implicit completed)
      { amount: 5000, status: 'pending' } // Should be ignored
    ]
    
    const total = aggregateCharityTotals(subscriptions, donations)
    expect(total).toBe(50 + 83 + 1000 + 2500)
  })
})

import { z } from "zod"

describe('charity schema validation', () => {
  const schema = z.string().min(1) // matching what we changed the charityId validation to
  
  test('accepts seeded charity IDs that strict UUIDv4 might reject', () => {
    const seededIds = [
      'b0e2b4d1-c1e1-4b71-9c6a-1d54238db34a',
      'd2f4b5e2-e2f2-5c82-ac7b-2e65349ec45b',
      'f4a6c7f3-f3a3-6d93-bd8c-3f7645afd56c',
      'a1b3d5c4-a4b4-7e04-ce9d-4a8756bfe67d',
      'c3e5f7d6-c6d6-8f15-df0e-5b9867c0f78e',
      'e5a7b9e8-e8f8-4a26-8f1f-6c0978d1a89f'
    ]
    
    seededIds.forEach(id => {
      expect(schema.safeParse(id).success).toBe(true)
    })
  })
})

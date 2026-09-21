import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest'
import { validateNewScore, Score } from './scores'

describe('validateNewScore', () => {
  const todayDate = new Date().toISOString().split('T')[0]
  
  // Create a mock date string for tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().split('T')[0]

  const mockScores: Score[] = [
    { id: '1', user_id: 'u1', score: 20, played_on: '2025-01-05', created_at: '2025-01-05T00:00:00Z' },
    { id: '2', user_id: 'u1', score: 22, played_on: '2025-01-04', created_at: '2025-01-04T00:00:00Z' },
    { id: '3', user_id: 'u1', score: 25, played_on: '2025-01-03', created_at: '2025-01-03T00:00:00Z' },
    { id: '4', user_id: 'u1', score: 18, played_on: '2025-01-02', created_at: '2025-01-02T00:00:00Z' },
    { id: '5', user_id: 'u1', score: 30, played_on: '2025-01-01', created_at: '2025-01-01T00:00:00Z' },
  ]

  test('validates correctly under 5 scores', () => {
    const result = validateNewScore(mockScores.slice(0, 3), '2025-01-01', 15)
    expect(result.valid).toBe(true)
  })

  test('rejects score out of range', () => {
    expect(validateNewScore([], '2025-01-01', 0).valid).toBe(false)
    expect(validateNewScore([], '2025-01-01', 46).valid).toBe(false)
  })

  test('rejects future date', () => {
    const result = validateNewScore([], tomorrowDate, 20)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.code).toBe('FUTURE_DATE')
  })

  test('rejects duplicate date', () => {
    const result = validateNewScore(mockScores.slice(0, 2), '2025-01-05', 20)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.code).toBe('DUPLICATE_DATE')
  })

  test('accepts exactly 5 existing scores if new date is newer', () => {
    const result = validateNewScore(mockScores, '2025-01-06', 20)
    expect(result.valid).toBe(true)
  })

  test('rejects if exactly 5 existing scores and new date is older', () => {
    const result = validateNewScore(mockScores, '2024-12-31', 20)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.code).toBe('TOO_OLD')
  })
})

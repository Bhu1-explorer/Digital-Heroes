export interface Score {
  id: string
  user_id: string
  score: number
  played_on: string // YYYY-MM-DD
  created_at: string
}

export type ScoreValidationResult = 
  | { valid: true }
  | { valid: false; error: string; code: string }

export function validateNewScore(existingScores: Score[], newDateStr: string, newScoreValue: number): ScoreValidationResult {
  // Range check
  if (newScoreValue < 1 || newScoreValue > 45) {
    return { valid: false, error: "Score must be between 1 and 45.", code: "OUT_OF_RANGE" }
  }

  // Future date check
  const today = new Date().toISOString().split('T')[0]
  if (newDateStr > today) {
    return { valid: false, error: "Cannot enter a score for a future date.", code: "FUTURE_DATE" }
  }

  // Duplicate date check
  const hasDuplicate = existingScores.some(s => s.played_on === newDateStr)
  if (hasDuplicate) {
    return { valid: false, error: "You already have a score for that date, edit it instead.", code: "DUPLICATE_DATE" }
  }

  // Rolling-5 age check
  if (existingScores.length >= 5) {
    // Sort existing descending by date
    const sorted = [...existingScores].sort((a, b) => {
      if (a.played_on > b.played_on) return -1
      if (a.played_on < b.played_on) return 1
      if (a.created_at > b.created_at) return -1
      if (a.created_at < b.created_at) return 1
      return 0
    })

    const fifthOldest = sorted[4]
    
    if (newDateStr < fifthOldest.played_on) {
      return { valid: false, error: "Score date is too old. Only the most recent 5 scores are kept.", code: "TOO_OLD" }
    }
  }

  return { valid: true }
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate choice order for question shuffling
export function generateChoiceOrder(): number[] {
  return shuffleArray([0, 1, 2, 3])
}

// Get correct index after shuffling
export function getCorrectIndex(answerLabel: string, choiceOrder: number[]): number {
  const baseIndex = answerLabel.charCodeAt(0) - 'A'.charCodeAt(0)
  return choiceOrder.indexOf(baseIndex)
}

// Format time in MM:SS
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Calculate scaled score from percent correct
export function calculateScaledScore(percentCorrect: number, section: string): number {
  // Simplified monotone mapping from percent to ACT scale (1-36)
  const minScore = 1
  const maxScore = 36
  const scaled = Math.round(minScore + (maxScore - minScore) * (percentCorrect / 100))
  return Math.min(maxScore, Math.max(minScore, scaled))
}

// Get section time limits in seconds
export function getSectionTimeLimit(section: string): number {
  const limits: Record<string, number> = {
    EN: 45 * 60,    // 45 minutes
    MATH: 60 * 60,  // 60 minutes
    RD: 35 * 60,    // 35 minutes
    SCI: 35 * 60,   // 35 minutes
  }
  return limits[section] || 60 * 60
}

// Apply time accommodations
export function applyTimeAccommodation(baseTime: number, multiplier: number): number {
  return Math.round(baseTime * (multiplier / 100))
}

// Calculate spaced repetition interval
export function calculateNextInterval(currentInterval: number, ease: number, correct: boolean): {
  interval: number
  ease: number
} {
  if (!correct) {
    return {
      interval: 2, // Reset to 2 days on incorrect
      ease: Math.max(1.3, ease - 0.2), // Decrease ease
    }
  }
  
  // Success: increase interval
  const newInterval = Math.round(currentInterval * ease)
  const newEase = Math.min(2.5, ease + 0.1) // Increase ease slightly
  
  return {
    interval: Math.min(newInterval, 365), // Cap at 1 year
    ease: newEase,
  }
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

// Check if user is in quiet hours
export function isInQuietHours(quietStart?: string | null, quietEnd?: string | null): boolean {
  if (!quietStart || !quietEnd) return false
  
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  const [startHour, startMin] = quietStart.split(':').map(Number)
  const [endHour, endMin] = quietEnd.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime
  } else {
    // Quiet hours cross midnight
    return currentTime >= startTime || currentTime <= endTime
  }
}

// Generate SHA256 hash for idempotency
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
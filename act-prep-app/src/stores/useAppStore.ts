import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  currentStep: number
  completedSteps: string[]
  data: {
    ageConfirmed: boolean
    tosAccepted: boolean
    privacyAccepted: boolean
    testDate: string | null
    timeMultiplier: number
    dailyTargetMinutes: number
    preferredWindow: string | null
    emailOk: boolean
    pushOk: boolean
    quietStart: string | null
    quietEnd: string | null
    reducedMotion: boolean
    dyslexiaFont: boolean
    startMode: 'diagnostic' | 'daily'
  }
}

interface SessionState {
  currentSession: {
    id: string
    formId: string
    section: string
    mode: 'diagnostic' | 'drill' | 'timed' | 'review'
    startedAt: Date
    timeLimit: number | null
    currentQuestionIndex: number
    answers: Map<string, {
      questionId: string
      choiceOrder: number[]
      correctIdx: number
      selectedIdx: number | null
      timeSpent: number
    }>
  } | null
}

interface AppState {
  // Onboarding
  onboarding: OnboardingState
  setOnboardingStep: (step: number) => void
  updateOnboardingData: (data: Partial<OnboardingState['data']>) => void
  completeOnboardingStep: (stepName: string) => void
  resetOnboarding: () => void
  
  // Session Management
  session: SessionState
  startSession: (session: SessionState['currentSession']) => void
  updateSessionAnswer: (questionId: string, answer: any) => void
  endSession: () => void
  
  // Preferences
  preferences: {
    reducedMotion: boolean
    dyslexiaFont: boolean
  }
  setPreferences: (prefs: Partial<AppState['preferences']>) => void
  
  // Progress tracking
  streaks: {
    current: number
    longest: number
    lastActivity: Date | null
  }
  xp: number
  addXP: (points: number) => void
  updateStreak: () => void
}

const initialOnboardingState: OnboardingState = {
  currentStep: 0,
  completedSteps: [],
  data: {
    ageConfirmed: false,
    tosAccepted: false,
    privacyAccepted: false,
    testDate: null,
    timeMultiplier: 100,
    dailyTargetMinutes: 25,
    preferredWindow: null,
    emailOk: false,
    pushOk: false,
    quietStart: null,
    quietEnd: null,
    reducedMotion: false,
    dyslexiaFont: false,
    startMode: 'diagnostic',
  },
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Onboarding
      onboarding: initialOnboardingState,
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step },
        })),
      updateOnboardingData: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            data: { ...state.onboarding.data, ...data },
          },
        })),
      completeOnboardingStep: (stepName) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            completedSteps: [...state.onboarding.completedSteps, stepName],
          },
        })),
      resetOnboarding: () =>
        set(() => ({
          onboarding: initialOnboardingState,
        })),
      
      // Session Management
      session: {
        currentSession: null,
      },
      startSession: (session) =>
        set(() => ({
          session: { currentSession: session },
        })),
      updateSessionAnswer: (questionId, answer) =>
        set((state) => {
          if (!state.session.currentSession) return state
          const answers = new Map(state.session.currentSession.answers)
          answers.set(questionId, answer)
          return {
            session: {
              currentSession: {
                ...state.session.currentSession,
                answers,
              },
            },
          }
        }),
      endSession: () =>
        set(() => ({
          session: { currentSession: null },
        })),
      
      // Preferences
      preferences: {
        reducedMotion: false,
        dyslexiaFont: false,
      },
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      
      // Progress tracking
      streaks: {
        current: 0,
        longest: 0,
        lastActivity: null,
      },
      xp: 0,
      addXP: (points) =>
        set((state) => ({
          xp: state.xp + points,
        })),
      updateStreak: () =>
        set((state) => {
          const now = new Date()
          const lastActivity = state.streaks.lastActivity
          
          if (!lastActivity) {
            return {
              streaks: {
                current: 1,
                longest: 1,
                lastActivity: now,
              },
            }
          }
          
          const daysSinceLastActivity = Math.floor(
            (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysSinceLastActivity === 0) {
            // Same day
            return state
          } else if (daysSinceLastActivity === 1) {
            // Next day - continue streak
            const newCurrent = state.streaks.current + 1
            return {
              streaks: {
                current: newCurrent,
                longest: Math.max(newCurrent, state.streaks.longest),
                lastActivity: now,
              },
            }
          } else {
            // Streak broken
            return {
              streaks: {
                current: 1,
                longest: state.streaks.longest,
                lastActivity: now,
              },
            }
          }
        }),
    }),
    {
      name: 'act-prep-storage',
      partialize: (state) => ({
        onboarding: state.onboarding,
        preferences: state.preferences,
        streaks: state.streaks,
        xp: state.xp,
      }),
    }
  )
)
import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../stores/useAppStore'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card'
import { Progress } from '../ui/Progress'
import { cn } from '../../lib/utils'
import { ChevronRight, ChevronLeft, Check, Calendar, Clock, Mail, Volume2, Eye } from 'lucide-react'

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Age verification and terms' },
  { id: 'test-date', title: 'Test Date', description: 'When are you taking the ACT?' },
  { id: 'accommodations', title: 'Accommodations', description: 'Extra time settings' },
  { id: 'goals', title: 'Goals', description: 'Daily study targets' },
  { id: 'notifications', title: 'Notifications', description: 'Reminders and quiet hours' },
  { id: 'accessibility', title: 'Accessibility', description: 'Visual preferences' },
  { id: 'start', title: 'Get Started', description: 'Choose your starting point' },
]

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    onboarding, 
    setOnboardingStep, 
    updateOnboardingData, 
    completeOnboardingStep,
    resetOnboarding 
  } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentStep = ONBOARDING_STEPS[onboarding.currentStep]
  const progress = ((onboarding.currentStep + 1) / ONBOARDING_STEPS.length) * 100

  const handleNext = async () => {
    setError(null)
    
    // Validate current step
    const validation = validateStep(onboarding.currentStep, onboarding.data)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    // Mark step as complete
    completeOnboardingStep(currentStep.id)

    // If this is the last step, save to database
    if (onboarding.currentStep === ONBOARDING_STEPS.length - 1) {
      await saveOnboardingData()
    } else {
      setOnboardingStep(onboarding.currentStep + 1)
    }
  }

  const handleBack = () => {
    if (onboarding.currentStep > 0) {
      setOnboardingStep(onboarding.currentStep - 1)
    }
  }

  const saveOnboardingData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Save user preferences
      const { error: prefsError } = await supabase
        .from('user_prefs')
        .upsert({
          user_id: user.id,
          email_ok: onboarding.data.emailOk,
          push_ok: onboarding.data.pushOk,
          quiet_start: onboarding.data.quietStart,
          quiet_end: onboarding.data.quietEnd,
          reduced_motion: onboarding.data.reducedMotion,
          dyslexia_font: onboarding.data.dyslexiaFont,
        })

      if (prefsError) throw prefsError

      // Save goal
      const { error: goalError } = await supabase
        .from('goal')
        .upsert({
          user_id: user.id,
          test_date: onboarding.data.testDate,
          daily_target_minutes: onboarding.data.dailyTargetMinutes,
          preferred_window: onboarding.data.preferredWindow,
        })

      if (goalError) throw goalError

      // Save accommodations
      const { error: accError } = await supabase
        .from('accommodations')
        .upsert({
          user_id: user.id,
          time_multiplier: onboarding.data.timeMultiplier,
        })

      if (accError) throw accError

      // Reset onboarding state
      resetOnboarding()

      // Navigate based on start mode
      if (onboarding.data.startMode === 'diagnostic') {
        navigate({ to: '/diagnostic' })
      } else {
        navigate({ to: '/dashboard' })
      }
    } catch (err) {
      setError('Failed to save your preferences. Please try again.')
      console.error('Onboarding save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step: number, data: typeof onboarding.data) => {
    switch (step) {
      case 0: // Welcome
        if (!data.ageConfirmed) {
          return { valid: false, error: 'Please confirm you are 13 or older' }
        }
        if (!data.tosAccepted || !data.privacyAccepted) {
          return { valid: false, error: 'Please accept the terms and privacy policy' }
        }
        break
      case 1: // Test date
        if (!data.testDate) {
          return { valid: false, error: 'Please select your test date' }
        }
        break
      case 2: // Accommodations
        // No validation needed - has default
        break
      case 3: // Goals
        if (!data.dailyTargetMinutes) {
          return { valid: false, error: 'Please select your daily study target' }
        }
        break
      case 4: // Notifications
        // No validation needed - all optional
        break
      case 5: // Accessibility
        // No validation needed - all optional
        break
      case 6: // Start mode
        // No validation needed - has default
        break
    }
    return { valid: true }
  }

  const renderStepContent = () => {
    switch (onboarding.currentStep) {
      case 0: // Welcome
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                This app is not affiliated with ACT, Inc. It's an independent study tool.
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={onboarding.data.ageConfirmed}
                  onChange={(e) => updateOnboardingData({ ageConfirmed: e.target.checked })}
                  className="mt-1 mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I confirm that I am 13 years or older
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={onboarding.data.tosAccepted}
                  onChange={(e) => updateOnboardingData({ tosAccepted: e.target.checked })}
                  className="mt-1 mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I accept the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={onboarding.data.privacyAccepted}
                  onChange={(e) => updateOnboardingData({ privacyAccepted: e.target.checked })}
                  className="mt-1 mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  I accept the <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>
          </div>
        )

      case 1: // Test date
        return (
          <div className="space-y-4">
            <Input
              type="date"
              label="When is your ACT test date?"
              value={onboarding.data.testDate || ''}
              onChange={(e) => updateOnboardingData({ testDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              helperText="We'll create a personalized study plan based on your test date"
            />
          </div>
        )

      case 2: // Accommodations
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you have approved testing accommodations, select your time extension:
            </p>
            <div className="space-y-2">
              {[
                { value: 100, label: 'Standard time (no accommodations)' },
                { value: 150, label: 'Time and a half (50% extra)' },
                { value: 200, label: 'Double time (100% extra)' },
              ].map((option) => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="timeMultiplier"
                    value={option.value}
                    checked={onboarding.data.timeMultiplier === option.value}
                    onChange={() => updateOnboardingData({ timeMultiplier: option.value })}
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 3: // Goals
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily study target (minutes)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 25, 40].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => updateOnboardingData({ dailyTargetMinutes: minutes })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-colors',
                      onboarding.data.dailyTargetMinutes === minutes
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="text-lg font-semibold">{minutes}</div>
                    <div className="text-xs text-gray-500">min/day</div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              type="time"
              label="Preferred study time (optional)"
              value={onboarding.data.preferredWindow || ''}
              onChange={(e) => updateOnboardingData({ preferredWindow: e.target.value })}
              helperText="When do you prefer to study each day?"
            />
          </div>
        )

      case 4: // Notifications
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Email reminders</div>
                    <div className="text-sm text-gray-500">Get daily study reminders</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={onboarding.data.emailOk}
                  onChange={(e) => updateOnboardingData({ emailOk: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>

            {onboarding.data.emailOk && (
              <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="time"
                    label="Quiet hours start"
                    value={onboarding.data.quietStart || ''}
                    onChange={(e) => updateOnboardingData({ quietStart: e.target.value })}
                  />
                  <Input
                    type="time"
                    label="Quiet hours end"
                    value={onboarding.data.quietEnd || ''}
                    onChange={(e) => updateOnboardingData({ quietEnd: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  We won't send notifications during quiet hours
                </p>
              </div>
            )}
          </div>
        )

      case 5: // Accessibility
        return (
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Reduce motion</div>
                  <div className="text-sm text-gray-500">Minimize animations and transitions</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onboarding.data.reducedMotion}
                onChange={(e) => updateOnboardingData({ reducedMotion: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Volume2 className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Dyslexia-friendly font</div>
                  <div className="text-sm text-gray-500">Use OpenDyslexic font for better readability</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onboarding.data.dyslexiaFont}
                onChange={(e) => updateOnboardingData({ dyslexiaFont: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        )

      case 6: // Start mode
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              How would you like to begin your ACT prep journey?
            </p>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="startMode"
                  value="diagnostic"
                  checked={onboarding.data.startMode === 'diagnostic'}
                  onChange={() => updateOnboardingData({ startMode: 'diagnostic' })}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium">Take a diagnostic test</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Get a baseline score and identify your weak areas (25-30 minutes)
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="startMode"
                  value="daily"
                  checked={onboarding.data.startMode === 'daily'}
                  onChange={() => updateOnboardingData({ startMode: 'daily' })}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium">Start daily practice</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Jump right into your personalized study plan
                  </div>
                </div>
              </label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Progress value={progress} className="mb-4" />
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {renderStepContent()}
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={onboarding.currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            loading={loading}
          >
            {onboarding.currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                Get Started
                <Check className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
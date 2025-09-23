import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../stores/useAppStore'
import { supabase } from '../../lib/supabase'
import { QuestionDisplay } from '../../components/practice/QuestionDisplay'
import { Timer } from '../../components/practice/Timer'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Progress } from '../../components/ui/Progress'
import { 
  generateChoiceOrder, 
  getCorrectIndex, 
  getSectionTimeLimit, 
  applyTimeAccommodation,
  calculateScaledScore
} from '../../lib/utils'
import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react'

interface SectionQuestion {
  id: string
  ord: number
  stem: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  answer: string
  explanation: string
  passage_title?: string
  passage_text?: string
}

export function TimedSection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { startSession, updateSessionAnswer, endSession, session, updateStreak, addXP } = useAppStore()
  
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<'EN' | 'MATH' | 'RD' | 'SCI' | null>(null)
  const [formId, setFormId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<SectionQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLimit, setTimeLimit] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [accommodationMultiplier, setAccommodationMultiplier] = useState(100)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  // Load user accommodations and available forms
  useEffect(() => {
    if (user) {
      loadInitialData()
    }
  }, [user])

  const loadInitialData = async () => {
    if (!user) return

    try {
      // Get user accommodations
      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('time_multiplier')
        .eq('user_id', user.id)
        .single()

      if (accommodations) {
        setAccommodationMultiplier(accommodations.time_multiplier)
      }

      // Get available forms
      const { data: forms } = await supabase
        .from('forms')
        .select('*')
        .eq('is_active', true)
        .limit(1)

      if (forms && forms.length > 0) {
        setFormId(forms[0].id)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading initial data:', error)
      setLoading(false)
    }
  }

  const startSection = async (selectedSection: 'EN' | 'MATH' | 'RD' | 'SCI') => {
    if (!user || !formId) return

    setLoading(true)
    setSection(selectedSection)

    try {
      // Load questions for the section
      const { data: sectionQuestions, error } = await supabase
        .from('v_form_section')
        .select('*')
        .eq('form_id', formId)
        .eq('section', selectedSection)
        .order('ord')

      if (error) throw error

      if (!sectionQuestions || sectionQuestions.length === 0) {
        alert('No questions available for this section')
        return
      }

      setQuestions(sectionQuestions)

      // Calculate time limit with accommodations
      const baseTime = getSectionTimeLimit(selectedSection)
      const adjustedTime = applyTimeAccommodation(baseTime, accommodationMultiplier)
      setTimeLimit(adjustedTime)

      // Create session
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          form_id: formId,
          section: selectedSection,
          mode: 'timed',
          time_limit_sec: adjustedTime,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      setSessionId(newSession.id)

      // Initialize app store session
      const sessionData = {
        id: newSession.id,
        formId: formId,
        section: selectedSection,
        mode: 'timed' as const,
        startedAt: new Date(),
        timeLimit: adjustedTime,
        currentQuestionIndex: 0,
        answers: new Map(),
      }

      startSession(sessionData)
      setQuestionStartTime(Date.now())
      setLoading(false)
    } catch (error) {
      console.error('Error starting section:', error)
      setLoading(false)
    }
  }

  const handleAnswer = async (selectedIdx: number) => {
    if (!user || !session.currentSession || !questions[currentIndex]) return

    const question = questions[currentIndex]
    const choiceOrder = session.currentSession.answers.get(question.id)?.choiceOrder || generateChoiceOrder()
    const correctIdx = getCorrectIndex(question.answer, choiceOrder)
    const timeSpent = Date.now() - questionStartTime

    // Save to database
    try {
      await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          form_id: formId,
          question_id: question.id,
          question_ord: question.ord,
          choice_order: choiceOrder,
          correct_idx: correctIdx,
          selected_idx: selectedIdx,
          time_spent_ms: timeSpent,
        })

      // Update session state
      updateSessionAnswer(question.id, {
        questionId: question.id,
        choiceOrder,
        correctIdx,
        selectedIdx,
        timeSpent,
      })

      // If wrong, add to review queue
      if (selectedIdx !== correctIdx) {
        await supabase
          .from('review_queue')
          .upsert({
            user_id: user.id,
            question_id: question.id,
            due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
            interval_days: 2,
            ease: 2.5,
            lapses: 0,
          })
      }
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleTimeUp = async () => {
    await completeSection()
  }

  const completeSection = async () => {
    if (!user || !sessionId) return

    setIsComplete(true)

    try {
      // End session
      await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)

      // Calculate results
      const correctCount = Array.from(session.currentSession?.answers.values() || [])
        .filter(a => a.selectedIdx === a.correctIdx)
        .length

      const percentCorrect = (correctCount / questions.length) * 100
      const scaledScore = calculateScaledScore(percentCorrect, section!)

      // Update user progress
      updateStreak()
      addXP(Math.round(percentCorrect * 10))

      // Clean up session
      endSession()

      // Show results
      setIsComplete(true)
    } catch (error) {
      console.error('Error completing section:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Timed Section Practice</h1>
            <p className="text-gray-600">Choose a section to practice under test conditions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => startSection('EN')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>English</CardTitle>
                <CardDescription>
                  75 questions • {Math.round(applyTimeAccommodation(45 * 60, accommodationMultiplier) / 60)} minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => startSection('MATH')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Mathematics</CardTitle>
                <CardDescription>
                  60 questions • {Math.round(applyTimeAccommodation(60 * 60, accommodationMultiplier) / 60)} minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => startSection('RD')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Reading</CardTitle>
                <CardDescription>
                  40 questions • {Math.round(applyTimeAccommodation(35 * 60, accommodationMultiplier) / 60)} minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => startSection('SCI')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Science</CardTitle>
                <CardDescription>
                  40 questions • {Math.round(applyTimeAccommodation(35 * 60, accommodationMultiplier) / 60)} minutes
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isComplete) {
    const correctCount = Array.from(session.currentSession?.answers.values() || [])
      .filter(a => a.selectedIdx === a.correctIdx)
      .length
    const percentCorrect = (correctCount / questions.length) * 100
    const scaledScore = calculateScaledScore(percentCorrect, section)

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Section Complete!</CardTitle>
              <CardDescription>Great job completing the {section} section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600">{correctCount}/{questions.length}</div>
                  <div className="text-sm text-gray-600">Questions Correct</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600">{scaledScore}</div>
                  <div className="text-sm text-gray-600">Estimated Score</div>
                </div>
              </div>
              
              <Progress value={percentCorrect} label="Accuracy" showValue />
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate({ to: '/review' })}
                >
                  Review Answers
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate({ to: '/dashboard' })}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = session.currentSession?.answers.get(currentQuestion?.id)
  const choiceOrder = currentAnswer?.choiceOrder || generateChoiceOrder()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">{section} Section</h2>
            <Progress 
              value={currentIndex + 1} 
              max={questions.length}
              className="w-32"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Timer
              duration={timeLimit}
              onTimeUp={handleTimeUp}
              isPaused={isPaused}
              onPause={() => setIsPaused(true)}
              onResume={() => setIsPaused(false)}
              className="inline-block"
            />
            
            <Button
              variant="outline"
              onClick={completeSection}
            >
              End Section
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            choiceOrder={choiceOrder}
            onAnswer={handleAnswer}
            selectedAnswer={currentAnswer?.selectedIdx}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={currentIndex < questions.length - 1}
            hasPrevious={currentIndex > 0}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
          />
        )}
      </div>
    </div>
  )
}
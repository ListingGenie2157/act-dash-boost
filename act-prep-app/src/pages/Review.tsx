import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Progress } from '../components/ui/Progress'
import { calculateNextInterval, cn } from '../lib/utils'
import { Brain, Check, X, ChevronRight, Clock, TrendingUp, RotateCcw } from 'lucide-react'
import { addDays } from 'date-fns'

interface ReviewItem {
  user_id: string
  question_id: string
  due_at: string
  interval_days: number
  ease: number
  lapses: number
  question: {
    id: string
    stem: string
    choice_a: string
    choice_b: string
    choice_c: string
    choice_d: string
    answer: string
    explanation: string
  }
  lastAttempt?: {
    choice_order: number[]
    correct_idx: number
    selected_idx: number | null
  }
}

export function Review() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    incorrect: 0,
  })

  useEffect(() => {
    if (user) {
      loadReviewItems()
    }
  }, [user])

  const loadReviewItems = async () => {
    if (!user) return

    try {
      // Get due review items
      const { data: items, error } = await supabase
        .from('review_queue')
        .select(`
          *,
          question:questions(*)
        `)
        .eq('user_id', user.id)
        .lte('due_at', new Date().toISOString())
        .order('due_at')
        .limit(20)

      if (error) throw error

      if (items && items.length > 0) {
        // Get last attempts for these questions
        const questionIds = items.map(item => item.question_id)
        const { data: attempts } = await supabase
          .from('attempts')
          .select('question_id, choice_order, correct_idx, selected_idx')
          .eq('user_id', user.id)
          .in('question_id', questionIds)
          .order('created_at', { ascending: false })

        // Map last attempts to items
        const itemsWithAttempts = items.map(item => {
          const lastAttempt = attempts?.find(a => a.question_id === item.question_id)
          return {
            ...item,
            lastAttempt,
          }
        })

        setReviewItems(itemsWithAttempts)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading review items:', error)
      setLoading(false)
    }
  }

  const handleResponse = async (gotIt: boolean) => {
    if (!user || !reviewItems[currentIndex]) return

    const item = reviewItems[currentIndex]
    
    // Calculate next interval
    const { interval, ease } = calculateNextInterval(
      item.interval_days,
      item.ease,
      gotIt
    )

    // Update review queue
    try {
      await supabase
        .from('review_queue')
        .update({
          due_at: addDays(new Date(), interval).toISOString(),
          interval_days: interval,
          ease: ease,
          lapses: gotIt ? item.lapses : item.lapses + 1,
        })
        .eq('user_id', user.id)
        .eq('question_id', item.question_id)

      // Update session stats
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (gotIt ? 1 : 0),
        incorrect: prev.incorrect + (gotIt ? 0 : 1),
      }))

      // Move to next item
      if (currentIndex < reviewItems.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      } else {
        // Session complete
        setCurrentIndex(-1)
      }
    } catch (error) {
      console.error('Error updating review item:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review items...</p>
        </div>
      </div>
    )
  }

  if (reviewItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>All caught up!</CardTitle>
            <CardDescription>
              You don't have any items due for review right now. Great job staying on top of your studies!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentIndex === -1) {
    // Session complete
    const accuracy = sessionStats.reviewed > 0 
      ? (sessionStats.correct / sessionStats.reviewed) * 100 
      : 0

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary-600" />
            </div>
            <CardTitle>Review Session Complete!</CardTitle>
            <CardDescription>
              Great job working through your review items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{sessionStats.reviewed}</div>
                <div className="text-xs text-gray-600">Reviewed</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
                <div className="text-xs text-gray-600">Correct</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
                <div className="text-xs text-gray-600">Need Work</div>
              </div>
            </div>

            <Progress 
              value={accuracy}
              label="Accuracy"
              showValue
              variant={accuracy >= 70 ? 'success' : accuracy >= 50 ? 'warning' : 'error'}
            />

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => loadReviewItems()}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                More Review
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate({ to: '/dashboard' })}
              >
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentItem = reviewItems[currentIndex]
  const question = currentItem.question
  const progress = ((currentIndex + 1) / reviewItems.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Review Session</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{currentIndex + 1} of {reviewItems.length}</span>
            </div>
          </div>
          <Progress value={progress} />
        </div>

        {/* Review Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Review Question</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Interval: {currentItem.interval_days} days</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Question */}
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap mb-4">
                {question.stem}
              </p>

              {/* Show previous attempt if available */}
              {currentItem.lastAttempt && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Your previous answer:</p>
                  {[0, 1, 2, 3].map((idx) => {
                    const originalIdx = currentItem.lastAttempt!.choice_order[idx]
                    const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d]
                    const isSelected = idx === currentItem.lastAttempt!.selected_idx
                    const isCorrect = idx === currentItem.lastAttempt!.correct_idx
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-lg border-2',
                          isSelected && !isCorrect && 'border-red-300 bg-red-50',
                          isCorrect && 'border-green-300 bg-green-50',
                          !isSelected && !isCorrect && 'border-gray-200'
                        )}
                      >
                        <div className="flex items-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-sm',
                            isCorrect && 'bg-green-500 text-white',
                            isSelected && !isCorrect && 'bg-red-500 text-white',
                            !isSelected && !isCorrect && 'bg-gray-200 text-gray-600'
                          )}>
                            {String.fromCharCode(65 + originalIdx)}
                          </span>
                          <span className="text-gray-900">{choices[originalIdx]}</span>
                          {isCorrect && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                          {isSelected && !isCorrect && <X className="w-4 h-4 text-red-600 ml-auto" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Answer toggle */}
              {!showAnswer ? (
                <Button 
                  onClick={() => setShowAnswer(true)}
                  className="w-full"
                >
                  Show Answer
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Correct answer */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Check className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-900">Correct Answer: {question.answer}</span>
                    </div>
                    <p className="text-green-800">
                      {question[`choice_${question.answer.toLowerCase()}` as keyof typeof question] as string}
                    </p>
                  </div>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
                      <p className="text-blue-800 whitespace-pre-wrap">{question.explanation}</p>
                    </div>
                  )}

                  {/* Response buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => handleResponse(false)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Still Learning
                    </Button>
                    <Button 
                      onClick={() => handleResponse(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Got It!
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Correct: {sessionStats.correct}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Incorrect: {sessionStats.incorrect}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
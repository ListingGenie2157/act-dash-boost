import React, { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Check, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface Question {
  id: string
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

interface QuestionDisplayProps {
  question: Question
  choiceOrder: number[]
  onAnswer: (selectedIdx: number) => void
  selectedAnswer?: number | null
  showExplanation?: boolean
  isReviewMode?: boolean
  timeSpent?: number
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
  currentIndex?: number
  totalQuestions?: number
}

export function QuestionDisplay({
  question,
  choiceOrder,
  onAnswer,
  selectedAnswer,
  showExplanation = false,
  isReviewMode = false,
  timeSpent,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  currentIndex,
  totalQuestions,
}: QuestionDisplayProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(selectedAnswer ?? null)

  useEffect(() => {
    setLocalSelected(selectedAnswer ?? null)
  }, [selectedAnswer, question.id])

  const choices = [
    question.choice_a,
    question.choice_b,
    question.choice_c,
    question.choice_d,
  ]

  const handleSelect = (idx: number) => {
    if (showExplanation || isReviewMode) return
    setLocalSelected(idx)
    onAnswer(idx)
  }

  const getChoiceLabel = (originalIdx: number): string => {
    return String.fromCharCode(65 + originalIdx) // A, B, C, D
  }

  const isCorrect = (idx: number): boolean => {
    const originalIdx = choiceOrder[idx]
    const correctIdx = question.answer.charCodeAt(0) - 65
    return originalIdx === correctIdx
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Progress indicator */}
      {currentIndex !== undefined && totalQuestions && (
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          {timeSpent && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{Math.round(timeSpent / 1000)}s</span>
            </div>
          )}
        </div>
      )}

      {/* Passage if exists */}
      {question.passage_text && (
        <Card className="mb-6">
          <CardContent className="prose prose-sm max-w-none">
            {question.passage_title && (
              <h3 className="text-lg font-semibold mb-3">{question.passage_title}</h3>
            )}
            <div className="whitespace-pre-wrap text-gray-700">
              {question.passage_text}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question stem */}
      <Card>
        <CardContent>
          <div className="mb-6">
            <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">
              {question.stem}
            </p>
          </div>

          {/* Answer choices */}
          <div className="space-y-3">
            {choiceOrder.map((originalIdx, displayIdx) => {
              const isSelected = localSelected === displayIdx
              const showCorrectness = showExplanation || isReviewMode
              const isThisCorrect = isCorrect(displayIdx)
              
              return (
                <button
                  key={displayIdx}
                  onClick={() => handleSelect(displayIdx)}
                  disabled={showExplanation || isReviewMode}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all',
                    'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    !showCorrectness && isSelected && 'border-primary-500 bg-primary-50',
                    !showCorrectness && !isSelected && 'border-gray-200',
                    showCorrectness && isThisCorrect && 'border-green-500 bg-green-50',
                    showCorrectness && !isThisCorrect && isSelected && 'border-red-500 bg-red-50',
                    showCorrectness && !isThisCorrect && !isSelected && 'border-gray-200 opacity-60',
                    (showExplanation || isReviewMode) && 'cursor-default'
                  )}
                >
                  <div className="flex items-start">
                    <span className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 flex-shrink-0',
                      !showCorrectness && isSelected && 'bg-primary-500 text-white',
                      !showCorrectness && !isSelected && 'bg-gray-200 text-gray-700',
                      showCorrectness && isThisCorrect && 'bg-green-500 text-white',
                      showCorrectness && !isThisCorrect && isSelected && 'bg-red-500 text-white',
                      showCorrectness && !isThisCorrect && !isSelected && 'bg-gray-200 text-gray-500'
                    )}>
                      {showCorrectness && isThisCorrect ? (
                        <Check className="w-4 h-4" />
                      ) : showCorrectness && !isThisCorrect && isSelected ? (
                        <X className="w-4 h-4" />
                      ) : (
                        getChoiceLabel(originalIdx)
                      )}
                    </span>
                    <span className="text-gray-900">{choices[originalIdx]}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && question.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
              <p className="text-blue-800 whitespace-pre-wrap">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      {(onPrevious || onNext) && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <Button
            onClick={onNext}
            disabled={!hasNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
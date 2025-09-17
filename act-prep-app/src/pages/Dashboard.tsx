import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../stores/useAppStore'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Progress } from '../components/ui/Progress'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Calendar,
  Brain,
  Award,
  ChevronRight,
  BarChart3,
  Zap
} from 'lucide-react'
import { formatDate, calculateScaledScore } from '../lib/utils'

interface DashboardData {
  recentSessions: any[]
  upcomingReviews: number
  weakSkills: any[]
  accuracy: {
    EN: number
    MATH: number
    RD: number
    SCI: number
  }
  studyPlan: any
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { streaks, xp, preferences } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Check if user has completed onboarding
      const { data: prefs } = await supabase
        .from('user_prefs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: goal } = await supabase
        .from('goal')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!prefs || !goal) {
        // Redirect to onboarding if not complete
        navigate({ to: '/onboarding' })
        return
      }

      // Load recent sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5)

      // Load upcoming reviews
      const { data: reviews } = await supabase
        .from('review_queue')
        .select('*')
        .eq('user_id', user.id)
        .lte('due_at', new Date().toISOString())

      // Load accuracy data
      const { data: attempts } = await supabase
        .from('attempts')
        .select('*, questions!inner(skill_id)')
        .eq('user_id', user.id)

      // Calculate accuracy by section
      const accuracy = {
        EN: 0,
        MATH: 0,
        RD: 0,
        SCI: 0,
      }

      // Load study plan
      const { data: studyPlan } = await supabase
        .from('study_plan_days')
        .select('*, study_tasks(*)')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single()

      setData({
        recentSessions: sessions || [],
        upcomingReviews: reviews?.length || 0,
        weakSkills: [],
        accuracy,
        studyPlan,
      })
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold">ACT Prep Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{xp} XP</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-orange-500" />
                <span className="font-medium">{streaks.current} day streak</span>
              </div>
              <Button variant="ghost" onClick={() => navigate({ to: '/settings' })}>
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate({ to: '/practice/drill' })}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Practice Drill</CardTitle>
              <CardDescription>Focus on your weak areas</CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate({ to: '/practice/timed' })}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Timed Section</CardTitle>
              <CardDescription>Practice under test conditions</CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => navigate({ to: '/review' })}
          >
            {data?.upcomingReviews && data.upcomingReviews > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{data.upcomingReviews}</span>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Review</CardTitle>
              <CardDescription>
                {data?.upcomingReviews 
                  ? `${data.upcomingReviews} items due`
                  : 'No items due'}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Today's Plan */}
        {data?.studyPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Study Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress 
                  value={data.studyPlan.completed_minutes} 
                  max={data.studyPlan.target_minutes}
                  label="Daily Progress"
                  showValue
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {data.studyPlan.study_tasks?.map((task: any) => (
                    <div 
                      key={task.id}
                      className={`p-3 border rounded-lg ${task.completed ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            readOnly
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {task.task_type === 'drill' && 'Practice Drill'}
                              {task.task_type === 'timed' && 'Timed Section'}
                              {task.task_type === 'review' && 'Review Session'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {task.section && `${task.section} • `}
                              {task.estimated_minutes} min
                            </div>
                          </div>
                        </div>
                        {!task.completed && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (task.task_type === 'drill') navigate({ to: '/practice/drill' })
                              if (task.task_type === 'timed') navigate({ to: '/practice/timed' })
                              if (task.task_type === 'review') navigate({ to: '/review' })
                            }}
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Section Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data?.accuracy || {}).map(([section, accuracy]) => (
                  <div key={section}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{section}</span>
                      <span className="text-gray-600">{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} variant={accuracy >= 70 ? 'success' : accuracy >= 50 ? 'warning' : 'error'} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentSessions && data.recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {data.recentSessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium">
                          {session.mode === 'diagnostic' && 'Diagnostic Test'}
                          {session.mode === 'drill' && 'Practice Drill'}
                          {session.mode === 'timed' && `Timed ${session.section}`}
                          {session.mode === 'review' && 'Review Session'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(session.started_at)}
                        </div>
                      </div>
                      {session.ended_at && (
                        <Button size="sm" variant="ghost" onClick={() => navigate({ to: `/results/${session.id}` })}>
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
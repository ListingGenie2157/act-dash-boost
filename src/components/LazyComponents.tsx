import { lazy, Suspense } from 'react';

// Lazy load heavy components for better initial bundle size
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyAdminImport = lazy(() => import('@/pages/AdminImport'));
export const LazyAdminLessonImport = lazy(() => import('@/pages/AdminLessonImport'));
export const LazyParentPortal = lazy(() => import('@/pages/ParentPortal'));
export const LazyDiagnostic = lazy(() => import('@/pages/Diagnostic'));

// Core routes - lazy loaded to reduce initial bundle
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazySimulation = lazy(() => import('@/pages/Simulation'));
export const LazySimulationResults = lazy(() => import('@/pages/SimulationResults'));
export const LazyDiagnosticTest = lazy(() => import('@/pages/DiagnosticTest'));
export const LazyDiagnosticResults = lazy(() => import('@/pages/DiagnosticResults'));
export const LazyDiagnosticResultsComplete = lazy(() => import('@/pages/DiagnosticResultsComplete'));
export const LazyDrillRunner = lazy(() => import('@/pages/DrillRunner'));
export const LazyDrillSetup = lazy(() => import('@/pages/DrillSetup'));
export const LazyDrillPlayer = lazy(() => import('@/pages/DrillPlayer'));
export const LazyDrillHistory = lazy(() => import('@/pages/DrillHistory'));
export const LazyDrillDetail = lazy(() => import('@/pages/DrillDetail'));
export const LazyQuizRunner = lazy(() => import('@/pages/QuizRunner'));
export const LazyPlan = lazy(() => import('@/pages/Plan'));
export const LazyTaskLauncher = lazy(() => import('@/pages/TaskLauncher'));
export const LazyEnhancedLessonViewer = lazy(() => import('@/pages/EnhancedLessonViewer'));
export const LazyLessonsLibrary = lazy(() => import('@/pages/LessonsLibrary'));
export const LazyWeakAreas = lazy(() => import('@/pages/WeakAreas'));
export const LazyCalculatorLab = lazy(() => import('@/pages/CalculatorLab'));
export const LazyPacingLab = lazy(() => import('@/pages/PacingLab'));
export const LazyOnboarding = lazy(() => import('@/pages/Onboarding'));
export const LazyReviewMissed = lazy(() => import('@/pages/ReviewMissed'));
export const LazyReviewSpaced = lazy(() => import('@/pages/ReviewSpaced'));
export const LazyAdminSkillCodes = lazy(() => import('@/pages/AdminSkillCodes'));
export const LazyAdminQuestionGenerator = lazy(() => import('@/pages/AdminQuestionGenerator'));
export const LazyAdminSimulationGenerator = lazy(() => import('@/pages/AdminSimulationGenerator'));

// Reusable loading component
export const LazyLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-lg">Loading...</div>
    </div>
  }>
    {children}
  </Suspense>
);

// Cheatsheet components
export const LazyEnglishCheatsheet = lazy(() => import('@/pages/Cheatsheets/English'));
export const LazyMathCheatsheet = lazy(() => import('@/pages/Cheatsheets/Math'));
export const LazyReadingCheatsheet = lazy(() => import('@/pages/Cheatsheets/Reading'));
export const LazyScienceCheatsheet = lazy(() => import('@/pages/Cheatsheets/Science'));

import { lazy, Suspense } from 'react';

// Lazy load heavy components for better initial bundle size
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyAdminImport = lazy(() => import('@/pages/AdminImport'));
export const LazyParentPortal = lazy(() => import('@/pages/ParentPortal'));
export const LazyDiagnostic = lazy(() => import('@/pages/Diagnostic'));
export const LazySimEnglish = lazy(() => import('@/pages/SimEnglish'));
export const LazySimMath = lazy(() => import('@/pages/SimMath'));
export const LazySimReading = lazy(() => import('@/pages/SimReading'));
export const LazySimScience = lazy(() => import('@/pages/SimScience'));

// Core learning components
export const LazyPlan = lazy(() => import('@/pages/Plan'));
export const LazyDrillRunner = lazy(() => import('@/pages/DrillRunner'));
export const LazyLessonViewer = lazy(() => import('@/pages/LessonViewer'));
export const LazyTimedSection = lazy(() => import('@/pages/TimedSection'));
export const LazyFullTestRunner = lazy(() => import('@/pages/FullTestRunner'));
export const LazyReviewQueue = lazy(() => import('@/pages/ReviewQueue'));
export const LazyProgressDashboard = lazy(() => import('@/pages/ProgressDashboard'));
export const LazySettings = lazy(() => import('@/pages/Settings'));

// Curriculum components
export const LazyCurriculum = lazy(() => import('@/pages/Curriculum'));
export const LazyModuleViewer = lazy(() => import('@/pages/ModuleViewer'));

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

// Cheatsheet components can also be lazy loaded
export const LazyEnglishCheatsheet = lazy(() => import('@/pages/Cheatsheets/English'));
export const LazyMathCheatsheet = lazy(() => import('@/pages/Cheatsheets/Math'));
export const LazyReadingCheatsheet = lazy(() => import('@/pages/Cheatsheets/Reading'));
export const LazyScienceCheatsheet = lazy(() => import('@/pages/Cheatsheets/Science'));
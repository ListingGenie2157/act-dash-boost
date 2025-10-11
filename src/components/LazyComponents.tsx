import { lazy, Suspense } from 'react';

// Lazy load heavy components for better initial bundle size
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyAdminImport = lazy(() => import('@/pages/AdminImport'));
export const LazyAdminLessonImport = lazy(() => import('@/pages/AdminLessonImport'));
export const LazyParentPortal = lazy(() => import('@/pages/ParentPortal'));
export const LazyDiagnostic = lazy(() => import('@/pages/Diagnostic'));
export const LazySimEnglish = lazy(() => import('@/pages/SimEnglish'));
export const LazySimMath = lazy(() => import('@/pages/SimMath'));
export const LazySimReading = lazy(() => import('@/pages/SimReading'));
export const LazySimScience = lazy(() => import('@/pages/SimScience'));

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
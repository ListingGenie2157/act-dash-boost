import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoadingSpinner } from './components/LoadingSpinner';
import { TutorProvider } from './hooks/useTutor';
import { TutorPanel } from './components/tutor/TutorPanel';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { HealthCheck } from "./pages/HealthCheck";
import { CookieConsent } from "./components/CookieConsent";
import { 
  LazyAnalytics,
  LazyAdminImport,
  LazyAdminLessonImport,
  LazyParentPortal,
  LazyDiagnostic,
  LazyDashboard,
  LazySimulation,
  LazySimulationResults,
  LazyDiagnosticTest,
  LazyDiagnosticResults,
  LazyDiagnosticResultsComplete,
  LazyDrillRunner,
  LazyDrillSetup,
  LazyDrillPlayer,
  LazyDrillHistory,
  LazyDrillDetail,
  LazyQuizRunner,
  LazyPlan,
  LazyTaskLauncher,
  LazyEnhancedLessonViewer,
  LazyLessonsLibrary,
  LazyWeakAreas,
  LazyCalculatorLab,
  LazyPacingLab,
  LazyOnboarding,
  LazyReviewMissed,
  LazyReviewSpaced,
  LazyAdminSkillCodes,
  LazyAdminQuestionGenerator,
  LazyAdminSimulationGenerator,
  LazyEnglishCheatsheet,
  LazyMathCheatsheet,
  LazyReadingCheatsheet,
  LazyScienceCheatsheet,
  LazyLoader
} from "./components/LazyComponents";


const PacingLabRedirect = () => <Navigate to="/pacing-lab" replace />;

// Configure QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TutorProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <TutorPanel />
          <BrowserRouter>
            <Suspense fallback={<PageLoadingSpinner />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                {/* Protected routes with sidebar layout */}
                <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route path="/dashboard" element={<LazyLoader><LazyDashboard /></LazyLoader>} />
                  <Route path="/onboarding" element={<LazyLoader><LazyOnboarding /></LazyLoader>} />
                  
                  {/* Diagnostic assessment route */}
                  <Route path="/diagnostic" element={<LazyLoader><LazyDiagnostic /></LazyLoader>} />
                  
                  {/* Diagnostic test routes */}
                  <Route path="/diagnostic-test/:formId" element={<LazyLoader><LazyDiagnosticTest /></LazyLoader>} />
                  <Route path="/diagnostic-results/:formId" element={<LazyLoader><LazyDiagnosticResults /></LazyLoader>} />
                  <Route path="/diagnostic-results-complete" element={<LazyLoader><LazyDiagnosticResultsComplete /></LazyLoader>} />
                  
                  {/* Simulation system */}
                  <Route path="/simulation" element={<LazyLoader><LazySimulation /></LazyLoader>} />
                  <Route path="/simulation-results" element={<LazyLoader><LazySimulationResults /></LazyLoader>} />
                  
                  {/* Cheatsheet routes */}
                  <Route path="/cheatsheets/english" element={<LazyLoader><LazyEnglishCheatsheet /></LazyLoader>} />
                  <Route path="/cheatsheets/math" element={<LazyLoader><LazyMathCheatsheet /></LazyLoader>} />
                  <Route path="/cheatsheets/reading" element={<LazyLoader><LazyReadingCheatsheet /></LazyLoader>} />
                  <Route path="/cheatsheets/science" element={<LazyLoader><LazyScienceCheatsheet /></LazyLoader>} />
                  
                  {/* Analytics route */}
                  <Route path="/analytics" element={<LazyLoader><LazyAnalytics /></LazyLoader>} />
                  
                  {/* Admin routes */}
                  <Route path="/admin-import" element={<ProtectedAdminRoute><LazyLoader><LazyAdminImport /></LazyLoader></ProtectedAdminRoute>} />
                  <Route path="/admin-lesson-import" element={<ProtectedAdminRoute><LazyLoader><LazyAdminLessonImport /></LazyLoader></ProtectedAdminRoute>} />
                  <Route path="/admin/skill-codes" element={<ProtectedAdminRoute><LazyLoader><LazyAdminSkillCodes /></LazyLoader></ProtectedAdminRoute>} />
                  <Route path="/admin/generate-questions" element={<ProtectedAdminRoute><LazyLoader><LazyAdminQuestionGenerator /></LazyLoader></ProtectedAdminRoute>} />
                  <Route path="/admin/generate-simulation" element={<ProtectedAdminRoute><LazyLoader><LazyAdminSimulationGenerator /></LazyLoader></ProtectedAdminRoute>} />
                  
                  {/* Parent portal route */}
                  <Route path="/parent-portal" element={<LazyLoader><LazyParentPortal /></LazyLoader>} />
                  
                  {/* Study plan and tasks */}
                  <Route path="/plan" element={<LazyLoader><LazyPlan /></LazyLoader>} />
                  <Route path="/task/:date/:idx" element={<LazyLoader><LazyTaskLauncher /></LazyLoader>} />
                  
                  {/* Lessons */}
                  <Route path="/lesson/:topic" element={<LazyLoader><LazyEnhancedLessonViewer /></LazyLoader>} />
                  <Route path="/lessons" element={<LazyLoader><LazyLessonsLibrary /></LazyLoader>} />
                  
                  {/* Drills - redirect legacy routes to Pacing Lab */}
                  <Route path="/drills" element={<PacingLabRedirect />} />
                  <Route path="/drill-runner" element={<PacingLabRedirect />} />
                  <Route path="/drill/:subject/setup" element={<LazyLoader><LazyDrillSetup /></LazyLoader>} />
                  <Route path="/drill/:subject/play" element={<LazyLoader><LazyDrillPlayer /></LazyLoader>} />
                  <Route path="/drill-history" element={<LazyLoader><LazyDrillHistory /></LazyLoader>} />
                  <Route path="/drill-detail/:taskId" element={<LazyLoader><LazyDrillDetail /></LazyLoader>} />
                  <Route path="/drill/:subject" element={<LazyLoader><LazyDrillRunner /></LazyLoader>} />
                  
                  {/* Quiz and practice */}
                  <Route path="/quiz/:section" element={<LazyLoader><LazyQuizRunner /></LazyLoader>} />
                  <Route path="/weak-areas" element={<LazyLoader><LazyWeakAreas /></LazyLoader>} />
                  <Route path="/calculator-lab" element={<LazyLoader><LazyCalculatorLab /></LazyLoader>} />
                  <Route path="/pacing-lab" element={<LazyLoader><LazyPacingLab /></LazyLoader>} />
                  
                  {/* Review */}
                  <Route path="/review/missed" element={<LazyLoader><LazyReviewMissed /></LazyLoader>} />
                  <Route path="/review/spaced" element={<LazyLoader><LazyReviewSpaced /></LazyLoader>} />
                </Route>
                
                {/* Health check route */}
                <Route path="/health" element={<HealthCheck />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </TutorProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { Suspense } from 'react';
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
import Index from "./pages/Index";
import Login from "./pages/Login";
import SimpleLogin from "./pages/SimpleLogin";
import Onboarding from "./pages/Onboarding";
import Simulation from "./pages/Simulation";
import SimulationResults from "./pages/SimulationResults";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import { 
  LazyAnalytics,
  LazyAdminImport,
  LazyAdminLessonImport,
  LazyParentPortal,
  LazyDiagnostic,
  LazyEnglishCheatsheet,
  LazyMathCheatsheet,
  LazyReadingCheatsheet,
  LazyScienceCheatsheet,
  LazyLoader
} from "./components/LazyComponents";
import ReviewMissed from "./pages/ReviewMissed";
import ReviewSpaced from "./pages/ReviewSpaced";
import DrillSetup from "./pages/DrillSetup";
import DrillPlayer from "./pages/DrillPlayer";
import DrillHistory from "./pages/DrillHistory";
import DiagnosticTest from "./pages/DiagnosticTest";
import DiagnosticResults from "./pages/DiagnosticResults";
import DiagnosticResultsComplete from "./pages/DiagnosticResultsComplete";
import Plan from "./pages/Plan";
import TaskLauncher from "./pages/TaskLauncher";
import EnhancedLessonViewer from "./pages/EnhancedLessonViewer";
import LessonsLibrary from "./pages/LessonsLibrary";
import DrillRunner from "./pages/DrillRunner";
import TimedDrills from "./pages/TimedDrills";
import QuizRunner from "./pages/QuizRunner";
import WeakAreas from "./pages/WeakAreas";
import CalculatorLab from "./pages/CalculatorLab";
import AdminSkillCodes from "./pages/AdminSkillCodes";
import { HealthCheck } from "./pages/HealthCheck";


// Configure QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Retry failed queries 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      refetchOnWindowFocus: false, // Prevent excessive refetches
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
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
          <Route path="/login" element={<Login />} />
          <Route path="/simple-login" element={<SimpleLogin />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          {/* Protected routes with sidebar layout */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
          {/* Diagnostic assessment route */}
          <Route path="/diagnostic" element={
            <LazyLoader>
              <LazyDiagnostic />
            </LazyLoader>
          } />
          {/* Diagnostic test routes */}
          <Route path="/diagnostic-test/:formId" element={<DiagnosticTest />} />
          <Route path="/diagnostic-results/:formId" element={<DiagnosticResults />} />
          <Route path="/diagnostic-results-complete" element={<DiagnosticResultsComplete />} />
          {/* New simulation system */}
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/simulation-results" element={<SimulationResults />} />
          {/* Cheatsheet routes */}
          <Route path="/cheatsheets/english" element={
            <LazyLoader>
              <LazyEnglishCheatsheet />
            </LazyLoader>
          } />
          <Route path="/cheatsheets/math" element={
            <LazyLoader>
              <LazyMathCheatsheet />
            </LazyLoader>
          } />
          <Route path="/cheatsheets/reading" element={
            <LazyLoader>
              <LazyReadingCheatsheet />
            </LazyLoader>
          } />
          <Route path="/cheatsheets/science" element={
            <LazyLoader>
              <LazyScienceCheatsheet />
            </LazyLoader>
          } />
          {/* Analytics route */}
          <Route path="/analytics" element={
            <LazyLoader>
              <LazyAnalytics />
            </LazyLoader>
          } />
          {/* Admin routes */}
          <Route path="/admin-import" element={
            <ProtectedAdminRoute>
              <LazyLoader>
                <LazyAdminImport />
              </LazyLoader>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin-lesson-import" element={
            <ProtectedAdminRoute>
              <LazyLoader>
                <LazyAdminLessonImport />
              </LazyLoader>
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/skill-codes" element={
            <ProtectedAdminRoute>
              <AdminSkillCodes />
            </ProtectedAdminRoute>
          } />
          {/* Parent portal route */}
          <Route path="/parent-portal" element={
            <LazyLoader>
              <LazyParentPortal />
            </LazyLoader>
          } />
        <Route path="/plan" element={<Plan />} />
  <Route path="/task/:date/:idx" element={<TaskLauncher />} />
  <Route path="/lesson/:topic" element={<EnhancedLessonViewer />} />
  <Route path="/lessons" element={<LessonsLibrary />} />
  <Route path="/drills" element={<TimedDrills />} />
  <Route path="/drill-runner" element={<TimedDrills />} />
  <Route path="/drill/:subject/setup" element={<DrillSetup />} />
  <Route path="/drill/:subject/play" element={<DrillPlayer />} />
  <Route path="/drill-history" element={<DrillHistory />} />
  <Route path="/drill/:subject" element={<DrillRunner />} />
            <Route path="/quiz/:section" element={<QuizRunner />} />
            <Route path="/weak-areas" element={<WeakAreas />} />
            <Route path="/calculator-lab" element={<CalculatorLab />} />
            <Route path="/review/missed" element={
              <LazyLoader>
                <ReviewMissed />
              </LazyLoader>
            } />
            <Route path="/review/spaced" element={
              <LazyLoader>
                <ReviewSpaced />
              </LazyLoader>
            } />
          </Route>
          
          {/* Health check route */}
          <Route path="/health" element={<HealthCheck />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </TutorProvider>
  </QueryClientProvider>
</ErrorBoundary>
);

export default App;

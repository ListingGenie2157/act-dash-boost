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
import Index from "./pages/Index";
import Login from "./pages/Login";
import SimpleLogin from "./pages/SimpleLogin";
import Onboarding from "./pages/Onboarding";
import Simulation from "./pages/Simulation";
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
import AdminQuestionEditor from "./pages/AdminQuestionEditor";


const queryClient = new QueryClient();

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
          
          {/* Protected routes with sidebar layout */}
          <Route element={<AppLayout />}>
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
            <LazyLoader>
              <LazyAdminImport />
            </LazyLoader>
          } />
          <Route path="/admin-lesson-import" element={
            <LazyLoader>
              <LazyAdminLessonImport />
            </LazyLoader>
          } />
          <Route path="/admin/skill-codes" element={<AdminSkillCodes />} />
          <Route path="/admin/question-editor" element={<AdminQuestionEditor />} />
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

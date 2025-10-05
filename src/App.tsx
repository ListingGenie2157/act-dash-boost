import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoadingSpinner } from './components/LoadingSpinner';
import OnboardingGate from "./routes/OnboardingGate";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Simulation from "./pages/Simulation";
import NotFound from "./pages/NotFound";
import { 
  LazyAnalytics, 
  LazyAdminImport, 
  LazyParentPortal,
  LazyDiagnostic,
  LazySimEnglish,
  LazySimMath,
  LazySimReading,
  LazySimScience,
  LazyEnglishCheatsheet,
  LazyMathCheatsheet,
  LazyReadingCheatsheet,
  LazyScienceCheatsheet,
  LazyLoader
} from "./components/LazyComponents";
import DiagnosticTest from "./pages/DiagnosticTest";
import DiagnosticResults from "./pages/DiagnosticResults";
import Plan from "./pages/Plan";
import TaskLauncher from "./pages/TaskLauncher";
import LessonViewer from "./pages/LessonViewer";
import DrillRunner from "./pages/DrillRunner";
import QuizRunner from "./pages/QuizRunner";


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoadingSpinner />}>
            <Routes>
          <Route path="/" element={<OnboardingGate />} />
          {/* Login route to handle user authentication. */}
          <Route path="/login" element={<Login />} />
          {/* Onboarding wizard route */}
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
          {/* New simulation system */}
          <Route path="/simulation" element={<Simulation />} />
          {/* Legacy simulation routes */}
          <Route path="/sim-english" element={
            <LazyLoader>
              <LazySimEnglish />
            </LazyLoader>
          } />
          <Route path="/sim-math" element={
            <LazyLoader>
              <LazySimMath />
            </LazyLoader>
          } />
          <Route path="/sim-reading" element={
            <LazyLoader>
              <LazySimReading />
            </LazyLoader>
          } />
          <Route path="/sim-science" element={
            <LazyLoader>
              <LazySimScience />
            </LazyLoader>
          } />
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
          {/* Admin route */}
          <Route path="/admin-import" element={
            <LazyLoader>
              <LazyAdminImport />
            </LazyLoader>
          } />
          {/* Parent portal route */}
          <Route path="/parent-portal" element={
            <LazyLoader>
              <LazyParentPortal />
            </LazyLoader>
          } />
        <Route path="/plan" element={<Plan />} />
  <Route path="/task/:date/:idx" element={<TaskLauncher />} />
  <Route path="/lesson/:topic" element={<LessonViewer />} />
  <Route path="/drill/:subject" element={<DrillRunner />} />
  <Route path="/quiz/:section" element={<QuizRunner />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

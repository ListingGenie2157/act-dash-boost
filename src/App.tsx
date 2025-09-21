import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Simulation from "@/pages/Simulation";
import NotFound from "@/pages/NotFound";
import DiagnosticTest from "@/pages/DiagnosticTest";
import DiagnosticResults from "@/pages/DiagnosticResults";

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
  LazyLoader,
} from "@/components/LazyComponents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Authentication & Onboarding */}
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Diagnostic */}
              <Route
                path="/diagnostic"
                element={
                  <LazyLoader>
                    <LazyDiagnostic />
                  </LazyLoader>
                }
              />
              <Route path="/diagnostic-test/:formId" element={<DiagnosticTest />} />
              <Route path="/diagnostic-results/:formId" element={<DiagnosticResults />} />

              {/* Simulation */}
              <Route path="/simulation" element={<Simulation />} />
              <Route
                path="/sim-english"
                element={
                  <LazyLoader>
                    <LazySimEnglish />
                  </LazyLoader>
                }
              />
              <Route
                path="/sim-math"
                element={
                  <LazyLoader>
                    <LazySimMath />
                  </LazyLoader>
                }
              />
              <Route
                path="/sim-reading"
                element={
                  <LazyLoader>
                    <LazySimReading />
                  </LazyLoader>
                }
              />
              <Route
                path="/sim-science"
                element={
                  <LazyLoader>
                    <LazySimScience />
                  </LazyLoader>
                }
              />

              {/* Cheatsheets */}
              <Route
                path="/cheatsheets/english"
                element={
                  <LazyLoader>
                    <LazyEnglishCheatsheet />
                  </LazyLoader>
                }
              />
              <Route
                path="/cheatsheets/math"
                element={
                  <LazyLoader>
                    <LazyMathCheatsheet />
                  </LazyLoader>
                }
              />
              <Route
                path="/cheatsheets/reading"
                element={
                  <LazyLoader>
                    <LazyReadingCheatsheet />
                  </LazyLoader>
                }
              />
              <Route
                path="/cheatsheets/science"
                element={
                  <LazyLoader>
                    <LazyScienceCheatsheet />
                  </LazyLoader>
                }
              />

              {/* Admin & Analytics */}
              <Route
                path="/analytics"
                element={
                  <LazyLoader>
                    <LazyAnalytics />
                  </LazyLoader>
                }
              />
              <Route
                path="/admin-import"
                element={
                  <LazyLoader>
                    <LazyAdminImport />
                  </LazyLoader>
                }
              />
              <Route
                path="/parent-portal"
                element={
                  <LazyLoader>
                    <LazyParentPortal />
                  </LazyLoader>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Diagnostic from "./pages/Diagnostic";
import SimEnglish from "./pages/SimEnglish";
import EnglishCheatsheet from "./pages/Cheatsheets/English";
import MathCheatsheet from "./pages/Cheatsheets/Math";
import ReadingCheatsheet from "./pages/Cheatsheets/Reading";
import ScienceCheatsheet from "./pages/Cheatsheets/Science";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Login route to handle user authentication. */}
          <Route path="/login" element={<Login />} />
          {/* Diagnostic assessment route */}
          <Route path="/diagnostic" element={<Diagnostic />} />
          {/* Simulation routes */}
          <Route path="/sim-english" element={<SimEnglish />} />
          {/* Cheatsheet routes */}
          <Route path="/cheatsheets/english" element={<EnglishCheatsheet />} />
          <Route path="/cheatsheets/math" element={<MathCheatsheet />} />
          <Route path="/cheatsheets/reading" element={<ReadingCheatsheet />} />
          <Route path="/cheatsheets/science" element={<ScienceCheatsheet />} />
          {/* Analytics route */}
          <Route path="/analytics" element={<Analytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChallengeProvider } from "@/contexts/ChallengeContext";

import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import InvitePage from "./pages/InvitePage";
import WaitingPage from "./pages/WaitingPage";
import DuelPage from "./pages/DuelPage";
import ResultsPage from "./pages/ResultsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ChallengeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join/:challengeId" element={<JoinPage />} />
            <Route path="/invite/:challengeId" element={<InvitePage />} />
            <Route path="/waiting/:challengeId" element={<WaitingPage />} />
            <Route path="/duel/:challengeId" element={<DuelPage />} />
            <Route path="/results/:challengeId" element={<ResultsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ChallengeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

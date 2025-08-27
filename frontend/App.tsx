import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AppInner } from "./components/AppInner";
import { Toaster } from "@/components/ui/toaster";
import { QuickAddDialog } from "./components/QuickAddDialog";
import { BottomNavigation } from "./components/BottomNavigation";
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const queryClient = new QueryClient();

function AppContent() {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-50 pb-20">
          <AppInner />
        </div>
        <Toaster />
        <QuickAddDialog />
        <BottomNavigation />
      </SignedIn>
      <SignedOut>
        {/* Redirecting to sign-in page for signed-out users */}
        <SignIn routing="path" path="/sign-in" />
      </SignedOut>
    </>
  );
}

function ClerkApp() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
    >
      <Routes>
        <Route path="/sign-in/*" element={<div className="flex justify-center items-center h-screen"><SignIn routing="path" path="/sign-in" /></div>} />
        <Route path="/sign-up/*" element={<div className="flex justify-center items-center h-screen"><SignUp routing="path" path="/sign-up" /></div>} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkApp />
    </QueryClientProvider>
  );
}

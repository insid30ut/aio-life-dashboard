import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { clerkPublishableKey } from "./config";
import { AppInner } from "./components/AppInner";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <SignedOut>
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-6">
                  <h1 className="text-4xl font-bold text-gray-900">AIO Life Dashboard</h1>
                  <p className="text-lg text-gray-600">Your all-in-one life management solution</p>
                  <SignInButton mode="modal">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              </div>
            </SignedOut>
            <SignedIn>
              <AppInner />
            </SignedIn>
          </div>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppInner } from "./components/AppInner";
import { Toaster } from "@/components/ui/toaster";
import { clerkPublishableKey } from "./config";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <AppInner />
          </div>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

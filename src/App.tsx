import { AuthForm } from "@/components/auth-form";
import { Dashboard } from "@/components/dashboard";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900/20 via-background to-teal-900/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <span className="text-3xl">💰</span>
          </div>
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Home />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { getUserProfile } from "./lib/storage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

type AppRoute = "login" | "dashboard";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [route, setRoute] = useState<AppRoute>("login");

  // On mount and when identity changes, determine route
  useEffect(() => {
    if (isInitializing) return;

    if (identity && !identity.getPrincipal().isAnonymous()) {
      const profile = getUserProfile();
      if (profile) {
        setRoute("dashboard");
      } else {
        setRoute("login");
      }
    } else {
      setRoute("login");
    }
  }, [identity, isInitializing]);

  // Show loading spinner while auth is initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 rounded border border-primary/40 flex items-center justify-center bg-primary/5 animate-pulse">
          <Fingerprint className="w-5 h-5 text-primary" />
        </div>
        <p className="font-mono text-xs text-muted-foreground/50 tracking-widest animate-pulse">
          INITIALIZING...
        </p>
      </div>
    );
  }

  return (
    <>
      {route === "login" ? (
        <LoginPage onLoginSuccess={() => setRoute("dashboard")} />
      ) : (
        <DashboardPage onLogout={() => setRoute("login")} />
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-card border border-border/60 text-foreground font-body text-sm",
            description: "text-muted-foreground text-xs",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
            success: "border-primary/20",
            error: "border-destructive/30",
          },
        }}
      />
    </>
  );
}

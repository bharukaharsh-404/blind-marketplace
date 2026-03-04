import { Toaster } from "@/components/ui/sonner";
import { Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { getUserProfile, getUserRole } from "./lib/storage";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";

type AppRoute =
  | "login"
  | "role_selection"
  | "dashboard"
  | "order_detail"
  | "admin";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [route, setRoute] = useState<AppRoute>("login");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  // On mount and when identity changes, determine route
  useEffect(() => {
    if (isInitializing) return;

    if (identity && !identity.getPrincipal().isAnonymous()) {
      const profile = getUserProfile();
      if (profile) {
        const role = getUserRole();
        if (!role) {
          setRoute("role_selection");
        } else {
          setRoute("dashboard");
        }
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

  const profile = getUserProfile();
  const pseudonym = profile?.pseudonym ?? "Anonymous";

  const handleLoginSuccess = () => {
    const role = getUserRole();
    if (!role) {
      setRoute("role_selection");
    } else {
      setRoute("dashboard");
    }
  };

  const handleRoleSelected = (_role: "lister" | "writer") => {
    setRoute("dashboard");
  };

  const handleNavigateToOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRoute("order_detail");
  };

  const handleBackFromOrder = () => {
    setSelectedOrderId("");
    setRoute("dashboard");
  };

  const handleLogout = () => {
    setSelectedOrderId("");
    setRoute("login");
  };

  return (
    <>
      {route === "login" && <LoginPage onLoginSuccess={handleLoginSuccess} />}
      {route === "role_selection" && (
        <RoleSelectionPage
          pseudonym={pseudonym}
          onRoleSelected={handleRoleSelected}
        />
      )}
      {route === "dashboard" && (
        <DashboardPage
          onLogout={handleLogout}
          onNavigateToOrder={handleNavigateToOrder}
          onNavigateToAdmin={() => setRoute("admin")}
        />
      )}
      {route === "order_detail" && selectedOrderId && (
        <OrderDetailPage
          orderId={selectedOrderId}
          onBack={handleBackFromOrder}
          onLogout={handleLogout}
        />
      )}
      {route === "admin" && <AdminPage onBack={() => setRoute("dashboard")} />}

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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Fingerprint,
  Globe,
  LogOut,
  PackageOpen,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import CreateOrderModal from "../components/CreateOrderModal";
import OrderCard from "../components/OrderCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  acceptOrder,
  clearUserProfile,
  getOrders,
  getUserProfile,
  getUserRole,
  seedSampleOrders,
} from "../lib/storage";
import type { Order, UserProfile } from "../types/marketplace";

interface DashboardPageProps {
  onLogout: () => void;
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToAdmin: () => void;
}

const ORDER_MARKER_IDS = [
  "orders.item.1",
  "orders.item.2",
  "orders.item.3",
  "orders.item.4",
  "orders.item.5",
  "orders.item.6",
];

export default function DashboardPage({
  onLogout,
  onNavigateToOrder,
  onNavigateToAdmin,
}: DashboardPageProps) {
  const { clear, isInitializing, identity } = useInternetIdentity();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my_orders");

  const currentPrincipalId =
    identity?.getPrincipal().toString() ?? userProfile?.principalId ?? "";
  const role = getUserRole() ?? userProfile?.role ?? "lister";

  const refreshOrders = useCallback(() => {
    setOrders(getOrders());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      seedSampleOrders();
      const profile = getUserProfile();
      setUserProfile(profile);
      refreshOrders();
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [refreshOrders]);

  const handleLogout = () => {
    clearUserProfile();
    clear();
    onLogout();
    toast.success("Logged out successfully", { duration: 2000 });
  };

  const handleOrderCreated = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!userProfile) return;
    acceptOrder(orderId, userProfile.pseudonym, currentPrincipalId);
    refreshOrders();
    toast.success("Order accepted!", {
      description: "You can now chat with the lister and begin your work.",
      duration: 3000,
    });
  };

  const pseudonym = userProfile?.pseudonym ?? "Anonymous";

  // Compute tab-filtered orders
  const myOrders = orders.filter(
    (o) => o.listerPseudonym === pseudonym || o.writerPseudonym === pseudonym,
  );

  const marketplaceOrders = orders.filter(
    (o) =>
      o.status === "open" &&
      o.listerPrincipalId !== currentPrincipalId &&
      o.listerPseudonym !== pseudonym,
  );

  const isWriter = role === "writer";

  return (
    <div
      data-ocid="dashboard.page"
      className="relative min-h-screen flex flex-col bg-background overflow-hidden"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Ambient glow */}
      <div
        className="absolute top-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.18 192 / 0.04) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-primary/40 flex items-center justify-center bg-primary/5">
              <Fingerprint className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-sm tracking-wide text-foreground/80">
              BLIND MARKETPLACE
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-6 w-24 bg-muted/40" />
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                {/* Admin link — visible for demo purposes */}
                <button
                  type="button"
                  data-ocid="header.admin.button"
                  onClick={onNavigateToAdmin}
                  className="hidden sm:flex items-center gap-1 text-xs font-mono text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                  title="Admin Panel"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Admin</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-border/50 bg-muted/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-mono text-xs text-foreground/70">
                    {pseudonym}
                  </span>
                  <Badge
                    className={`ml-1 text-[9px] font-mono px-1.5 py-0 h-4 uppercase tracking-wider ${
                      isWriter
                        ? "bg-chart-2/10 text-chart-2 border-chart-2/30"
                        : "bg-primary/10 text-primary border-primary/30"
                    }`}
                    variant="outline"
                  >
                    {role}
                  </Badge>
                </div>

                <Button
                  data-ocid="header.logout.button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isInitializing}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">Logout</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Page title row */}
        <div className="flex items-start justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              Order Board
            </h2>
            <p className="text-sm text-muted-foreground/60">
              {isLoading ? (
                <Skeleton className="h-4 w-32 bg-muted/40 inline-block" />
              ) : (
                <>
                  {orders.length} order{orders.length !== 1 ? "s" : ""} — IDs
                  only, no identities
                </>
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Button
              data-ocid="dashboard.create_order.button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New Order</span>
              <span className="sm:hidden">New Order</span>
            </Button>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/20 border border-border/40 h-9 mb-6 p-1">
            <TabsTrigger
              data-ocid="dashboard.my_orders.tab"
              value="my_orders"
              className="text-xs font-mono data-[state=active]:bg-background/80 data-[state=active]:text-foreground"
            >
              My Orders
            </TabsTrigger>
            {isWriter && (
              <TabsTrigger
                data-ocid="dashboard.marketplace.tab"
                value="marketplace"
                className="text-xs font-mono data-[state=active]:bg-background/80 data-[state=active]:text-foreground flex items-center gap-1.5"
              >
                <Globe className="w-3 h-3" />
                Marketplace
              </TabsTrigger>
            )}
          </TabsList>

          {/* My Orders tab */}
          <TabsContent value="my_orders">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-20 w-full bg-muted/20 rounded-md"
                  />
                ))}
              </div>
            ) : myOrders.length === 0 ? (
              <motion.div
                data-ocid="orders.empty_state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col items-center justify-center py-20 px-8 border border-dashed border-border/40 rounded-lg text-center"
              >
                <div className="w-12 h-12 rounded-full border border-border/50 bg-muted/20 flex items-center justify-center mb-4">
                  <PackageOpen className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <h3 className="font-display font-semibold text-sm text-foreground/60 mb-1">
                  No orders yet
                </h3>
                <p className="text-xs text-muted-foreground/40 mb-5">
                  {isWriter
                    ? "Browse the Marketplace tab to accept orders."
                    : "Be the first to post one."}
                </p>
                {!isWriter && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create New Order
                  </Button>
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div data-ocid="orders.list" className="space-y-3">
                  {myOrders.map((order, i) => (
                    <OrderCard
                      key={order.orderId}
                      order={order}
                      index={i}
                      data-ocid={ORDER_MARKER_IDS[i] ?? `orders.item.${i + 1}`}
                      onClick={() => onNavigateToOrder(order.orderId)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Marketplace tab (writers only) */}
          {isWriter && (
            <TabsContent value="marketplace">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-20 w-full bg-muted/20 rounded-md"
                    />
                  ))}
                </div>
              ) : marketplaceOrders.length === 0 ? (
                <motion.div
                  data-ocid="marketplace.empty_state"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex flex-col items-center justify-center py-20 px-8 border border-dashed border-border/40 rounded-lg text-center"
                >
                  <div className="w-12 h-12 rounded-full border border-border/50 bg-muted/20 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-foreground/60 mb-1">
                    No open orders
                  </h3>
                  <p className="text-xs text-muted-foreground/40">
                    Check back soon — new assignments are posted regularly.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div data-ocid="marketplace.list" className="space-y-3">
                    {marketplaceOrders.map((order, i) => (
                      <OrderCard
                        key={order.orderId}
                        order={order}
                        index={i}
                        data-ocid={`marketplace.item.${i + 1}`}
                        onClick={() => onNavigateToOrder(order.orderId)}
                        canAccept={
                          order.status === "open" &&
                          !order.writerPseudonym &&
                          order.listerPrincipalId !== currentPrincipalId &&
                          order.listerPseudonym !== pseudonym
                        }
                        onAccept={() => handleAcceptOrder(order.orderId)}
                        acceptOcid={`order_card.accept_button.${i + 1}`}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-border/30 mt-auto">
        <p className="text-center text-xs text-muted-foreground/40 font-mono">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/50 hover:text-primary/80 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Create Order Modal */}
      <CreateOrderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        pseudonym={pseudonym}
        principalId={currentPrincipalId}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Fingerprint,
  Lock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminRefundToLister,
  adminReleaseToWriter,
  getAllMessages,
  getDisputedOrders,
  getOrders,
} from "../lib/storage";
import type { Message, Order } from "../types/marketplace";

interface AdminPageProps {
  onBack: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState("order_mapping");
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [allMessages] = useState<Message[]>(() => getAllMessages());
  const [disputedOrders, setDisputedOrders] = useState<Order[]>(() =>
    getDisputedOrders(),
  );

  const flaggedMessages = allMessages.filter((m) => m.isFlagged);

  // Compute flagged message count per order
  const flaggedCountByOrder = allMessages.reduce<Record<string, number>>(
    (acc, msg) => {
      if (msg.isFlagged) {
        acc[msg.orderId] = (acc[msg.orderId] ?? 0) + 1;
      }
      return acc;
    },
    {},
  );

  const refreshData = () => {
    setOrders(getOrders());
    setDisputedOrders(getDisputedOrders());
  };

  const handleReleaseToWriter = (orderId: string) => {
    adminReleaseToWriter(orderId);
    refreshData();
    toast.success("Funds released to writer", {
      description: `Order ${orderId} has been marked as completed.`,
      duration: 3000,
    });
  };

  const handleRefundToLister = (orderId: string) => {
    adminRefundToLister(orderId);
    refreshData();
    toast.success("Refund issued to lister", {
      description: `Order ${orderId} has been reset and funds returned.`,
      duration: 3000,
    });
  };

  const STATUS_COLORS = {
    open: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    completed: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  };

  const ESCROW_COLORS: Record<string, string> = {
    none: "bg-muted/30 text-muted-foreground border-border/40",
    held: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    released: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    refunded: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-25" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Button
            data-ocid="admin.back.button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="text-xs">Back</span>
          </Button>

          <div className="w-px h-5 bg-border/40" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-destructive/40 flex items-center justify-center bg-destructive/5">
              <ShieldAlert className="w-4 h-4 text-destructive/70" />
            </div>
            <span className="font-display font-semibold text-sm tracking-wide text-foreground/80">
              ADMIN PANEL
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded border border-destructive/20 bg-destructive/5">
            <Lock className="w-3 h-3 text-destructive/50" />
            <span className="font-mono text-xs text-destructive/60">
              RESTRICTED ACCESS
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        {/* Admin notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-md border border-border/40 bg-muted/10 mb-6">
          <Fingerprint className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground/60">
            <span className="font-semibold text-muted-foreground/80">
              Production Note:
            </span>{" "}
            In production, access is restricted to the admin Principal ID. This
            panel shows full Order ID ↔ User mappings for dispute resolution.
            All data shown is from the current demo session.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            {
              label: "Total Orders",
              value: orders.length,
              color: "text-foreground",
            },
            {
              label: "Open Orders",
              value: orders.filter((o) => o.status === "open").length,
              color: "text-primary",
            },
            {
              label: "In Progress",
              value: orders.filter((o) => o.status === "in_progress").length,
              color: "text-chart-4",
            },
            {
              label: "Flagged Msgs",
              value: flaggedMessages.length,
              color:
                flaggedMessages.length > 0
                  ? "text-destructive"
                  : "text-muted-foreground/50",
            },
            {
              label: "Disputes",
              value: disputedOrders.length,
              color:
                disputedOrders.length > 0
                  ? "text-orange-500"
                  : "text-muted-foreground/50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border/40 rounded-lg p-3"
            >
              <p className={`text-2xl font-display font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/20 border border-border/40 h-9 mb-5 p-1">
            <TabsTrigger
              data-ocid="admin.order_mapping.tab"
              value="order_mapping"
              className="text-xs font-mono data-[state=active]:bg-background/80 data-[state=active]:text-foreground"
            >
              Order Mapping
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.flagged_messages.tab"
              value="flagged_messages"
              className="text-xs font-mono data-[state=active]:bg-background/80 data-[state=active]:text-foreground flex items-center gap-1.5"
            >
              Flagged Messages
              {flaggedMessages.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-destructive/20 border border-destructive/30 text-destructive text-[9px] font-bold flex items-center justify-center">
                  {flaggedMessages.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.disputes.tab"
              value="disputes"
              className="text-xs font-mono data-[state=active]:bg-background/80 data-[state=active]:text-foreground flex items-center gap-1.5"
            >
              Disputes
              {disputedOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-500 text-[9px] font-bold flex items-center justify-center">
                  {disputedOrders.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Order Mapping tab */}
          <TabsContent value="order_mapping">
            {orders.length === 0 ? (
              <div
                data-ocid="admin.orders.empty_state"
                className="text-center py-16 text-xs font-mono text-muted-foreground/40"
              >
                No orders in the system
              </div>
            ) : (
              <div
                data-ocid="admin.orders.table"
                className="border border-border/40 rounded-lg overflow-hidden"
              >
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 bg-muted/10 hover:bg-muted/10">
                        <TableHead className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                          Order ID
                        </TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                          Lister Pseudonym
                        </TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                          Writer Pseudonym
                        </TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                          Escrow
                        </TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider text-right">
                          Flagged
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const flagCount =
                          flaggedCountByOrder[order.orderId] ?? 0;

                        return (
                          <TableRow
                            key={order.orderId}
                            className="border-border/20 hover:bg-muted/10 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="order-id-badge text-xs font-bold text-primary/80 bg-primary/8 border border-primary/15 px-2 py-0.5 rounded-sm">
                                  {order.orderId}
                                </span>
                                {order.isDisputed && (
                                  <AlertTriangle className="w-3 h-3 text-orange-500/70" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-foreground/70">
                                {order.listerPseudonym}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-foreground/70">
                                {order.writerPseudonym ?? (
                                  <span className="text-muted-foreground/30">
                                    —
                                  </span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`font-mono text-[10px] tracking-wider ${STATUS_COLORS[order.status]}`}
                                variant="outline"
                              >
                                {order.status === "in_progress"
                                  ? "In Progress"
                                  : order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`font-mono text-[10px] tracking-wider ${ESCROW_COLORS[order.escrowStatus] ?? ESCROW_COLORS.none}`}
                                variant="outline"
                              >
                                {order.escrowStatus.charAt(0).toUpperCase() +
                                  order.escrowStatus.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {flagCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-destructive/80 bg-destructive/8 border border-destructive/20 px-1.5 py-0.5 rounded-sm">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {flagCount}
                                </span>
                              ) : (
                                <span className="text-xs font-mono text-muted-foreground/30">
                                  0
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Flagged Messages tab */}
          <TabsContent value="flagged_messages">
            {flaggedMessages.length === 0 ? (
              <div
                data-ocid="admin.flagged.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-10 h-10 rounded-full border border-border/40 bg-muted/20 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-5 h-5 text-muted-foreground/30" />
                </div>
                <p className="text-xs font-mono text-muted-foreground/40">
                  No flagged messages
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">
                  The platform is clean — no bypass attempts detected
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedMessages.map((msg, i) => (
                  <div
                    key={msg.messageId}
                    data-ocid={`admin.flagged.item.${i + 1}`}
                    className="bg-card border border-destructive/20 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="order-id-badge text-[10px] font-bold text-primary/80 bg-primary/8 border border-primary/15 px-1.5 py-0.5 rounded-sm">
                          {msg.orderId}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground/60">
                          {msg.senderPseudonym}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <AlertTriangle className="w-3 h-3 text-destructive/60" />
                        <span className="text-[10px] font-mono text-destructive/70 uppercase tracking-wider">
                          Flagged
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-destructive/30 pl-3 mb-2">
                      {msg.content}
                    </p>

                    <p className="text-[10px] font-mono text-muted-foreground/40">
                      {formatDate(msg.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Disputes tab */}
          <TabsContent value="disputes">
            {disputedOrders.length === 0 ? (
              <div
                data-ocid="admin.disputes.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-10 h-10 rounded-full border border-border/40 bg-muted/20 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground/30" />
                </div>
                <p className="text-xs font-mono text-muted-foreground/40">
                  No active disputes
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">
                  All orders are running smoothly
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputedOrders.map((order, i) => (
                  <div
                    key={order.orderId}
                    className="bg-card border border-orange-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="order-id-badge text-xs font-bold text-primary/80 bg-primary/8 border border-primary/15 px-2 py-0.5 rounded-sm">
                          {order.orderId}
                        </span>
                        <Badge
                          className="font-mono text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/25"
                          variant="outline"
                        >
                          Disputed
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground/50">
                          ${order.budget.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={refreshData}
                        className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                          Lister
                        </p>
                        <p className="font-mono text-foreground/70">
                          {order.listerPseudonym}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                          Writer
                        </p>
                        <p className="font-mono text-foreground/70">
                          {order.writerPseudonym ?? (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {order.disputeReason && (
                      <div className="p-2.5 rounded-md bg-orange-500/5 border border-orange-500/15 mb-3">
                        <p className="text-[10px] font-mono text-orange-500/70 uppercase tracking-wider mb-1">
                          Dispute Reason
                        </p>
                        <p className="text-xs text-foreground/70 leading-relaxed">
                          {order.disputeReason}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        data-ocid={`admin.dispute.release_button.${i + 1}`}
                        size="sm"
                        onClick={() => handleReleaseToWriter(order.orderId)}
                        className="flex-1 h-8 text-xs bg-chart-2/90 text-background hover:bg-chart-2 transition-colors font-mono"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                        Release to Writer
                      </Button>
                      <Button
                        data-ocid={`admin.dispute.refund_button.${i + 1}`}
                        size="sm"
                        onClick={() => handleRefundToLister(order.orderId)}
                        variant="ghost"
                        className="flex-1 h-8 text-xs text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/8 border border-orange-500/25 font-mono transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Refund to Lister
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
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
    </div>
  );
}

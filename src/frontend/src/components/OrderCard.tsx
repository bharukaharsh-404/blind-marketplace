import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, DollarSign, Lock, Unlock } from "lucide-react";
import { motion } from "motion/react";
import type { Order } from "../types/marketplace";

interface OrderCardProps {
  order: Order;
  index: number;
  "data-ocid"?: string;
  onClick?: () => void;
  onAccept?: () => void;
  canAccept?: boolean;
  acceptOcid?: string;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    className:
      "bg-primary/10 text-primary border border-primary/20 font-mono text-[10px] tracking-wider",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-chart-4/10 text-chart-4 border border-chart-4/20 font-mono text-[10px] tracking-wider",
  },
  completed: {
    label: "Completed",
    className:
      "bg-chart-2/10 text-chart-2 border border-chart-2/20 font-mono text-[10px] tracking-wider",
  },
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrderCard({
  order,
  index,
  "data-ocid": dataOcid,
  onClick,
  onAccept,
  canAccept,
  acceptOcid,
}: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status];

  return (
    <motion.article
      data-ocid={dataOcid}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={`group relative bg-card border border-border/40 rounded-md p-4 hover:border-border/80 hover:bg-card/80 transition-all duration-200 overflow-hidden ${onClick ? "cursor-pointer" : "cursor-default"}`}
      onClick={onClick}
    >
      {/* Subtle hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, oklch(0.78 0.18 192 / 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Order ID + badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="order-id-badge text-xs font-bold text-primary/90 bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-sm">
              {order.orderId}
            </span>
            <Badge className={statusConfig.className} variant="outline">
              {statusConfig.label}
            </Badge>
            {/* Escrow badge */}
            {order.escrowStatus === "held" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-chart-4/80 bg-chart-4/8 border border-chart-4/20 px-1.5 py-0.5 rounded-sm">
                <Lock className="w-2.5 h-2.5" />
                Escrow Held
              </span>
            )}
            {order.escrowStatus === "released" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-chart-2/80 bg-chart-2/8 border border-chart-2/20 px-1.5 py-0.5 rounded-sm">
                <Unlock className="w-2.5 h-2.5" />
                Released
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-sm text-foreground leading-snug truncate mb-2">
            {order.title}
          </h3>

          {/* Writer assigned */}
          {order.writerPseudonym && (
            <p className="text-xs text-muted-foreground/50 font-mono mb-2">
              Assigned to: {order.writerPseudonym}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-muted-foreground/50">
            <span className="flex items-center gap-1 text-xs font-mono">
              <DollarSign className="w-3 h-3" />
              {order.budget.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono">
              <Clock className="w-3 h-3" />
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Accept button */}
        {canAccept && onAccept && (
          <Button
            data-ocid={acceptOcid}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="flex-shrink-0 h-8 px-3 text-xs bg-chart-2/90 text-background hover:bg-chart-2 transition-colors font-mono flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Accept
          </Button>
        )}
      </div>
    </motion.article>
  );
}

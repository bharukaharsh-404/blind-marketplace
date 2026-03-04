import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import type { Order } from "../types/marketplace";

interface OrderCardProps {
  order: Order;
  index: number;
  "data-ocid"?: string;
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
}: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status];

  return (
    <motion.article
      data-ocid={dataOcid}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="group relative bg-card border border-border/40 rounded-md p-4 hover:border-border/80 hover:bg-card/80 transition-all duration-200 cursor-default overflow-hidden"
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
          {/* Order ID */}
          <div className="flex items-center gap-2 mb-2">
            <span className="order-id-badge text-xs font-bold text-primary/90 bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-sm">
              {order.orderId}
            </span>
            <Badge className={statusConfig.className} variant="outline">
              {statusConfig.label}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-sm text-foreground leading-snug truncate mb-2">
            {order.title}
          </h3>

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
      </div>
    </motion.article>
  );
}

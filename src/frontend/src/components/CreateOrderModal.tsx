import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createOrder, setStripePaymentIntent } from "../lib/storage";
import type { Order } from "../types/marketplace";
import StripePaymentStep from "./StripePaymentStep";

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pseudonym: string;
  principalId: string;
  onOrderCreated: (order: Order) => void;
}

interface FormErrors {
  title?: string;
  description?: string;
  budget?: string;
}

type Step = "form" | "escrow";

export default function CreateOrderModal({
  open,
  onOpenChange,
  pseudonym,
  principalId,
  onOrderCreated,
}: CreateOrderModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    const budgetNum = Number.parseFloat(budget);
    if (!budget.trim()) {
      newErrors.budget = "Budget is required";
    } else if (Number.isNaN(budgetNum) || budgetNum <= 0) {
      newErrors.budget = "Budget must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const newOrder = createOrder(
        {
          title: title.trim(),
          description: description.trim(),
          budget: Number.parseFloat(budget),
        },
        pseudonym,
        principalId,
      );

      setCreatedOrder(newOrder);
      setStep("escrow");
    } catch {
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeConfirm = (paymentIntentId: string) => {
    if (createdOrder) {
      setStripePaymentIntent(createdOrder.orderId, paymentIntentId);
      onOrderCreated(createdOrder);
      toast.success(
        `Order ${createdOrder.orderId} created — funds locked in escrow`,
        {
          description: "Your anonymous order is now live.",
          duration: 3000,
        },
      );
    }
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setBudget("");
    setErrors({});
    setStep("form");
    setCreatedOrder(null);
    onOpenChange(false);
  };

  const budgetNum = Number.parseFloat(budget) || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="create_order.dialog"
        className="bg-card border border-border/60 shadow-2xl max-w-lg w-full p-0 overflow-hidden rounded-lg"
      >
        {/* Header accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            <div
              className={`flex items-center gap-1.5 text-xs font-mono ${step === "form" ? "text-primary" : "text-muted-foreground/50"}`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors ${step === "form" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 bg-muted/20 text-muted-foreground/40"}`}
              >
                {step === "escrow" ? (
                  <CheckCircle2 className="w-3 h-3 text-primary/60" />
                ) : (
                  "1"
                )}
              </div>
              ORDER DETAILS
            </div>
            <div className="flex-1 h-px bg-border/30" />
            <div
              className={`flex items-center gap-1.5 text-xs font-mono ${step === "escrow" ? "text-primary" : "text-muted-foreground/40"}`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors ${step === "escrow" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 bg-muted/20 text-muted-foreground/40"}`}
              >
                2
              </div>
              ESCROW PAYMENT
            </div>
          </div>

          {step === "form" ? (
            <>
              <DialogHeader className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
                    <PlusCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <DialogTitle className="font-display font-semibold text-base text-foreground">
                    New Order
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Your identity stays hidden — only the Order ID will be visible
                  publicly.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4">
                  {/* Title field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="order-title"
                      className="text-xs font-medium text-foreground/70 uppercase tracking-wider"
                    >
                      Title
                    </Label>
                    <Input
                      id="order-title"
                      data-ocid="create_order.title.input"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title)
                          setErrors((p) => ({ ...p, title: undefined }));
                      }}
                      placeholder="e.g. Research paper on AI ethics"
                      className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-primary/20 text-sm h-9"
                      disabled={isSubmitting}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive font-mono">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Description field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="order-description"
                      className="text-xs font-medium text-foreground/70 uppercase tracking-wider"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="order-description"
                      data-ocid="create_order.description.textarea"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description)
                          setErrors((p) => ({ ...p, description: undefined }));
                      }}
                      placeholder="Describe the requirements, scope, and expected deliverables..."
                      rows={4}
                      className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-primary/20 text-sm resize-none"
                      disabled={isSubmitting}
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive font-mono">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Budget field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="order-budget"
                      className="text-xs font-medium text-foreground/70 uppercase tracking-wider"
                    >
                      Budget (USD)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm font-mono">
                        $
                      </span>
                      <Input
                        id="order-budget"
                        data-ocid="create_order.budget.input"
                        type="number"
                        min="1"
                        step="0.01"
                        value={budget}
                        onChange={(e) => {
                          setBudget(e.target.value);
                          if (errors.budget)
                            setErrors((p) => ({ ...p, budget: undefined }));
                        }}
                        placeholder="0.00"
                        className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-primary/20 text-sm h-9 pl-7 font-mono"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.budget && (
                      <p className="text-xs text-destructive font-mono">
                        {errors.budget}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="mt-6 flex gap-2">
                  <Button
                    type="button"
                    data-ocid="create_order.cancel_button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    data-ocid="create_order.submit_button"
                    disabled={isSubmitting}
                    className="flex-1 h-9 text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Continue →"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="font-display font-semibold text-base text-foreground">
                  Stripe Escrow Payment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Funds are held securely until you approve the delivered work.
                </DialogDescription>
              </DialogHeader>

              <StripePaymentStep
                orderId={createdOrder?.orderId ?? ""}
                budget={budgetNum}
                pseudonym={pseudonym}
                onConfirm={handleStripeConfirm}
                onCancel={handleClose}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

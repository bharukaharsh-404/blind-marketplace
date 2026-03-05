import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CreditCard, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { calculatePaymentSplit } from "../lib/stripe";

interface StripePaymentStepProps {
  orderId: string;
  budget: number;
  pseudonym: string;
  onConfirm: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function StripePaymentStep({
  orderId,
  budget,
  onConfirm,
  onCancel,
}: StripePaymentStepProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { platformFee, writerReceives, total } = calculatePaymentSplit(budget);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Generate mock payment intent ID
    const paymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    setIsProcessing(false);
    onConfirm(paymentIntentId);
  };

  return (
    <div className="space-y-4">
      {/* Test Mode Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-md border border-amber-500/30 bg-amber-500/8">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-500/90">
            Test Mode Active
          </p>
          <p className="text-[10px] text-amber-500/60 font-mono mt-0.5">
            Use card: <span className="font-bold">4242 4242 4242 4242</span> ·
            Any future date · Any CVV
          </p>
        </div>
      </div>

      {/* Order reference */}
      <div className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 border border-border/30">
        <span className="text-xs text-muted-foreground/60 font-mono">
          Order
        </span>
        <span className="text-xs font-mono font-bold text-primary/80">
          {orderId}
        </span>
      </div>

      {/* Payment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Card Number */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
            Card Number
          </Label>
          <div className="relative">
            <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <Input
              data-ocid="stripe_payment.card_number.input"
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              className="pl-8 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/30 font-mono text-sm h-9 focus:border-primary/50"
              disabled={isProcessing}
              autoComplete="cc-number"
            />
          </div>
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              Expiry
            </Label>
            <Input
              data-ocid="stripe_payment.expiry.input"
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/30 font-mono text-sm h-9 focus:border-primary/50"
              disabled={isProcessing}
              autoComplete="cc-exp"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              CVV
            </Label>
            <Input
              data-ocid="stripe_payment.cvv.input"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) =>
                setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              maxLength={4}
              className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/30 font-mono text-sm h-9 focus:border-primary/50"
              disabled={isProcessing}
              autoComplete="cc-csc"
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
            Cardholder Name
          </Label>
          <Input
            data-ocid="stripe_payment.name.input"
            type="text"
            placeholder="Name on card"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/30 text-sm h-9 focus:border-primary/50"
            disabled={isProcessing}
            autoComplete="cc-name"
          />
        </div>

        {/* Payment breakdown */}
        <div className="rounded-md border border-border/30 bg-muted/10 p-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground/60">Total</span>
            <span className="text-sm font-mono font-semibold text-foreground">
              ${total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground/60">
              Platform fee (15%)
            </span>
            <span className="text-xs font-mono text-chart-4">
              −${platformFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-border/20 pt-1.5 mt-1.5">
            <span className="text-xs text-muted-foreground/60 font-semibold">
              Writer receives
            </span>
            <span className="text-sm font-mono font-bold text-chart-2">
              ${writerReceives.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            data-ocid="stripe_payment.cancel_button"
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            data-ocid="stripe_payment.submit_button"
            disabled={isProcessing}
            className="flex-1 h-9 text-xs bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            {isProcessing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Pay ${total.toFixed(2)} & Lock in Escrow
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Config note */}
      <p className="text-[9px] font-mono text-muted-foreground/30 text-center leading-relaxed">
        Add your real Stripe keys in src/lib/stripe.ts to enable real payments
      </p>
    </div>
  );
}

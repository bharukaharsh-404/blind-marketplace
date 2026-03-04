import { Button } from "@/components/ui/button";
import { EyeOff, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  generatePseudonym,
  getUserProfile,
  saveUserProfile,
} from "../lib/storage";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login, identity, isLoggingIn, isLoginSuccess, isInitializing } =
    useInternetIdentity();

  useEffect(() => {
    if (isLoginSuccess && identity) {
      const principalId = identity.getPrincipal().toString();
      let profile = getUserProfile();

      if (!profile) {
        profile = {
          pseudonym: generatePseudonym(),
          principalId,
        };
        saveUserProfile(profile);
      } else if (profile.principalId !== principalId) {
        // New principal — generate new pseudonym
        profile = {
          pseudonym: generatePseudonym(),
          principalId,
        };
        saveUserProfile(profile);
      }

      onLoginSuccess();
    }
  }, [isLoginSuccess, identity, onLoginSuccess]);

  const features = [
    {
      icon: EyeOff,
      label: "Zero Identity Exposure",
      desc: "Your real identity never touches our system",
    },
    {
      icon: ShieldCheck,
      label: "Order-Scoped Access",
      desc: "Connect only through unique Order IDs",
    },
    {
      icon: Lock,
      label: "Cryptographic Auth",
      desc: "Secured by ICP Internet Identity",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Grid dot background */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Ambient glow orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.18 192 / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded border border-primary/40 flex items-center justify-center bg-primary/5">
            <Fingerprint className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-semibold text-sm tracking-wide text-foreground/80">
            BLIND MARKETPLACE
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground/60 tracking-widest uppercase">
          Phase 1 — Auth + Orders
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary/80 tracking-wider">
                ANONYMOUS · SECURE · EFFICIENT
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
              Blind
              <br />
              <span
                className="text-primary glow-cyan-text"
                style={{
                  textShadow: "0 0 30px oklch(0.78 0.18 192 / 0.4)",
                }}
              >
                Marketplace
              </span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              Post and complete assignments without revealing your identity.
              Every connection happens through a unique Order ID — nothing more.
            </p>
          </motion.div>

          {/* Connect button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="mb-8"
          >
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              size="lg"
              className="w-full h-12 bg-primary text-primary-foreground font-body font-semibold text-sm tracking-wide hover:opacity-90 transition-all duration-200 glow-cyan animate-pulse-glow border-0 rounded-md"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Loading"
                    role="img"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Connect with Internet Identity
                </span>
              )}
            </Button>

            <p className="text-xs text-muted-foreground/50 text-center mt-3 font-mono">
              A pseudonym will be auto-assigned — no personal data collected
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="space-y-3"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.35 + i * 0.08,
                  ease: "easeOut",
                }}
                className="flex items-start gap-3 p-3 rounded-md border border-border/40 bg-card/40 backdrop-blur-sm"
              >
                <div className="mt-0.5 w-7 h-7 rounded border border-border/60 bg-muted/40 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-3.5 h-3.5 text-primary/70" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/80 mb-0.5">
                    {feature.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-border/30">
        <p className="text-center text-xs text-muted-foreground/40 font-mono">
          © {new Date().getFullYear()}. Built with love using{" "}
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

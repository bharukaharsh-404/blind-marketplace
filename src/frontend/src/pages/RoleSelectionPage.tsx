import { ClipboardList, Fingerprint, PenLine } from "lucide-react";
import { motion } from "motion/react";
import { saveUserRole } from "../lib/storage";

interface RoleSelectionPageProps {
  onRoleSelected: (role: "lister" | "writer") => void;
  pseudonym: string;
}

export default function RoleSelectionPage({
  onRoleSelected,
  pseudonym,
}: RoleSelectionPageProps) {
  const handleSelect = (role: "lister" | "writer") => {
    saveUserRole(role);
    onRoleSelected(role);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Grid dot background */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Ambient glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.18 192 / 0.05) 0%, transparent 70%)",
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
          Phase 2 — Full Marketplace
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary/80 tracking-wider">
                WELCOME, {pseudonym.toUpperCase()}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
              Choose Your Role
            </h1>
            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
              Select how you'll participate in the marketplace. This is stored
              locally and can be changed anytime.
            </p>
          </motion.div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lister card */}
            <motion.button
              data-ocid="role_selection.lister_button"
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              onClick={() => handleSelect("lister")}
              className="group relative flex flex-col items-start text-left bg-card border border-border/40 rounded-lg p-7 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at top left, oklch(0.78 0.18 192 / 0.06) 0%, transparent 65%)",
                }}
              />

              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/30 transition-all duration-500 rounded-t-lg" />

              <div className="relative w-12 h-12 rounded-lg border border-primary/20 bg-primary/8 flex items-center justify-center mb-5 group-hover:border-primary/40 group-hover:bg-primary/12 transition-all duration-300">
                <ClipboardList className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors duration-300" />
              </div>

              <div className="relative flex-1">
                <h2 className="font-display font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  Lister
                </h2>
                <p className="text-sm text-muted-foreground/70 leading-relaxed mb-5">
                  Post assignments, set budgets, approve work
                </p>

                <ul className="space-y-2">
                  {[
                    "Create order listings with budgets",
                    "Lock payment in secure escrow",
                    "Review and approve deliverables",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-muted-foreground/60"
                    >
                      <div className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative mt-6 flex items-center gap-2 text-xs font-mono text-primary/60 group-hover:text-primary/90 transition-colors duration-300">
                <span>SELECT LISTER</span>
                <svg
                  className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </motion.button>

            {/* Writer card */}
            <motion.button
              data-ocid="role_selection.writer_button"
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
              onClick={() => handleSelect("writer")}
              className="group relative flex flex-col items-start text-left bg-card border border-border/40 rounded-lg p-7 hover:border-chart-2/40 hover:bg-card/80 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-2/50"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at top left, oklch(0.72 0.15 160 / 0.06) 0%, transparent 65%)",
                }}
              />

              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-chart-2/0 to-transparent group-hover:via-chart-2/30 transition-all duration-500 rounded-t-lg" />

              <div className="relative w-12 h-12 rounded-lg border border-chart-2/20 bg-chart-2/8 flex items-center justify-center mb-5 group-hover:border-chart-2/40 group-hover:bg-chart-2/12 transition-all duration-300">
                <PenLine className="w-6 h-6 text-chart-2/70 group-hover:text-chart-2 transition-colors duration-300" />
              </div>

              <div className="relative flex-1">
                <h2 className="font-display font-bold text-xl text-foreground mb-2 group-hover:text-chart-2 transition-colors duration-300">
                  Writer
                </h2>
                <p className="text-sm text-muted-foreground/70 leading-relaxed mb-5">
                  Browse orders, accept work, deliver results
                </p>

                <ul className="space-y-2">
                  {[
                    "Browse open order listings",
                    "Accept orders that match your skills",
                    "Upload work and earn on approval",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-muted-foreground/60"
                    >
                      <div className="w-1 h-1 rounded-full bg-chart-2/50 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative mt-6 flex items-center gap-2 text-xs font-mono text-chart-2/60 group-hover:text-chart-2/90 transition-colors duration-300">
                <span>SELECT WRITER</span>
                <svg
                  className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </motion.button>
          </div>

          {/* Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-center text-xs text-muted-foreground/40 font-mono mt-6"
          >
            Your real identity remains hidden — only your pseudonym is visible
          </motion.p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-border/30">
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

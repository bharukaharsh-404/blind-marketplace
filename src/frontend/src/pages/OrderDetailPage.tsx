import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  CheckCircle2,
  Clock,
  Download,
  Fingerprint,
  LogOut,
  Paperclip,
  Send,
  ShieldCheck,
  Trash2,
  Unlock,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  checkRateLimit,
  clearUserProfile,
  deleteMessage,
  getFilesAsync,
  getMessagesAsync,
  getOrders,
  getUserProfile,
  getUserRole,
  markMessageRead,
  openOrderDispute,
  releaseEscrow,
  sanitizeInput,
  saveFile,
  saveMessageAsync,
} from "../lib/storage";
import type { Message, Order, UploadedFile } from "../types/marketplace";

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
  onLogout: () => void;
}

const BLOCKED_KEYWORDS = ["whatsapp", "phone", "email", "cash", "direct"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatExpiry(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Expires in ${hours}h ${minutes}m`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OrderDetailPage({
  orderId,
  onBack,
  onLogout,
}: OrderDetailPageProps) {
  const { clear, identity } = useInternetIdentity();
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isReleasingFunds, setIsReleasingFunds] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = getUserProfile();
  const pseudonym = profile?.pseudonym ?? "Anonymous";
  const role = getUserRole() ?? "lister";
  const currentPrincipalId =
    identity?.getPrincipal().toString() ?? profile?.principalId ?? "";

  const refreshOrder = useCallback(() => {
    const orders = getOrders();
    const found = orders.find((o) => o.orderId === orderId);
    if (found) setOrder(found);
  }, [orderId]);

  const loadMessages = useCallback(async () => {
    const msgs = await getMessagesAsync(orderId);
    setMessages(msgs);
    // Mark messages from others as read
    for (const msg of msgs) {
      if (msg.senderPseudonym !== pseudonym && !msg.readAt && !msg.deletedAt) {
        markMessageRead(msg.messageId);
      }
    }
  }, [orderId, pseudonym]);

  const loadFiles = useCallback(async () => {
    const loadedFiles = await getFilesAsync(orderId);
    setFiles(loadedFiles);
  }, [orderId]);

  // Initial load
  useEffect(() => {
    refreshOrder();
    void loadMessages();
    void loadFiles();
  }, [refreshOrder, loadMessages, loadFiles]);

  // Poll messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void loadMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    clearUserProfile();
    clear();
    onLogout();
    toast.success("Logged out successfully", { duration: 2000 });
  };

  const handleSendMessage = async () => {
    const raw = messageInput.trim();
    if (!raw) return;

    // Rate limit check
    if (!checkRateLimit(`msg_${pseudonym}`, 20)) {
      toast.warning("Slow down — too many messages", {
        description: "You are sending messages too quickly.",
        duration: 3000,
      });
      return;
    }

    const content = sanitizeInput(raw);
    setIsSending(true);

    const lowerContent = content.toLowerCase();
    const isBlocked = BLOCKED_KEYWORDS.some((kw) => lowerContent.includes(kw));

    const msg: Message = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId,
      senderPseudonym: pseudonym,
      content,
      timestamp: Date.now(),
      isFlagged: isBlocked,
    };

    await saveMessageAsync(msg);
    setMessages((prev) => [...prev, msg]);
    setMessageInput("");

    if (isBlocked) {
      toast.warning("Message flagged — contact info blocked", {
        description:
          "Sharing contact info outside the platform is not allowed.",
        duration: 4000,
      });
    }

    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReleaseFunds = async () => {
    setIsReleasingFunds(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    releaseEscrow(orderId);
    refreshOrder();
    toast.success("Funds released to writer!", {
      description: "The escrow has been released. Order marked as completed.",
      duration: 3000,
    });
    setIsReleasingFunds(false);
  };

  const handleDeleteMessage = (msg: Message) => {
    deleteMessage(msg.messageId, pseudonym);
    setMessages((prev) =>
      prev.map((m) =>
        m.messageId === msg.messageId ? { ...m, deletedAt: Date.now() } : m,
      ),
    );
  };

  const handleOpenDispute = async () => {
    const reason = sanitizeInput(disputeReason.trim());
    if (!reason) {
      toast.error("Please provide a reason for the dispute.");
      return;
    }
    setIsSubmittingDispute(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    openOrderDispute(orderId, reason);
    refreshOrder();
    setShowDisputeForm(false);
    setDisputeReason("");
    setIsSubmittingDispute(false);
    toast.success("Dispute opened", {
      description: "An admin will review your case and release funds.",
      duration: 3000,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Maximum file size is 5MB.",
        duration: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      const now = Date.now();
      const uploadedFile: UploadedFile = {
        fileId: `file-${now}-${Math.random().toString(36).slice(2, 7)}`,
        orderId,
        uploaderPseudonym: pseudonym,
        fileName: file.name,
        fileSize: file.size,
        fileData,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
      };
      saveFile(uploadedFile);
      void loadFiles();
      toast.success(`${file.name} uploaded`, {
        description: "File available for 24 hours.",
        duration: 3000,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadFile = (file: UploadedFile) => {
    if (Date.now() > file.expiresAt) {
      toast.error("File has expired and is no longer available.");
      return;
    }
    const link = document.createElement("a");
    link.href = file.fileData;
    link.download = file.fileName;
    link.click();
  };

  const isLister =
    order?.listerPrincipalId === currentPrincipalId ||
    order?.listerPseudonym === pseudonym;

  const canReleaseFunds =
    isLister &&
    order?.status === "in_progress" &&
    order?.escrowStatus === "held" &&
    !order?.isDisputed;

  const canOpenDispute =
    isLister && order?.status === "in_progress" && !order?.isDisputed;

  const canUpload = role === "writer" && order?.writerPseudonym === pseudonym;

  const STATUS_CONFIG = {
    open: "bg-primary/10 text-primary border border-primary/20",
    in_progress: "bg-chart-4/10 text-chart-4 border border-chart-4/20",
    completed: "bg-chart-2/10 text-chart-2 border border-chart-2/20",
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-25" />

      {/* Header */}
      <header className="relative z-10 sticky top-0 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              data-ocid="order_detail.back.button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Back</span>
            </Button>

            <div className="w-px h-5 bg-border/40" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-primary/40 flex items-center justify-center bg-primary/5">
                <Fingerprint className="w-4 h-4 text-primary" />
              </div>
              <span className="font-mono text-sm font-bold text-foreground/80">
                {orderId}
              </span>
              {order && (
                <Badge
                  className={`font-mono text-[10px] tracking-wider ${STATUS_CONFIG[order.status]}`}
                  variant="outline"
                >
                  {order.status === "in_progress"
                    ? "In Progress"
                    : order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                </Badge>
              )}
              {order?.isDisputed && (
                <Badge
                  className="font-mono text-[10px] tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/25"
                  variant="outline"
                >
                  Disputed
                </Badge>
              )}
            </div>
          </div>

          <Button
            data-ocid="header.logout.button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        {!order ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground/50 text-sm font-mono">
              Loading order...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column: Order Info + Escrow + Files */}
            <div className="lg:col-span-1 space-y-4">
              {/* Order Info Panel */}
              <section className="bg-card border border-border/40 rounded-lg p-4">
                <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-3">
                  Order Info
                </h3>

                <h2 className="font-display font-bold text-base text-foreground leading-snug mb-2">
                  {order.title}
                </h2>
                <p className="text-xs text-muted-foreground/70 leading-relaxed mb-4">
                  {order.description}
                </p>

                <div className="space-y-2 border-t border-border/30 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/60">
                      Budget
                    </span>
                    <span className="text-sm font-mono font-bold text-foreground">
                      ${order.budget.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/60">
                      Lister
                    </span>
                    <span className="text-xs font-mono text-foreground/70">
                      {isLister ? "You" : "Anonymous"}
                    </span>
                  </div>
                  {order.writerPseudonym && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground/60">
                        Writer
                      </span>
                      <span className="text-xs font-mono text-foreground/70">
                        {order.writerPseudonym === pseudonym
                          ? "You"
                          : "Anonymous"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/60">
                      Created
                    </span>
                    <span className="text-xs font-mono text-muted-foreground/50">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {order.stripePaymentIntentId && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground/60">
                        Payment ID
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/40 truncate max-w-[120px]">
                        {order.stripePaymentIntentId}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Escrow Panel */}
              <section className="bg-card border border-border/40 rounded-lg p-4">
                <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-3">
                  Escrow
                </h3>

                {order.isDisputed ? (
                  <div className="space-y-3">
                    {/* Dispute open state */}
                    <div className="flex items-start gap-2 p-2.5 rounded-md border border-orange-500/25 bg-orange-500/5">
                      <AlertTriangle className="w-4 h-4 text-orange-500/80 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-orange-500/90">
                          Dispute Open
                        </p>
                        {order.disputeReason && (
                          <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                            {order.disputeReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/50 font-mono text-center py-2 border border-border/30 rounded-md">
                      Awaiting Admin Resolution
                    </p>
                  </div>
                ) : order.escrowStatus === "held" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2.5 rounded-md border border-primary/20 bg-primary/5">
                      <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          Payment Held in Escrow
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          ${order.budget.toFixed(2)} locked
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground/60">
                        <span>Platform fee (15%)</span>
                        <span className="font-mono text-chart-4">
                          ${(order.budget * 0.15).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground/60">
                        <span>Writer receives</span>
                        <span className="font-mono text-chart-2 font-semibold">
                          ${(order.budget * 0.85).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {order.status === "open" && isLister && (
                      <p className="text-xs text-muted-foreground/50 font-mono text-center py-2 border-t border-border/30">
                        Awaiting writer...
                      </p>
                    )}

                    {canReleaseFunds && (
                      <Button
                        data-ocid="escrow.release_funds.button"
                        onClick={handleReleaseFunds}
                        disabled={isReleasingFunds}
                        size="sm"
                        className="w-full h-8 text-xs bg-chart-2/90 text-background hover:bg-chart-2 transition-colors font-mono"
                      >
                        {isReleasingFunds ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 animate-spin" />
                            Releasing...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Approve & Release Funds
                          </span>
                        )}
                      </Button>
                    )}

                    {/* Open Dispute */}
                    {canOpenDispute && !showDisputeForm && (
                      <Button
                        data-ocid="order_detail.open_dispute.button"
                        onClick={() => setShowDisputeForm(true)}
                        size="sm"
                        variant="ghost"
                        className="w-full h-8 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/5 border border-destructive/20 font-mono transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1.5" />
                        Open Dispute
                      </Button>
                    )}

                    {/* Dispute inline form */}
                    {showDisputeForm && (
                      <div className="space-y-2 border-t border-border/30 pt-3">
                        <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                          Dispute Reason
                        </p>
                        <Textarea
                          data-ocid="order_detail.dispute.textarea"
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="Describe why you're opening a dispute..."
                          rows={3}
                          className="bg-muted/20 border-border/40 text-foreground placeholder:text-muted-foreground/30 text-xs resize-none focus:border-destructive/40"
                          disabled={isSubmittingDispute}
                        />
                        <div className="flex gap-2">
                          <Button
                            data-ocid="order_detail.cancel_dispute.button"
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowDisputeForm(false);
                              setDisputeReason("");
                            }}
                            disabled={isSubmittingDispute}
                            className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground border border-border/40"
                          >
                            Cancel
                          </Button>
                          <Button
                            data-ocid="order_detail.submit_dispute.button"
                            type="button"
                            size="sm"
                            onClick={handleOpenDispute}
                            disabled={
                              isSubmittingDispute || !disputeReason.trim()
                            }
                            className="flex-1 h-7 text-xs bg-destructive/80 text-white hover:bg-destructive transition-colors font-mono"
                          >
                            {isSubmittingDispute ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" />
                                Submitting...
                              </span>
                            ) : (
                              "Submit Dispute"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : order.escrowStatus === "released" ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-md border border-chart-2/20 bg-chart-2/5">
                    <Unlock className="w-4 h-4 text-chart-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-chart-2">
                        Funds Released
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Order completed
                      </p>
                    </div>
                  </div>
                ) : order.escrowStatus === "refunded" ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-md border border-orange-500/20 bg-orange-500/5">
                    <Unlock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-orange-500">
                        Refunded
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Funds returned to lister
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>

              {/* File Panel */}
              <section className="bg-card border border-border/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                    Files
                  </h3>
                  {canUpload && (
                    <>
                      <Button
                        data-ocid="files.upload_button"
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        Upload
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="*/*"
                      />
                    </>
                  )}
                </div>

                {files.length === 0 ? (
                  <div
                    data-ocid="files.empty_state"
                    className="text-center py-5 text-xs text-muted-foreground/40 font-mono"
                  >
                    No files uploaded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, i) => {
                      const isExpired = Date.now() > file.expiresAt;
                      const canDownload = isLister && !isExpired;

                      return (
                        <div
                          key={file.fileId}
                          data-ocid={`files.item.${i + 1}`}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/30"
                        >
                          <Paperclip className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-foreground/80 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground/50">
                              {formatFileSize(file.fileSize)} ·{" "}
                              <span
                                className={
                                  isExpired
                                    ? "text-destructive/60"
                                    : "text-chart-4/70"
                                }
                              >
                                {formatExpiry(file.expiresAt)}
                              </span>
                            </p>
                          </div>
                          {canDownload && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadFile(file)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right column: Chat */}
            <section
              className="lg:col-span-2 bg-card border border-border/40 rounded-lg flex flex-col overflow-hidden"
              style={{ minHeight: "520px" }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/10">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-sm font-semibold text-foreground/80">
                  Order #{orderId}
                </span>
                <span className="text-xs text-muted-foreground/40 ml-auto font-mono">
                  Anonymous Chat · 3s refresh
                </span>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {messages.length === 0 ? (
                  <div
                    data-ocid="chat.empty_state"
                    className="flex flex-col items-center justify-center h-full py-12 text-center"
                  >
                    <div className="w-10 h-10 rounded-full border border-border/40 bg-muted/20 flex items-center justify-center mb-3">
                      <svg
                        className="w-5 h-5 text-muted-foreground/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-muted-foreground/40 font-mono">
                      No messages yet. Start the conversation.
                    </p>
                    <p className="text-[10px] text-muted-foreground/30 font-mono mt-1">
                      Contact info is blocked for anonymity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => {
                      const isOwn = msg.senderPseudonym === pseudonym;
                      const isDeleted = !!msg.deletedAt;
                      const isRead = !!msg.readAt;

                      if (msg.isFlagged) {
                        return (
                          <div
                            key={msg.messageId}
                            data-ocid={`chat.message.${i + 1}`}
                            className="flex justify-center"
                          >
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/8 border border-destructive/20 text-[10px] font-mono text-destructive/60">
                              ⚠ This message was flagged and hidden by the
                              platform
                            </div>
                          </div>
                        );
                      }

                      if (isDeleted) {
                        return (
                          <div
                            key={msg.messageId}
                            data-ocid={`chat.message.${i + 1}`}
                            className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full border border-border/30 bg-muted/20 flex items-center justify-center text-[9px] font-mono text-muted-foreground/30">
                              {isOwn ? "Y" : "T"}
                            </div>
                            <div className="max-w-[75%]">
                              <div className="px-3 py-2 rounded-lg text-xs italic text-muted-foreground/40 border border-border/20 bg-muted/10">
                                This message was deleted
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.messageId}
                          data-ocid={`chat.message.${i + 1}`}
                          className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                          onMouseEnter={() =>
                            setHoveredMessageId(msg.messageId)
                          }
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-mono font-bold ${
                              isOwn
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/50 bg-muted/30 text-muted-foreground/60"
                            }`}
                          >
                            {isOwn ? "Y" : "T"}
                          </div>
                          <div
                            className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}
                          >
                            <div className="relative group/msg">
                              <div
                                className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                                  isOwn
                                    ? "bg-primary/15 text-foreground border border-primary/20"
                                    : "bg-muted/30 text-foreground border border-border/30"
                                }`}
                              >
                                {msg.content}
                              </div>
                              {/* Delete button for own messages */}
                              {isOwn && hoveredMessageId === msg.messageId && (
                                <button
                                  type="button"
                                  data-ocid={`chat.message_delete.button.${i + 1}`}
                                  onClick={() => handleDeleteMessage(msg)}
                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive/80 border border-destructive/40 flex items-center justify-center text-white hover:bg-destructive transition-colors"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            <div
                              className={`flex items-center gap-1 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                              <span className="text-[10px] font-mono text-muted-foreground/40">
                                {isOwn ? "You" : "Them"}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/30">
                                · {formatTime(msg.timestamp)}
                              </span>
                              {/* Read receipt for own messages */}
                              {isOwn && isRead && (
                                <span className="text-[10px] font-mono text-primary/50 flex items-center gap-0.5">
                                  <CheckCheck className="w-3 h-3" />
                                  Read
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-border/40 bg-background/40">
                <div className="flex gap-2">
                  <Textarea
                    data-ocid="chat.input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={2}
                    className="flex-1 bg-muted/20 border-border/40 text-foreground placeholder:text-muted-foreground/30 text-sm resize-none focus:border-primary/40 min-h-[56px] max-h-[120px]"
                  />
                  <Button
                    data-ocid="chat.send_button"
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    size="sm"
                    className="h-auto px-3 bg-primary text-primary-foreground hover:opacity-90 transition-opacity self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/30 mt-1.5">
                  Contact info, external links and bypass keywords are blocked
                </p>
              </div>
            </section>
          </div>
        )}
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

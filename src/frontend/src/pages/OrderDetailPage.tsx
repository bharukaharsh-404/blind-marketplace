import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Fingerprint,
  LogOut,
  Paperclip,
  Send,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  clearUserProfile,
  getFiles,
  getMessages,
  getOrders,
  getUserProfile,
  getUserRole,
  releaseEscrow,
  saveFile,
  saveMessage,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = getUserProfile();
  const pseudonym = profile?.pseudonym ?? "Anonymous";
  const role = getUserRole() ?? "lister";
  const currentPrincipalId =
    identity?.getPrincipal().toString() ?? profile?.principalId ?? "";

  // Initial load
  useEffect(() => {
    const orders = getOrders();
    const found = orders.find((o) => o.orderId === orderId);
    if (found) setOrder(found);
    setMessages(getMessages(orderId));
    setFiles(getFiles(orderId));
  }, [orderId]);

  // Poll messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(getMessages(orderId));
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

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
    const content = messageInput.trim();
    if (!content) return;

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

    saveMessage(msg);
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
    // Refresh order state
    const updatedOrders = getOrders();
    const updatedOrder = updatedOrders.find((o) => o.orderId === orderId);
    if (updatedOrder) setOrder(updatedOrder);
    toast.success("Funds released to writer!", {
      description: "The escrow has been released. Order marked as completed.",
      duration: 3000,
    });
    setIsReleasingFunds(false);
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
      setFiles(getFiles(orderId));
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
    order?.escrowStatus === "held";

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
                </div>
              </section>

              {/* Escrow Panel */}
              <section className="bg-card border border-border/40 rounded-lg p-4">
                <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-3">
                  Escrow
                </h3>

                {order.escrowStatus === "held" ? (
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
                  Anonymous Chat
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

                      return (
                        <div
                          key={msg.messageId}
                          data-ocid={`chat.message.${i + 1}`}
                          className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
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
                            <div
                              className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                                isOwn
                                  ? "bg-primary/15 text-foreground border border-primary/20"
                                  : "bg-muted/30 text-foreground border border-border/30"
                              }`}
                            >
                              {msg.content}
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

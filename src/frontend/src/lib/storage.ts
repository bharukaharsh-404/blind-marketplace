import type {
  Message,
  Order,
  UploadedFile,
  UserProfile,
} from "../types/marketplace";
import { isSupabaseConfigured, supabase } from "./supabase";

const ORDERS_KEY = "blind_marketplace_orders";
const USER_KEY = "blind_marketplace_user";
const USER_ROLE_KEY = "blind_marketplace_role";
const MESSAGES_KEY = "blind_marketplace_messages";
const FILES_KEY = "blind_marketplace_files";

const PSEUDONYM_PREFIXES = ["Writer", "Lister", "Scholar", "Agent", "Broker"];

// ─── Rate Limiter ───────────────────────────────────────────────
const rateLimitCounters = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxPerMinute = 10): boolean {
  const now = Date.now();
  const entry = rateLimitCounters.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitCounters.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

// ─── Input Sanitizer ────────────────────────────────────────────
export function sanitizeInput(input: string, maxLength = 2000): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML
    .slice(0, maxLength)
    .trim();
}

// ─── User Profile ────────────────────────────────────────────────
export function generatePseudonym(): string {
  const prefix =
    PSEUDONYM_PREFIXES[Math.floor(Math.random() * PSEUDONYM_PREFIXES.length)];
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}_${number}`;
}

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
}

export function clearUserProfile(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

// ─── Role ──────────────────────────────────────────────────────
export function getUserRole(): "lister" | "writer" | null {
  try {
    const raw = localStorage.getItem(USER_ROLE_KEY);
    if (!raw) return null;
    const role = raw as "lister" | "writer";
    if (role === "lister" || role === "writer") return role;
    return null;
  } catch {
    return null;
  }
}

export function saveUserRole(role: "lister" | "writer"): void {
  localStorage.setItem(USER_ROLE_KEY, role);
}

// ─── Orders ────────────────────────────────────────────────────
export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function generateOrderId(): string {
  const orders = getOrders();
  const nextNumber = orders.length + 1;
  return `ORD-${String(nextNumber).padStart(3, "0")}`;
}

export function createOrder(
  data: Pick<Order, "title" | "description" | "budget">,
  pseudonym: string,
  listerPrincipalId: string,
): Order {
  const orders = getOrders();
  const nextNumber = orders.length + 1;
  const orderId = `ORD-${String(nextNumber).padStart(3, "0")}`;

  const newOrder: Order = {
    orderId,
    title: sanitizeInput(data.title, 200),
    description: sanitizeInput(data.description, 2000),
    budget: data.budget,
    status: "open",
    createdAt: Date.now(),
    listerPseudonym: pseudonym,
    escrowStatus: "held",
    listerPrincipalId,
  };

  saveOrders([newOrder, ...orders]);
  return newOrder;
}

export function acceptOrder(
  orderId: string,
  writerPseudonym: string,
  _writerPrincipalId: string,
): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return { ...o, status: "in_progress" as const, writerPseudonym };
    }
    return o;
  });
  saveOrders(updated);
}

export function releaseEscrow(orderId: string): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return {
        ...o,
        status: "completed" as const,
        escrowStatus: "released" as const,
      };
    }
    return o;
  });
  saveOrders(updated);
}

// ─── Phase 3: Order dispute & admin actions ────────────────────
export function openOrderDispute(orderId: string, reason: string): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return {
        ...o,
        isDisputed: true,
        disputeReason: sanitizeInput(reason, 1000),
      };
    }
    return o;
  });
  saveOrders(updated);
}

export function adminReleaseToWriter(orderId: string): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return {
        ...o,
        status: "completed" as const,
        escrowStatus: "released" as const,
        isDisputed: false,
        disputeReason: undefined,
      };
    }
    return o;
  });
  saveOrders(updated);
}

export function adminRefundToLister(orderId: string): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return {
        ...o,
        status: "open" as const,
        escrowStatus: "refunded" as const,
        isDisputed: false,
        disputeReason: undefined,
        writerPseudonym: undefined,
      };
    }
    return o;
  });
  saveOrders(updated);
}

export function getAllOrders(): Order[] {
  return getOrders();
}

export function getDisputedOrders(): Order[] {
  return getOrders().filter((o) => o.isDisputed === true);
}

export function setStripePaymentIntent(
  orderId: string,
  paymentIntentId: string,
): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return { ...o, stripePaymentIntentId: paymentIntentId };
    }
    return o;
  });
  saveOrders(updated);
}

// ─── Messages ──────────────────────────────────────────────────
// Sync fallback (localStorage)
export function getMessages(orderId: string): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Message[];
    return all.filter((m) => m.orderId === orderId);
  } catch {
    return [];
  }
}

export function saveMessage(msg: Message): void {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: Message[] = raw ? (JSON.parse(raw) as Message[]) : [];
    all.push(msg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  } catch {
    // fail silently
  }
}

export function getAllMessages(): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

// Async variants (try Supabase, fall back to localStorage)
export async function getMessagesAsync(orderId: string): Promise<Message[]> {
  if (!isSupabaseConfigured) {
    return getMessages(orderId);
  }
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("timestamp", { ascending: true });

    if (error) throw error;
    if (!data) return getMessages(orderId);

    const msgs: Message[] = data.map(
      (row: {
        message_id: string;
        order_id: string;
        sender_pseudonym: string;
        content: string;
        timestamp: number;
        is_flagged: boolean;
        read_at?: number;
        deleted_at?: number;
      }) => ({
        messageId: row.message_id,
        orderId: row.order_id,
        senderPseudonym: row.sender_pseudonym,
        content: row.content,
        timestamp: row.timestamp,
        isFlagged: row.is_flagged,
        readAt: row.read_at ?? undefined,
        deletedAt: row.deleted_at ?? undefined,
      }),
    );
    return msgs;
  } catch {
    return getMessages(orderId);
  }
}

export async function saveMessageAsync(msg: Message): Promise<void> {
  // Always save to localStorage as backup
  saveMessage(msg);

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("messages").upsert({
      message_id: msg.messageId,
      order_id: msg.orderId,
      sender_pseudonym: msg.senderPseudonym,
      content: msg.content,
      timestamp: msg.timestamp,
      is_flagged: msg.isFlagged,
      read_at: msg.readAt ?? null,
      deleted_at: msg.deletedAt ?? null,
    });
  } catch {
    // fall back to localStorage which already has the message
  }
}

// ─── Phase 3: Message actions ──────────────────────────────────
export function markMessageRead(messageId: string): void {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as Message[];
    const updated = all.map((m) => {
      if (m.messageId === messageId && !m.readAt) {
        return { ...m, readAt: Date.now() };
      }
      return m;
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch {
    // fail silently
  }

  // Async Supabase update (fire and forget)
  if (isSupabaseConfigured) {
    void (async () => {
      try {
        await supabase
          .from("messages")
          .update({ read_at: Date.now() })
          .eq("message_id", messageId);
      } catch {
        // ignore
      }
    })();
  }
}

export function deleteMessage(
  messageId: string,
  senderPseudonym: string,
): void {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as Message[];
    const updated = all.map((m) => {
      if (m.messageId === messageId && m.senderPseudonym === senderPseudonym) {
        return { ...m, deletedAt: Date.now() };
      }
      return m;
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch {
    // fail silently
  }

  // Async Supabase update (fire and forget)
  if (isSupabaseConfigured) {
    void (async () => {
      try {
        await supabase
          .from("messages")
          .update({ deleted_at: Date.now() })
          .eq("message_id", messageId)
          .eq("sender_pseudonym", senderPseudonym);
      } catch {
        // ignore
      }
    })();
  }
}

// ─── Files ─────────────────────────────────────────────────────
// Sync fallback (localStorage)
export function getFiles(orderId: string): UploadedFile[] {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as UploadedFile[];
    return all.filter((f) => f.orderId === orderId);
  } catch {
    return [];
  }
}

export function saveFile(file: UploadedFile): void {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    const all: UploadedFile[] = raw ? (JSON.parse(raw) as UploadedFile[]) : [];
    all.push(file);
    localStorage.setItem(FILES_KEY, JSON.stringify(all));
  } catch {
    // fail silently
  }
}

// Async variants (try Supabase, fall back to localStorage)
export async function getFilesAsync(orderId: string): Promise<UploadedFile[]> {
  if (!isSupabaseConfigured) {
    return getFiles(orderId);
  }
  try {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!data) return getFiles(orderId);

    const files: UploadedFile[] = data.map(
      (row: {
        file_id: string;
        order_id: string;
        uploader_pseudonym: string;
        file_name: string;
        file_size: number;
        storage_url?: string;
        created_at: number;
        expires_at: number;
      }) => ({
        fileId: row.file_id,
        orderId: row.order_id,
        uploaderPseudonym: row.uploader_pseudonym,
        fileName: row.file_name,
        fileSize: row.file_size,
        fileData: row.storage_url ?? "",
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        supabaseStorageUrl: row.storage_url ?? undefined,
      }),
    );
    return files;
  } catch {
    return getFiles(orderId);
  }
}

export async function saveFileAsync(file: UploadedFile): Promise<void> {
  // Always save to localStorage as backup
  saveFile(file);

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("files").upsert({
      file_id: file.fileId,
      order_id: file.orderId,
      uploader_pseudonym: file.uploaderPseudonym,
      file_name: file.fileName,
      file_size: file.fileSize,
      storage_url: file.supabaseStorageUrl ?? null,
      created_at: file.createdAt,
      expires_at: file.expiresAt,
    });
  } catch {
    // fall back to localStorage which already has the file
  }
}

// ─── Sample Data ───────────────────────────────────────────────
const SAMPLE_ORDERS: Order[] = [
  {
    orderId: "ORD-001",
    title: "10-page literature review on Behavioral Economics",
    description:
      "Need a comprehensive literature review covering Kahneman, Thaler, and Ariely's key works. APA format, 10 pages minimum.",
    budget: 120,
    status: "open",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    listerPseudonym: "Scholar_4471",
    escrowStatus: "held",
    listerPrincipalId: "sample-lister-1",
  },
  {
    orderId: "ORD-002",
    title: "Python data analysis script for CSV datasets",
    description:
      "Write a Python script using pandas and matplotlib to analyze sales data CSVs. Include summary statistics and 3 visualizations.",
    budget: 85,
    status: "in_progress",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    listerPseudonym: "Lister_7823",
    writerPseudonym: "Writer_3312",
    escrowStatus: "held",
    listerPrincipalId: "sample-lister-2",
  },
  {
    orderId: "ORD-003",
    title: "Persuasive essay on climate tech investment",
    description:
      "2500-word persuasive essay arguing for increased government funding in green hydrogen technology. Chicago style citations.",
    budget: 65,
    status: "open",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    listerPseudonym: "Agent_3392",
    escrowStatus: "held",
    listerPrincipalId: "sample-lister-3",
  },
  {
    orderId: "ORD-004",
    title: "Statistical analysis — ANOVA for psychology study",
    description:
      "Run ANOVA tests on provided SPSS dataset. Write up results section and interpretation in APA format.",
    budget: 150,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    listerPseudonym: "Broker_9156",
    writerPseudonym: "Agent_5544",
    escrowStatus: "released",
    listerPrincipalId: "sample-lister-4",
  },
];

export function seedSampleOrders(): void {
  const existing = getOrders();
  if (existing.length === 0) {
    saveOrders(SAMPLE_ORDERS);
  }
}

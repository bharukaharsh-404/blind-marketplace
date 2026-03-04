import type {
  Message,
  Order,
  UploadedFile,
  UserProfile,
} from "../types/marketplace";

const ORDERS_KEY = "blind_marketplace_orders";
const USER_KEY = "blind_marketplace_user";
const USER_ROLE_KEY = "blind_marketplace_role";
const MESSAGES_KEY = "blind_marketplace_messages";
const FILES_KEY = "blind_marketplace_files";

const PSEUDONYM_PREFIXES = ["Writer", "Lister", "Scholar", "Agent", "Broker"];

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
    title: data.title,
    description: data.description,
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

// ─── Messages ──────────────────────────────────────────────────
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

// ─── Files ─────────────────────────────────────────────────────
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

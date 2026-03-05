export interface Order {
  orderId: string;
  title: string;
  description: string;
  budget: number;
  status: "open" | "in_progress" | "completed";
  createdAt: number;
  listerPseudonym: string;
  // Phase 2 additions
  writerPseudonym?: string;
  escrowStatus: "none" | "held" | "released" | "refunded";
  listerPrincipalId: string;
  // Phase 3
  isDisputed?: boolean;
  disputeReason?: string;
  stripePaymentIntentId?: string;
}

export interface UserProfile {
  pseudonym: string;
  principalId: string;
  // Phase 2
  role: "lister" | "writer";
}

export interface Message {
  messageId: string;
  orderId: string;
  senderPseudonym: string;
  content: string;
  timestamp: number;
  isFlagged: boolean;
  // Phase 3
  readAt?: number;
  deletedAt?: number;
}

export interface UploadedFile {
  fileId: string;
  orderId: string;
  uploaderPseudonym: string;
  fileName: string;
  fileSize: number;
  fileData: string; // base64 (Phase 2 compat) OR supabase URL
  createdAt: number;
  expiresAt: number; // createdAt + 24*60*60*1000
  // Phase 3
  supabaseStorageUrl?: string;
}

// Phase 3 Admin record
export interface AdminOrderRecord {
  orderId: string;
  listerPrincipalId: string;
  writerPrincipalId?: string;
  listerPseudonym: string;
  writerPseudonym?: string;
  status: string;
  escrowStatus: string;
  isDisputed: boolean;
  disputeReason?: string;
}

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
  escrowStatus: "none" | "held" | "released";
  listerPrincipalId: string;
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
}

export interface UploadedFile {
  fileId: string;
  orderId: string;
  uploaderPseudonym: string;
  fileName: string;
  fileSize: number;
  fileData: string; // base64
  createdAt: number;
  expiresAt: number; // createdAt + 24*60*60*1000
}

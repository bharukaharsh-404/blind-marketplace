export interface Order {
  orderId: string;
  title: string;
  description: string;
  budget: number;
  status: "open" | "in_progress" | "completed";
  createdAt: number;
  listerPseudonym: string;
}

export interface UserProfile {
  pseudonym: string;
  principalId: string;
}

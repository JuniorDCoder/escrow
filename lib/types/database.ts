// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Keep in sync manually — regenerate with `supabase gen types` once a
// live project exists if you'd rather not hand-maintain this.

export type KycStatus = "none" | "pending" | "verified" | "rejected";

export type TransactionStatus =
  | "draft"
  | "awaiting_acceptance"
  | "awaiting_payment"
  | "payment_under_review"
  | "funded"
  | "delivered"
  | "inspection_period"
  | "accepted"
  | "disputed"
  | "resolved_buyer"
  | "resolved_seller"
  | "resolved_split"
  | "release_pending"
  | "released"
  | "refunded"
  | "cancelled";

export type TransactionCategory =
  | "domain"
  | "vehicle"
  | "digital_goods"
  | "services"
  | "crypto_asset"
  | "general_merchandise"
  | "other";

export type FeePayer = "buyer" | "seller" | "split";

export type PaymentMethodType = "bank_transfer" | "crypto" | "mobile_money" | "other";

export type ProofStatus = "pending" | "verified" | "rejected";

export type DisputeStatus = "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "resolved_split";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  is_admin: boolean;
  kyc_status: KycStatus;
  is_suspended: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  reference_code: string;
  title: string;
  description: string | null;
  category: TransactionCategory;
  amount: number;
  currency: string;
  fee_amount: number;
  fee_payer: FeePayer;
  total_payable: number;
  buyer_id: string | null;
  seller_id: string | null;
  buyer_email: string | null;
  seller_email: string | null;
  created_by: string;
  status: TransactionStatus;
  inspection_period_days: number;
  inspection_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  network: string | null;
  account_details: Record<string, string> | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  transaction_id: string;
  uploaded_by: string;
  payment_method_id: string | null;
  amount_claimed: number;
  currency: string;
  tx_hash_or_reference: string | null;
  file_url: string;
  status: ProofStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface DeliveryProof {
  id: string;
  transaction_id: string;
  uploaded_by: string;
  description: string | null;
  file_url: string | null;
  tracking_reference: string | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  transaction_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  transaction_id: string;
  sender_id: string | null;
  body: string;
  is_system_event: boolean;
  attachment_url: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  transaction_id: string;
  rated_by: string;
  rated_user: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  platform_name: string;
  fee_percentage: number;
  fee_minimum: number;
  whatsapp_number: string | null;
  support_email: string | null;
  default_inspection_days: number;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string;
  note: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> };
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> };
      payment_methods: { Row: PaymentMethod; Insert: Partial<PaymentMethod>; Update: Partial<PaymentMethod> };
      payment_proofs: { Row: PaymentProof; Insert: Partial<PaymentProof>; Update: Partial<PaymentProof> };
      delivery_proofs: { Row: DeliveryProof; Insert: Partial<DeliveryProof>; Update: Partial<DeliveryProof> };
      disputes: { Row: Dispute; Insert: Partial<Dispute>; Update: Partial<Dispute> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      ratings: { Row: Rating; Insert: Partial<Rating>; Update: Partial<Rating> };
      settings: { Row: Settings; Insert: Partial<Settings>; Update: Partial<Settings> };
      admin_actions: { Row: AdminAction; Insert: Partial<AdminAction>; Update: Partial<AdminAction> };
    };
  };
}

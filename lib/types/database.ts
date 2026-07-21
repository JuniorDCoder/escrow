// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Keep in sync manually — regenerate with `supabase gen types` once a
// live project exists if you'd rather not hand-maintain this.
//
// IMPORTANT: every row shape below is a `type` alias, not an `interface`.
// TypeScript's structural checks treat the two differently inside
// conditional types — an `interface` does not satisfy a `Record<string,
// unknown>` constraint the way an equivalent `type` literal does — and
// supabase-js's generic inference for `.from(...)` relies on exactly that
// constraint. Using `interface` here silently makes every query/insert/
// update argument type-check as `never`. Keep these as `type`.

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

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  is_admin: boolean;
  kyc_status: KycStatus;
  is_suspended: boolean;
  created_at: string;
};

export type Transaction = {
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
};

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  network: string | null;
  account_details: Record<string, string> | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
};

export type PaymentProof = {
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
};

export type DeliveryProof = {
  id: string;
  transaction_id: string;
  uploaded_by: string;
  description: string | null;
  file_url: string | null;
  tracking_reference: string | null;
  created_at: string;
};

export type Dispute = {
  id: string;
  transaction_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  transaction_id: string;
  sender_id: string | null;
  body: string;
  is_system_event: boolean;
  attachment_url: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type Rating = {
  id: string;
  transaction_id: string;
  rated_by: string;
  rated_user: string;
  score: number;
  comment: string | null;
  created_at: string;
};

export type Settings = {
  id: number;
  platform_name: string;
  fee_percentage: number;
  fee_minimum: number;
  whatsapp_number: string | null;
  support_email: string | null;
  default_inspection_days: number;
};

export type AdminAction = {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string;
  note: string | null;
  created_at: string;
};

export type MailEncryption = "ssl" | "tls" | "none";

export type EmailSettings = {
  id: number;
  mail_host: string | null;
  mail_port: number | null;
  mail_username: string | null;
  mail_password: string | null;
  mail_encryption: MailEncryption | null;
  mail_from_address: string | null;
  mail_from_name: string | null;
  updated_at: string;
};

export type PayoutStatus = "pending" | "paid";

export type Payout = {
  id: string;
  transaction_id: string;
  seller_id: string;
  method_type: PaymentMethodType;
  account_details: string;
  note: string | null;
  status: PayoutStatus;
  admin_note: string | null;
  paid_by: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type TableDef<Row, RequiredInsertKeys extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsertKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, "id" | "email">;
      transactions: TableDef<
        Transaction,
        "title" | "category" | "amount" | "currency" | "fee_amount" | "fee_payer" | "total_payable" | "created_by"
      >;
      payment_methods: TableDef<PaymentMethod, "type" | "label">;
      payment_proofs: TableDef<
        PaymentProof,
        "transaction_id" | "uploaded_by" | "amount_claimed" | "currency" | "file_url"
      >;
      delivery_proofs: TableDef<DeliveryProof, "transaction_id" | "uploaded_by">;
      disputes: TableDef<Dispute, "transaction_id" | "opened_by" | "reason">;
      messages: TableDef<Message, "transaction_id" | "body">;
      notifications: TableDef<Notification, "user_id" | "type">;
      ratings: TableDef<Rating, "transaction_id" | "rated_by" | "rated_user" | "score">;
      settings: TableDef<Settings, never>;
      admin_actions: TableDef<AdminAction, "admin_id" | "action" | "target_table" | "target_id">;
      payouts: TableDef<Payout, "transaction_id" | "seller_id" | "method_type" | "account_details">;
      email_settings: TableDef<EmailSettings, never>;
    };
    Views: {
      profile_public: {
        Row: Pick<Profile, "id" | "full_name">;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: { uid?: string };
        Returns: boolean;
      };
    };
  };
};

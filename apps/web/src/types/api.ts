export type Role = "admin" | "operator" | "analyst" | "viewer" | "service";

export interface ApiErrorBody {
  code: string;
  message: string;
  request_id?: string | null;
  details?: Record<string, unknown> | null;
}

export interface MeUser {
  id: string;
  firebase_uid: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  picture: string | null;
  email_verified: boolean;
  is_verified: boolean;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface RegisterResponse {
  user: MeUser;
  message: string;
  verification_token?: string | null;
}

export interface LoginResponse {
  user: MeUser;
  token: {
    uid: string;
    issuer: string | null;
    audience: string | null;
    expires_at: number | null;
    issued_at: number | null;
    email_verified: boolean;
  };
}

export interface MessageResponse {
  message: string;
  data?: Record<string, unknown> | null;
}

export interface CompanyAddress {
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface Company {
  id: string;
  owner_user_id: string;
  legal_name: string;
  trade_name?: string | null;
  tax_id: string;
  email?: string | null;
  phone?: string | null;
  address?: CompanyAddress | null;
  country: string;
  website?: string | null;
  description?: string | null;
  logo_storage_key?: string | null;
  logo_url?: string | null;
  sector?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreatePayload {
  legal_name: string;
  trade_name?: string | null;
  tax_id: string;
  email?: string | null;
  phone?: string | null;
  address?: CompanyAddress | null;
  country?: string;
  website?: string | null;
  description?: string | null;
  logo_storage_key?: string | null;
  logo_url?: string | null;
  sector?: string | null;
}

export interface CompanyUpdatePayload {
  legal_name?: string;
  trade_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: CompanyAddress | null;
  website?: string | null;
  description?: string | null;
  logo_storage_key?: string | null;
  logo_url?: string | null;
  sector?: string | null;
}

export interface LogoPresignResponse {
  upload_url: string;
  storage_key: string;
  public_url: string;
  expires_at: string;
}

export interface StorageUploadResponse {
  storage_key: string;
  public_url: string;
}

export interface ProfileAddress {
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  picture: string | null;
  picture_storage_key: string | null;
  cpf: string | null;
  birth_date: string | null;
  job_title: string | null;
  address: ProfileAddress | null;
  country: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdatePayload {
  name?: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  job_title?: string | null;
  address?: ProfileAddress | null;
  country?: string;
  picture_storage_key?: string | null;
  picture_url?: string | null;
}

export interface AvatarPresignResponse {
  upload_url: string;
  storage_key: string;
  public_url: string;
  expires_at: string;
}

export type OpportunityType = "comercializacao" | "simbiose_industrial" | "compartilhamento";

export type OfferDemand = "gerador" | "receptor";

export type OpportunityPeriodicity = "continua" | "esporadica";

export type OpportunitySort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "quantity_desc";

export interface OpportunityImage {
  storage_key: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Opportunity {
  id: string;
  company_id: string;
  company_name: string;
  owner_user_id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  offer_demand: OfferDemand;
  category: string;
  technical_detail: string;
  purity_percent: number | null;
  physical_state: string;
  periodicity: OpportunityPeriodicity;
  quantity: number;
  unit: string;
  price: number | null;
  price_negotiable: boolean;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  images: OpportunityImage[];
  created_at: string;
  updated_at: string;
}

export interface OpportunityListParams {
  page?: number;
  page_size?: number;
  q?: string;
  opportunity_type?: OpportunityType;
  offer_demand?: OfferDemand;
  category?: string;
  state?: string;
  city?: string;
  periodicity?: OpportunityPeriodicity;
  price_min?: number;
  price_max?: number;
  quantity_min?: number;
  quantity_max?: number;
  sort?: OpportunitySort;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface OpportunityCreatePayload {
  company_id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  offer_demand: OfferDemand;
  category: string;
  technical_detail: string;
  purity_percent?: number | null;
  physical_state: string;
  periodicity: OpportunityPeriodicity;
  quantity: number;
  unit: string;
  price?: number | null;
  price_negotiable: boolean;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  images: OpportunityImage[];
}

export interface OpportunityUpdatePayload {
  title?: string;
  description?: string;
  opportunity_type?: OpportunityType;
  offer_demand?: OfferDemand;
  category?: string;
  technical_detail?: string;
  purity_percent?: number | null;
  physical_state?: string;
  periodicity?: OpportunityPeriodicity;
  quantity?: number;
  unit?: string;
  price?: number | null;
  price_negotiable?: boolean;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: OpportunityImage[];
}

export interface OpportunityImagePresignResponse {
  upload_url: string;
  storage_key: string;
  public_url: string;
  expires_at: string;
}

export interface AdminUserListItem {
  id: string;
  firebase_uid: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AdminUserListParams {
  page?: number;
  page_size?: number;
  role?: Role;
  is_active?: boolean;
  email?: string;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface AdminUserCreatePayload {
  full_name: string;
  email: string;
  password: string;
  password_confirm?: string;
  phone?: string | null;
  role: Role;
  auto_confirm?: boolean;
}

export interface AdminUserUpdatePayload {
  name?: string;
  phone?: string | null;
  role?: Role;
  is_active?: boolean;
}

export interface AdminCompanyCreatePayload extends CompanyCreatePayload {
  owner_user_id: string;
}

export interface AdminCompanyListResponse {
  items: Company[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export type NotificationChannel = "in_app" | "email";
export type NotificationTargetType = "all" | "users" | "groups";
export type NotificationCampaignStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

export interface NotificationGroup {
  id: string;
  name: string;
  description: string | null;
  user_ids: string[];
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationGroupListResponse {
  items: NotificationGroup[];
  total: number;
  page: number;
  page_size: number;
}

export interface NotificationGroupCreatePayload {
  name: string;
  description?: string | null;
  user_ids: string[];
}

export interface NotificationGroupUpdatePayload {
  name?: string;
  description?: string | null;
  user_ids?: string[];
  is_active?: boolean;
}

export interface NotificationCampaignStats {
  total: number;
  delivered: number;
  failed: number;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  channels: NotificationChannel[];
  target_type: NotificationTargetType;
  target_user_ids: string[];
  target_group_ids: string[];
  send_at: string | null;
  status: NotificationCampaignStatus;
  stats: NotificationCampaignStats;
  created_by: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationCampaignListResponse {
  items: NotificationCampaign[];
  total: number;
  page: number;
  page_size: number;
}

export interface NotificationCampaignCreatePayload {
  title: string;
  body: string;
  channels: NotificationChannel[];
  target_type: NotificationTargetType;
  target_user_ids?: string[];
  target_group_ids?: string[];
  send_at?: string | null;
}

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  campaign_id?: string | null;
  kind?: "general" | "support" | "agreement" | "conversation";
  metadata?: Record<string, string>;
}

export interface UserNotificationListResponse {
  items: UserNotification[];
  total: number;
  page: number;
  page_size: number;
}

export interface UnreadCountResponse {
  count: number;
}

export type SupportTicketStatus = "open" | "in_progress" | "closed";

export type SupportTicketSource = "internal" | "external" | "contact_request";

export type SupportContactInterest = "dmc" | "mri";

export type SupportMessageType = "user_message" | "admin_reply" | "internal_note";

export interface SupportTicket {
  id: string;
  source?: SupportTicketSource;
  user_id?: string | null;
  visitor_email?: string | null;
  visitor_name?: string | null;
  company?: string | null;
  position?: string | null;
  phone?: string | null;
  address?: string | null;
  interest?: SupportContactInterest | null;
  ticket_number: number;
  subject: string;
  status: SupportTicketStatus;
  assigned_admin_id?: string | null;
  assigned_admin_name?: string | null;
  closed_by?: string | null;
  closed_at?: string | null;
  last_message_at?: string | null;
  last_responder_admin_id?: string | null;
  last_responder_admin_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  user_name?: string | null;
  user_email?: string | null;
  user_online?: boolean;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: "user" | "admin" | "visitor";
  author_name?: string | null;
  message_type: SupportMessageType;
  body: string;
  read_at?: string | null;
  created_at: string;
}

export interface SupportTicketListResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  page_size: number;
}

export interface SupportMessageListResponse {
  items: SupportMessage[];
  total: number;
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export type BlogPostStatus = "draft" | "scheduled" | "published" | "disabled";

export type BlogPostSort =
  | "newest"
  | "oldest"
  | "publish_at_desc"
  | "publish_at_asc"
  | "created_at_desc"
  | "created_at_asc";

export interface BlogCoverImage {
  storage_key: string;
  public_url: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  excerpt: string | null;
  author: string | null;
  cover_image: BlogCoverImage | null;
  tags: string[];
  category: string | null;
  status: BlogPostStatus;
  publish_at: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string | null;
  cover_image: BlogCoverImage | null;
  tags: string[];
  category: string | null;
  status: BlogPostStatus;
  publish_at: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListParams {
  page?: number;
  page_size?: number;
  q?: string;
  status?: BlogPostStatus;
  sort?: BlogPostSort;
}

export interface BlogPostListResponse {
  items: BlogPostListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface BlogPostCreatePayload {
  title: string;
  content: Record<string, unknown>;
  excerpt?: string | null;
  author?: string | null;
  cover_image?: BlogCoverImage | null;
  tags?: string[];
  category?: string | null;
  slug?: string | null;
  publish_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: BlogPostStatus | null;
}

export interface BlogPostUpdatePayload {
  title?: string;
  content?: Record<string, unknown>;
  excerpt?: string | null;
  author?: string | null;
  cover_image?: BlogCoverImage | null;
  tags?: string[];
  category?: string | null;
  slug?: string | null;
  publish_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: BlogPostStatus | null;
  clear_cover_image?: boolean;
  clear_publish_at?: boolean;
}

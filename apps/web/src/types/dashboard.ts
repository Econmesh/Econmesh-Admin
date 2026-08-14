export type NamedCount = {
  key: string;
  count: number;
  label: string | null;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
};

export type TimeSeriesPoint = {
  date: string;
  opportunities: number;
  conversations: number;
  proposals: number;
  agreements_signed: number;
};

export type DashboardTotals = {
  users: number;
  companies: number;
  opportunities: number;
  opportunities_active: number;
  conversations: number;
  conversations_open: number;
  proposals: number;
  proposals_pending: number;
  agreements: number;
  agreements_pending: number;
  agreements_signed: number;
  support_open: number;
};

export type AdminDashboardResponse = {
  totals: DashboardTotals;
  funnel: FunnelStage[];
  agreements_by_status: NamedCount[];
  proposals_by_status: NamedCount[];
  opportunities_by_type: NamedCount[];
  opportunities_by_offer_demand: NamedCount[];
  opportunities_by_state: NamedCount[];
  support_by_status: NamedCount[];
  timeseries: TimeSeriesPoint[];
  estimated_gmv: number;
  opportunities_with_price: number;
  opportunities_price_negotiable: number;
  days: number;
};

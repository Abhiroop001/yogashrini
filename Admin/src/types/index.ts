// Centralized Domain Types for Yogashrini Admin

export interface VideoItem {
  _id?: string;
  title: string;
  filename: string;
  duration?: number;
}

export interface WeekModule {
  _id?: string;
  weekNumber: number;
  title: string;
  description?: string;
  isBonus?: boolean;
  bonusXP?: number;
  bonusPoints?: number;
  videos: VideoItem[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  level: string;
  price: number;
  durationWeeks?: number;
  totalWeeks?: number;
  thumbnail?: string;
  isActive?: boolean;
  weeks?: WeekModule[];
  createdAt?: string;
}

export interface Product {
  _id: string;
  pname: string;
  pprice: number;
  pcategory?: string;
  pdetails?: string;
  pimage?: string;
  pimg?: string;
  pstock?: number;
}

export interface Retreat {
  _id: string;
  rname: string;
  rdate?: string;
  rlocation?: string;
  ractivities?: string;
  rcost?: string | number;
  rother?: string;
  rshort?: string;
}

export interface ExecutiveBriefingData {
  executiveSummary: string;
  growthMetrics: {
    kpi: string;
    trend: string;
    insight: string;
  }[];
  criticalAlerts: string[];
  actionableRecommendations: string[];
  synthesizedAt: string;
}

export interface ProductStats {
  totalProducts: number;
  outOfStockCount: number;
  totalOrders: number;
  pendingOrders: number;
}

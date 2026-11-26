// Centralized TypeScript Type Definitions for Yogashrini Platform

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

export interface PoseItem {
  id: number | string;
  english_name: string;
  sanskrit_name: string;
  img_url?: string;
  url_png?: string;
  pose_description?: string;
  pose_benefits?: string;
  category_name?: string;
  difficulty?: string;
  target_joints?: Record<string, number>;
  benefits?: string[];
  contraindications?: string[];
}

export interface Product {
  _id?: string;
  pname?: string;
  pdetails?: string;
  pprice?: number | string;
  poriginalPrice?: number;
  pcategory?: string;
  pstatus?: string;
  pstock?: number;
  prating?: number;
  pimg?: string;
  pimage?: string;
  image?: string;
  stock?: number;
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface LimbStatus {
  standing_leg: "perfect" | "warning" | "error" | "idle";
  bent_leg: "perfect" | "warning" | "error" | "idle";
  foot_placement: "perfect" | "warning" | "error" | "idle";
  arms: "perfect" | "warning" | "error" | "idle";
  torso: "perfect" | "warning" | "error" | "idle";
}

export interface AISource {
  id: string;
  title: string;
  category?: string;
}

export interface AIChatImage {
  englishName?: string;
  sanskritName?: string;
  title: string;
  imageUrl: string;
  source?: string;
  caption?: string;
  hfNote?: string;
}

export interface AIChatMessage {
  sender: "user" | "bot";
  text: string;
  sources?: AISource[];
  images?: AIChatImage[];
  timestamp?: string;
}

export interface RoutineTrackerMetrics {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: string;
  bmi: number;
  globalBmiCategory: string;
  asianBmiCategory: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  calorieFloor: number;
  floorApplied: boolean;
  calorieDeltaLabel: string;
  macros: {
    proteinG: number;
    carbsG: number;
    fatsG: number;
    fiberG: number;
    proteinPerKg: number;
  };
  metValue: number;
  sessionCaloriesBurned: number;
  hydrationLiters: number;
  durationMinutes: number;
  goal: string;
  activityLevel: string;
}

export interface RoutineScheduleSlot {
  id: string;
  timeSlot: string;
  blockTitle: string;
  category: string;
  details: string;
  metric: string;
}

export interface RoutineMealPlanItem {
  mealName: string;
  timing: string;
  calories: number;
  proteinG: number;
  items: string[];
  rationale: string;
}

export interface RoutineAsanaItem {
  sanskritName: string;
  englishName: string;
  phase: string;
  duration: string;
  caloriesEst: string;
  alignmentCue: string;
  benefit: string;
  contraindication: string;
  imageUrl: string;
  imageSource?: string;
  imageCaption?: string;
}

export interface DailyRoutineTrackerData {
  studentName: string;
  goalLabel: string;
  dietPreference: string;
  metrics: RoutineTrackerMetrics;
  summary: string;
  dailySchedule: RoutineScheduleSlot[];
  dietPlan: RoutineMealPlanItem[];
  recommendedAsanas: RoutineAsanaItem[];
  nutritionTips: string[];
  safetyNotes: string[];
  citations: string[];
  engine?: { model: string; provider: string };
  generatedAt: string;
}

export interface ClinicalReportData {
  report: string;
  studentName: string;
  targetAsana: string;
  alignmentScore: number;
  generatedAt: string;
}

export interface BiomechanicsAnalysisData {
  poseName: string;
  analysis: string;
  timestamp: string;
}

export interface RoutineParameters {
  durationMinutes: number;
  focusArea: string;
  experienceLevel: string;
  energyLevel: string;
}

export interface RoutineResponseData {
  routine: string;
  parameters: RoutineParameters;
  generatedAt: string;
}

export interface SafetyAuditData {
  poseName: string;
  conditions: string[];
  safetyAudit: string;
  evaluatedAt: string;
}

export interface VideoLesson {
  _id?: string;
  title: string;
  video_url: string;
  duration?: number;
  completed?: boolean;
}

export interface WeekModule {
  _id?: string;
  week_number: number;
  title: string;
  videos: VideoLesson[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  level?: string;
  durationWeeks?: number;
  duration_weeks?: number;
  totalWeeks?: number;
  weeks?: WeekModule[];
  enrolled?: boolean;
}

export interface EnrollmentRecord {
  _id: string;
  userId: string;
  courseId: Course;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  isPaid: boolean;
  completedWeeks: number[];
  totalXP?: number;
  totalPoints?: number;
  bonusUnlocked?: boolean;
  purchasedAt?: string;
  regularWeeksAvailable?: number[];
}

export interface Retreat {
  _id?: string;
  rname?: string;
  rshort?: string;
  rdate?: string;
  rlocation?: string;
  ractivities?: string;
  rcost?: string | number;
  rother?: string;
  place?: string;
  price?: number;
  duration?: string;
  desc?: string;
  image?: string;
}

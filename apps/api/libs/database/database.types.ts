import { Generated, ColumnType } from 'kysely';

// --------------- AUTH DOMAIN ---------------

export interface UsersTable {
  id: Generated<string>;
  email: string;
  email_verified: Generated<boolean>;
  password_hash: string | null;
  oauth_provider: string | null;
  oauth_sub: string | null;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, never>;
  deleted_at: Date | null;
}

export interface RefreshTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: ColumnType<Date, never, never>;
  user_agent: string | null;
  ip_address: string | null;
}

// --------------- USERS DOMAIN ---------------

export interface UserProfilesTable {
  user_id: string;
  display_name: string;
  date_of_birth: Date | null;
  sex: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  training_age_months: Generated<number>;
  fitness_goal: 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance';
  activity_level: Generated<'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'>;
  target_weight_kg: number | null;
  target_body_fat_pct: number | null;
  updated_at: ColumnType<Date, never, never>;
}

export interface BodyMetricsTable {
  id: Generated<string>;
  user_id: string;
  logged_at: ColumnType<Date, Date, Date>;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
}

// --------------- WORKOUTS DOMAIN ---------------

export interface ExercisesTable {
  id: Generated<string>;
  slug: string;
  name: string;
  muscle_groups: string[];
  equipment: string;
  movement_type: string;
  mechanics: string;
  is_custom: Generated<boolean>;
  created_by: string | null;
  metadata: Generated<Record<string, unknown>>;
}

export interface TrainingPlansTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  description: string | null;
  weeks_total: number;
  days_per_week: number;
  goal_at_creation: string;
  generated_by: Generated<'ai' | 'user' | 'template'>;
  is_active: Generated<boolean>;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: ColumnType<Date, never, never>;
}

export interface TrainingDaysTable {
  id: Generated<string>;
  plan_id: string;
  day_number: number;
  name: string;
  focus: string[] | null;
  sort_order: number;
}

export interface TrainingDayExercisesTable {
  id: Generated<string>;
  training_day_id: string;
  exercise_id: string;
  sort_order: number;
  sets_prescribed: number;
  reps_min: number;
  reps_max: number;
  rpe_target: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface WorkoutSessionsTable {
  id: Generated<string>;
  user_id: string;
  training_day_id: string | null;
  checked_in_at: ColumnType<Date, Date, never>;
  checked_out_at: Date | null;
  duration_minutes: ColumnType<number | null, never, never>;
  notes: string | null;
  fatigue_rating: number | null;
  total_volume_kg: number | null;
  total_sets: number | null;
  pr_count: Generated<number>;
}

export interface SetLogsTable {
  id: Generated<string>;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number | null;
  rpe_actual: number | null;
  rest_seconds: number | null;
  is_warmup: Generated<boolean>;
  is_pr: Generated<boolean>;
  logged_at: ColumnType<Date, Date, never>;
  days_since_last_session: number | null;
  session_fatigue_at_time: number | null;
}

export interface PersonalRecordsTable {
  id: Generated<string>;
  user_id: string;
  exercise_id: string;
  pr_type: '1rm' | '3rm' | '5rm' | '8rm' | '10rm' | 'max_reps';
  value: number;
  achieved_at: ColumnType<Date, Date, Date>;
  set_log_id: string | null;
}

export interface CardioLogsTable {
  id: Generated<string>;
  session_id: string;
  equipment_type: string;
  duration_minutes: number;
  distance_km: number | null;
  calories_burned: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  resistance_level: number | null;
  source: Generated<'manual' | 'ocr' | 'wearable'>;
  media_id: string | null;
  logged_at: ColumnType<Date, Date, never>;
}

// --------------- NUTRITION DOMAIN ---------------

export interface NutritionTargetsTable {
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  training_day_calories_bonus: Generated<number>;
  updated_at: ColumnType<Date, never, never>;
}

export interface MealLogsTable {
  id: Generated<string>;
  user_id: string;
  logged_at: ColumnType<Date, Date, Date>;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | null;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: Record<string, unknown> | null;
  source: Generated<'ai_estimate' | 'barcode' | 'manual'>;
}

// --------------- AI COACH DOMAIN ---------------

export interface ConversationsTable {
  id: Generated<string>;
  user_id: string;
  started_at: ColumnType<Date, never, never>;
  last_message_at: ColumnType<Date, never, never>;
  context_type: Generated<'general' | 'session' | 'plan_generation' | 'diet'>;
}

export interface MessagesTable {
  id: Generated<string>;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number | null;
  model: string | null;
  created_at: ColumnType<Date, never, never>;
}

// --------------- MEDIA DOMAIN ---------------

export interface MediaTable {
  id: Generated<string>;
  user_id: string;
  storage_key: string;
  cdn_url: string;
  mime_type: string;
  size_bytes: number;
  purpose: 'machine_ocr' | 'progress_photo' | 'food_photo';
  ocr_status: Generated<'pending' | 'processing' | 'complete' | 'failed'>;
  ocr_result: Record<string, unknown> | null;
  created_at: ColumnType<Date, never, never>;
}

// --------------- DATABASE INTERFACE ---------------

export interface Database {
  users: UsersTable;
  refresh_tokens: RefreshTokensTable;
  user_profiles: UserProfilesTable;
  body_metrics: BodyMetricsTable;
  exercises: ExercisesTable;
  training_plans: TrainingPlansTable;
  training_days: TrainingDaysTable;
  training_day_exercises: TrainingDayExercisesTable;
  workout_sessions: WorkoutSessionsTable;
  set_logs: SetLogsTable;
  personal_records: PersonalRecordsTable;
  cardio_logs: CardioLogsTable;
  nutrition_targets: NutritionTargetsTable;
  meal_logs: MealLogsTable;
  conversations: ConversationsTable;
  messages: MessagesTable;
  media: MediaTable;
}

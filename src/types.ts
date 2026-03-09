export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderate' | 'very_active';
export type Gender = 'male' | 'female' | 'other';
export type HealthCondition = 'diabetes' | 'hypertension' | 'allergies';
export type DietaryPreference = 'normal' | 'vegetarian' | 'halal' | 'gluten_free' | 'keto' | 'vegan';

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: Gender;
  healthConditions: HealthCondition[];
  goal: Goal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  dailyCalorieGoal: number;
  biologicalAge: number;
  onboarded: boolean;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  timestamp: number;
  imageUrl?: string;
  description?: string;
}

export interface WaterIntake {
  amount: number; // ml
  timestamp: number;
}

export interface AppState {
  profile: UserProfile;
  meals: Meal[];
  water: WaterIntake[];
}

export const INITIAL_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  age: 28,
  weight: 70,
  height: 175,
  gender: 'male',
  healthConditions: [],
  goal: 'maintain',
  activityLevel: 'lightly_active',
  dietaryPreference: 'normal',
  dailyCalorieGoal: 2450,
  biologicalAge: 28,
  onboarded: false,
};

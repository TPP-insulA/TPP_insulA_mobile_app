export type GlucoseProfile = 'hypo' | 'normal' | 'hyper';

export interface GlucoseReading {
  id?: string;
  value: number;
  timestamp: Date;
  notes?: string;
}

export interface GlucoseTarget {
  minTarget: number;
  maxTarget: number;
}

export interface MedicalInfo {
  diabetesType: 'type1';
  diagnosisDate: string;
  treatingDoctor: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  weight: number;
  height: number;
  glucoseProfile: GlucoseProfile;
  glucoseTarget?: GlucoseTarget;
  diagnosisDate: string;
  treatingDoctor?: string;
}
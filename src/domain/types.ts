export interface Drink {
  id: string;
  name: string;
  volume: number;
  abv: number;
  time: number;
  source: "manual" | "photo";
}

export interface Profile {
  height: number;
  weight: number;
  model: "male" | "female";
  limit: 0.2 | 0.5;
}

export interface AppData {
  version: 1;
  profile: Profile;
  drinks: Drink[];
}

export interface ScanResult {
  name: string | null;
  type: string | null;
  volume_ml: number | null;
  abv_percent: number | null;
  notes: string;
}

export interface CurveSegment {
  time: number;
  level: number;
  rate: number;
}

export interface BACCurve {
  events: number[];
  at: (time: number) => number;
}

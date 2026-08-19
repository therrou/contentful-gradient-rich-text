export type GradientMarkType =
  | 'gradient-sunset'
  | 'gradient-ocean'
  | 'gradient-mint'
  | 'gradient-berry';

export interface GradientPreset {
  markType: GradientMarkType;
  label: string;
  from: string;
  to: string;
  angle: number;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { markType: 'gradient-sunset', label: 'Sunset', from: '#f97316', to: '#ec4899', angle: 135 },
  { markType: 'gradient-ocean', label: 'Ocean', from: '#0ea5e9', to: '#6366f1', angle: 135 },
  { markType: 'gradient-mint', label: 'Mint', from: '#10b981', to: '#06b6d4', angle: 135 },
  { markType: 'gradient-berry', label: 'Berry', from: '#a855f7', to: '#ec4899', angle: 135 },
];

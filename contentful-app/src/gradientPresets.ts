import type { CSSProperties } from 'react';

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

const GRADIENT_MARK_TYPES: readonly string[] = GRADIENT_PRESETS.map((p) => p.markType);

export function isGradientMarkType(value: string): value is GradientMarkType {
  return GRADIENT_MARK_TYPES.includes(value);
}

export function gradientCss(preset: GradientPreset): CSSProperties {
  return {
    background: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  };
}

export function getPresetByMarkType(markType: GradientMarkType): GradientPreset {
  const preset = GRADIENT_PRESETS.find((p) => p.markType === markType);
  if (!preset) {
    throw new Error(`Unknown gradient mark type: ${markType}`);
  }
  return preset;
}

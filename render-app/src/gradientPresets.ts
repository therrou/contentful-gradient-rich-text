export type GradientMarkType =
  | 'gradient-sunset'
  | 'gradient-ocean'
  | 'gradient-mint'
  | 'gradient-berry';

export type HighlightMarkType =
  | 'highlight-sunset'
  | 'highlight-ocean'
  | 'highlight-mint'
  | 'highlight-berry';

export interface GradientPreset {
  markType: GradientMarkType;
  label: string;
  from: string;
  to: string;
  angle: number;
}

export interface HighlightPreset {
  markType: HighlightMarkType;
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

// Same tokens/colors as GRADIENT_PRESETS, exposed as their own preset set so
// highlight can be picked independently of any gradient-* mark.
export const HIGHLIGHT_PRESETS: HighlightPreset[] = GRADIENT_PRESETS.map((preset) => ({
  markType: `highlight-${preset.markType.replace('gradient-', '')}` as HighlightMarkType,
  label: preset.label,
  from: preset.from,
  to: preset.to,
  angle: preset.angle,
}));

import type { CSSProperties } from 'react';

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

const GRADIENT_MARK_TYPES: readonly string[] = GRADIENT_PRESETS.map((p) => p.markType);
const HIGHLIGHT_MARK_TYPES: readonly string[] = HIGHLIGHT_PRESETS.map((p) => p.markType);

// Modifier mark, not a preset of its own: it only has an effect when applied
// alongside one of the gradient-* marks above.
export const GRADIENT_ANIMATED_MARK_TYPE = 'gradient-animated' as const;

export function isGradientMarkType(value: string): value is GradientMarkType {
  return GRADIENT_MARK_TYPES.includes(value);
}

export function isHighlightMarkType(value: string): value is HighlightMarkType {
  return HIGHLIGHT_MARK_TYPES.includes(value);
}

export function gradientCss(preset: GradientPreset): CSSProperties {
  return {
    backgroundImage: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  };
}

// Same tokens as gradientCss (each preset's from/to/angle) — a background
// fill behind the text instead of a text-fill clip, so the text itself
// needs a solid, legible color rather than color:transparent. Accepts either
// preset shape since gradient and highlight presets share the same fields.
export function gradientHighlightCss(preset: GradientPreset | HighlightPreset): CSSProperties {
  return {
    backgroundImage: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
    color: '#ffffff',
    borderRadius: '0.2em',
    padding: '0 0.15em',
  };
}

export function getPresetByMarkType(markType: GradientMarkType): GradientPreset {
  const preset = GRADIENT_PRESETS.find((p) => p.markType === markType);
  if (!preset) {
    throw new Error(`Unknown gradient mark type: ${markType}`);
  }
  return preset;
}

export function getHighlightPresetByMarkType(markType: HighlightMarkType): HighlightPreset {
  const preset = HIGHLIGHT_PRESETS.find((p) => p.markType === markType);
  if (!preset) {
    throw new Error(`Unknown highlight mark type: ${markType}`);
  }
  return preset;
}

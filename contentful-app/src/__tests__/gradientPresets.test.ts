import { describe, it, expect } from 'vitest';
import {
  GRADIENT_PRESETS,
  HIGHLIGHT_PRESETS,
  gradientCss,
  gradientHighlightCss,
  isGradientMarkType,
  isHighlightMarkType,
} from '../gradientPresets';

describe('GRADIENT_PRESETS', () => {
  it('has exactly 4 presets with the expected mark types', () => {
    expect(GRADIENT_PRESETS.map((p) => p.markType)).toEqual([
      'gradient-sunset',
      'gradient-ocean',
      'gradient-mint',
      'gradient-berry',
    ]);
  });

  it('every preset uses a 135deg angle', () => {
    expect(GRADIENT_PRESETS.every((p) => p.angle === 135)).toBe(true);
  });
});

describe('gradientCss', () => {
  it('builds a background-clip:text style from a preset', () => {
    const preset = GRADIENT_PRESETS[0];
    const style = gradientCss(preset);
    expect(style.backgroundImage).toBe(`linear-gradient(135deg, ${preset.from}, ${preset.to})`);
    expect(style.WebkitBackgroundClip).toBe('text');
    expect(style.backgroundClip).toBe('text');
    expect(style.WebkitTextFillColor).toBe('transparent');
    expect(style.color).toBe('transparent');
  });
});

describe('isGradientMarkType', () => {
  it('accepts known gradient mark types', () => {
    expect(isGradientMarkType('gradient-sunset')).toBe(true);
  });

  it('rejects unknown strings', () => {
    expect(isGradientMarkType('bold')).toBe(false);
    expect(isGradientMarkType('gradient-nope')).toBe(false);
    expect(isGradientMarkType('highlight-sunset')).toBe(false);
  });
});

describe('HIGHLIGHT_PRESETS', () => {
  it('has exactly 4 presets with the expected mark types', () => {
    expect(HIGHLIGHT_PRESETS.map((p) => p.markType)).toEqual([
      'highlight-sunset',
      'highlight-ocean',
      'highlight-mint',
      'highlight-berry',
    ]);
  });

  it('reuses the same tokens/colors as the matching gradient preset', () => {
    expect(HIGHLIGHT_PRESETS[0].from).toBe(GRADIENT_PRESETS[0].from);
    expect(HIGHLIGHT_PRESETS[0].to).toBe(GRADIENT_PRESETS[0].to);
    expect(HIGHLIGHT_PRESETS[0].angle).toBe(GRADIENT_PRESETS[0].angle);
  });
});

describe('gradientHighlightCss', () => {
  it('builds a solid-background style from a preset', () => {
    const preset = HIGHLIGHT_PRESETS[0];
    const style = gradientHighlightCss(preset);
    expect(style.backgroundImage).toBe(`linear-gradient(135deg, ${preset.from}, ${preset.to})`);
    expect(style.color).not.toBe('transparent');
  });
});

describe('isHighlightMarkType', () => {
  it('accepts known highlight mark types', () => {
    expect(isHighlightMarkType('highlight-sunset')).toBe(true);
  });

  it('rejects unknown strings', () => {
    expect(isHighlightMarkType('bold')).toBe(false);
    expect(isHighlightMarkType('gradient-sunset')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { GRADIENT_PRESETS, gradientCss, isGradientMarkType } from '../gradientPresets';

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
    expect(style.background).toBe(`linear-gradient(135deg, ${preset.from}, ${preset.to})`);
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
  });
});

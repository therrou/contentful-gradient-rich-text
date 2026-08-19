import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  field: {
    getValue: vi.fn().mockReturnValue(undefined),
    setValue: vi.fn().mockResolvedValue(undefined),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
};

export { mockSdk };

import { useCallback, useState } from 'react';
import { getSharedStorageAdapter, type StorageAdapter } from '../../../adapters';

export interface GuideDismissed {
  readonly dismissed: boolean;
  readonly dismiss: () => void;
}

/** Whether the beginner guide was hidden on this device; persisted in user preferences. */
export function useGuideDismissed(adapter: StorageAdapter = getSharedStorageAdapter()): GuideDismissed {
  const [dismissed, setDismissed] = useState(() => adapter.getPreferences().flavorWheelGuideDismissed === true);

  const dismiss = useCallback(() => {
    setDismissed(true);
    adapter.updatePreferences({ flavorWheelGuideDismissed: true });
  }, [adapter]);

  return { dismissed, dismiss };
}

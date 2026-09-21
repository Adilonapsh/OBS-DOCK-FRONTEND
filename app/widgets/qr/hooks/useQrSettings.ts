'use client';

import { QR_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'qr-settings';

export const useQrSettings = createUseWidgetSettings(STORAGE_KEY, QR_DEFAULTS);

'use client';

import { CHAT_DEFAULTS } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'chat-settings';

export const useChatSettings = createUseWidgetSettings(STORAGE_KEY, CHAT_DEFAULTS);

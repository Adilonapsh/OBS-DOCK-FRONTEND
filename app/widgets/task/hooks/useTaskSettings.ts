'use client';

import { TASK_DEFAULTS, parseTasksParam } from '../config';
import { createUseWidgetSettings } from '../../_shared/hooks/useWidgetSettings';

const STORAGE_KEY = 'task-settings';

export const useTaskSettings = createUseWidgetSettings(STORAGE_KEY, TASK_DEFAULTS, {
  parseValue: (key, raw) => {
    if (key !== 'tasks') return undefined;
    const parsed = parseTasksParam(raw);
    return parsed ? { value: parsed } : { skip: true };
  },
});

import { api } from './api';

import type { NotificationSettings } from '../types/notification-settings';

export const notificationService = {
  getSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  updateSettings: async (
    settings: NotificationSettings
  ): Promise<void> => {
    await api.put('/notifications/settings', settings);
  },

  testNotifications: async (): Promise<void> => {
    await api.post('/notifications/test');
  },
};

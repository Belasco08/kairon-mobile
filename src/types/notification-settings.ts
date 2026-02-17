export interface NotificationSettings {
    emailNotifications: {
      newAppointments: boolean;
      cancellations: boolean;
      reminders: boolean;
      promotions: boolean;
      newsletter: boolean;
    };
    pushNotifications: {
      newAppointments: boolean;
      cancellations: boolean;
      reminders: boolean;
      updates: boolean;
    };
    smsNotifications: {
      reminders: boolean;
      confirmations: boolean;
    };
    appointmentReminders: {
      enabled: boolean;
      hoursBefore: number;
      method: 'email' | 'sms' | 'both';
    };
  }
  
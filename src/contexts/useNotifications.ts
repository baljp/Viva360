import React, { useContext } from 'react';
import type { NotificationContextType } from './NotificationContext';
import { NotificationContextStore } from './NotificationContextStore';

export const useNotifications = () => {
  const context = useContext(NotificationContextStore as React.Context<NotificationContextType>);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

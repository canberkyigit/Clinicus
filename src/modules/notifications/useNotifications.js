import { useCallback, useMemo } from 'react';
import { useAppData } from '../../shared/context/AppDataContext';
import { buildNotifications } from './data/buildNotifications';

export function useNotifications() {
  const { appointments, leaveRequests, specialRequests, inventory, transactions, readNotificationIds, markNotificationsRead } =
    useAppData();

  const notifications = useMemo(
    () => buildNotifications({ appointments, leaveRequests, specialRequests, inventory, transactions, readNotificationIds }),
    [appointments, leaveRequests, specialRequests, inventory, transactions, readNotificationIds]
  );
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = useCallback(
    () => markNotificationsRead(notifications.filter(n => !n.read).map(n => n.id)),
    [notifications, markNotificationsRead]
  );

  return { notifications, unreadCount, markRead: id => markNotificationsRead([id]), markAllRead };
}

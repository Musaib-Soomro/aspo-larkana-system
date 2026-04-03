import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ 
  badges: { complaints: 0, inspections: 0 },
  refresh: () => {},
  notify: () => {}
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState({ complaints: 0, inspections: 0 });

  const notify = useCallback((message, type = 'info') => {
    toast[type](message, {
      position: "bottom-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  }, []);

  const refresh = useCallback((silent = true) => {
    if (!user) return;
    api.get('/dashboard/summary')
      .then((res) => {
        const d = res.data.data;
        const newBadges = {
          complaints: d.active_complaints_count || 0,
          inspections: (d.inspections_overdue?.length || 0) + (d.inspections_due_this_month?.length || 0),
        };

        // If count increased and not first load, notify
        if (!silent) {
          if (newBadges.complaints > badges.complaints) {
            notify(`New active complaint registered.`, 'warning');
          }
          if (newBadges.inspections > badges.inspections) {
            notify(`New inspection dues detected.`, 'info');
          }
        }

        setBadges(newBadges);
      })
      .catch(() => {});
  }, [user, badges, notify]);

  useEffect(() => {
    refresh(true);
    // Refresh every 2 minutes
    const timer = setInterval(() => refresh(false), 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ badges, refresh, notify }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

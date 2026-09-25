import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import BottomNav from './BottomNav';
import DashboardPage from '../pages/DashboardPage';
import ReminderNewPage from '../pages/ReminderNewPage';
import ReminderDetailPage from '../pages/ReminderDetailPage';
import HistoryPage from '../pages/HistoryPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import SubscriptionsPage from '../pages/SubscriptionsPage';

export default function AppLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="min-h-screen bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
          }
        >
          <Routes location={location}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reminders/new" element={<ReminderNewPage />} />
            <Route path="/reminders/:id" element={<ReminderDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      <BottomNav />
    </>
  );
}
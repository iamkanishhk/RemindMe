import { Navigate, Route, Routes } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { config } from './env';
import AppLayout from './components/AppLayout';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import PhoneVerifiedGate from './components/PhoneVerifiedGate';
import SetupRequiredPage from './pages/SetupRequiredPage';
import SignInPage from './pages/SignInPage';
import SsoCallbackPage from './pages/SsoCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ReminderNewPage from './pages/ReminderNewPage';
import ReminderDetailPage from './pages/ReminderDetailPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionsPage from './pages/SubscriptionsPage';

export default function App() {
  return (
    <ToastProvider>
      {!config.clerkPublishableKey ? (
        <SetupRequiredPage />
      ) : (
        <ClerkProvider publishableKey={config.clerkPublishableKey}>
          <Routes>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sso-callback" element={<SsoCallbackPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<PhoneVerifiedGate />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/reminders/new" element={<ReminderNewPage />} />
                  <Route path="/reminders/:id" element={<ReminderDetailPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/subscriptions" element={<SubscriptionsPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClerkProvider>
      )}
    </ToastProvider>
  );
}
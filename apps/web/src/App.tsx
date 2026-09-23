import { Navigate, Route, Routes } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { config } from './env';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SetupRequiredPage from './pages/SetupRequiredPage';
import SignInPage from './pages/SignInPage';
import SsoCallbackPage from './pages/SsoCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ReminderNewPage from './pages/ReminderNewPage';
import ReminderEditPage from './pages/ReminderEditPage';
import ReminderDetailPage from './pages/ReminderDetailPage';
import PhoneNumbersPage from './pages/PhoneNumbersPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  if (!config.clerkPublishableKey) {
    return <SetupRequiredPage />;
  }

  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sso-callback" element={<SsoCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reminders/new" element={<ReminderNewPage />} />
            <Route path="/reminders/:id" element={<ReminderDetailPage />} />
            <Route path="/reminders/:id/edit" element={<ReminderEditPage />} />
            <Route path="/phone-numbers" element={<PhoneNumbersPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ClerkProvider>
  );
}
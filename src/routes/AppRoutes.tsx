import { Route, Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import ConsolePage from '../pages/ConsolePage';
// import DashboardPage from '../pages/DashboardPage';
// import ProfilePage   from '../pages/ProfilePage';

export default function AppRoutes(): JSX.Element[] {
  return [
    // se visiti /app → redirect automatico a /app/console
    <Route index element={<Navigate to="console" replace />} key="index" />,

    // /app/console
    <Route path="console" element={<ConsolePage />} key="console" />,

    // in futuro:
    // <Route path="dashboard" element={<DashboardPage />} key="dashboard" />,
    // <Route path="profile"   element={<ProfilePage   />} key="profile"   />,
  ];
}

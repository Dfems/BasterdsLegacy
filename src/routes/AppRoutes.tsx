import { lazy, type JSX } from 'react'

import { Navigate, Route } from 'react-router-dom'

const ConsolePage = lazy(() => import('../pages/ConsolePage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const FilesPage = lazy(() => import('../pages/FilesPage'))
const BackupsPage = lazy(() => import('../pages/BackupsPage'))
const WhitelistPage = lazy(() => import('../pages/WhitelistPage'))
const ModpackPage = lazy(() => import('../pages/ModpackPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const CreateUserPage = lazy(() => import('../pages/CreateUserPage'))

// import DashboardPage from '../pages/DashboardPage';
// import ProfilePage   from '../pages/ProfilePage';

export default function AppRoutes(): JSX.Element[] {
  return [
    // se visiti /app → redirect automatico a /app/console
    <Route index element={<Navigate to="console" replace />} key="index" />,

    // /app/console
    <Route path="console" element={<ConsolePage />} key="console" />,
    <Route path="dashboard" element={<DashboardPage />} key="dashboard" />,
    <Route path="files" element={<FilesPage />} key="files" />,
    <Route path="backups" element={<BackupsPage />} key="backups" />,
    <Route path="whitelist" element={<WhitelistPage />} key="whitelist" />,
    <Route path="modpack" element={<ModpackPage />} key="modpack" />,
    <Route path="settings" element={<SettingsPage />} key="settings" />,
    <Route path="users/new" element={<CreateUserPage />} key="users-new" />,

    // in futuro:
    // <Route path="dashboard" element={<DashboardPage />} key="dashboard" />,
    // <Route path="profile"   element={<ProfilePage   />} key="profile"   />,
  ]
}

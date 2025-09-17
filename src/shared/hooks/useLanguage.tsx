import { useTranslation } from '@/shared/libs/i18n'

export default function useLanguage() {
  const { t, language, setLanguage, isLoading } = useTranslation()

  return {
    language,
    setLanguage,
    translations: { [language]: t },
    isLoading,
    // Aggiungo le proprietà direttamente per compatibilità
    home: t.home,
    common: t.common,
    ui: t.ui ?? ({} as NonNullable<typeof t.ui>),
    server: t.server,
    dashboard: t.dashboard,
    files: t.files,
    backups: t.backups,
    settings: t.settings,
    modpack: t.modpack,
    whitelist: t.whitelist,
    users: t.users,
    auth: t.auth,
    modal: t.modal,
    navigation: t.navigation,
    t, // Mantengo anche t per compatibilità
  }
}

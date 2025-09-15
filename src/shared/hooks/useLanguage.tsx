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
    ui: {
      modernInterface: 'Interfaccia Moderna',
      dashboard: 'Dashboard',
      overview: 'Panoramica',
      systemInfo: 'Info Sistema',
      quickActions: 'Azioni Rapide',
      recentActivity: 'Attività Recente',
      statistics: 'Statistiche',
      performance: 'Performance',
      monitoring: 'Monitoraggio',
      alerts: 'Avvisi',
      notifications: 'Notifiche',
      trends: 'Tendenze',
      analytics: 'Analytics',
      insights: 'Insights',
      metrics: 'Metriche',
      realTime: 'Tempo Reale',
      lastUpdated: 'Ultimo aggiornamento',
      autoRefresh: 'Aggiornamento automatico',
      refreshRate: 'Frequenza aggiornamento',
      viewDetails: 'Visualizza dettagli',
      expandCard: 'Espandi card',
      collapseCard: 'Comprimi card',
      toggleView: 'Cambia vista',
      filterData: 'Filtra dati',
      exportData: 'Esporta dati',
      shareView: 'Condividi vista'
    },
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
    t // Mantengo anche t per compatibilità
  }
}

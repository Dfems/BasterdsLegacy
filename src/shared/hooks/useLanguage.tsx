import { useTranslation } from '@/shared/libs/i18n'

// Hook backward compatible per non rompere il codice esistente
const useLanguage = () => {
  const { t, language, setLanguage } = useTranslation()

  // Adatta al formato precedente per retrocompatibilità
  const translations = {
    [language]: {
      // home
      appName: t.common.appName,
      title: t.home.title,
      welcomePart: t.home.welcomePart,
      instructions: t.home.instructions,
      configBtn: t.home.configBtn,
      launcherBtn: t.home.launcherBtn,
      donateBtn: t.home.donateBtn,
      footer: t.home.footer,

      // auth
      loginTitle: t.auth.loginTitle,
      passwordLabel: t.auth.passwordLabel,
      passwordIncorrect: t.auth.passwordIncorrect,

      // modal
      modalTitle: t.modal.title,
      modalNameLabel: t.modal.nameLabel,
      modalNamePlaceholder: t.modal.namePlaceholder,
      modalUsernameLabel: t.modal.usernameLabel,
      modalUsernamePlaceholder: t.modal.usernamePlaceholder,
      modalSubmitBtn: t.modal.submitBtn,
      modalCancelBtn: t.modal.cancelBtn,
      modalError: t.modal.error,

      // server
      commandLabel: t.server.commandLabel,
      consoleTitle: t.server.consoleTitle,
      consoleOutputTitle: t.server.consoleTitle, // Alias per compatibilità
      backToHome: t.server.backToHome,
      consoleLoginMessage: t.server.consoleLoginMessage,
    },
  }

  return {
    language,
    setLanguage,
    translations,
    // Garantisce che t non sia mai undefined
    t: translations[language]!,
    // Espone anche le sezioni strutturate per componenti che vogliono usare il nuovo formato
    common: t.common,
    navigation: t.navigation,
    home: t.home,
    auth: t.auth,
    modal: t.modal,
    server: t.server,
    dashboard: t.dashboard,
    files: t.files,
    backups: t.backups,
    settings: t.settings,
    modpack: t.modpack,
    whitelist: t.whitelist,
    users: t.users,
  }
}

export default useLanguage

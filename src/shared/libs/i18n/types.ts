import type { SupportedLanguage } from '@/shared/libs/constants/languages'

// Definiamo i tipi per le traduzioni in base alla struttura JSON
export type TranslationKey = {
  common: {
    appName: string
    login: string
    logout: string
    username: string
    password: string
    name: string
    email: string
    cancel: string
    submit: string
    save: string
    delete: string
    edit: string
    add: string
    remove: string
    search: string
    loading: string
    error: string
    success: string
    confirm: string
    refresh: string
    upload: string
    download: string
  }
  navigation: {
    home: string
    dashboard: string
    console: string
    settings: string
    files: string
    backups: string
    whitelist: string
    modpack: string
    users: string
    server: string
    storage: string
    gameplay: string
  }
  home: {
    title: string
    welcomePart: string
    instructions: string
    configBtn: string
    launcherBtn: string
    donateBtn: string
    footer: string
  }
  auth: {
    loginTitle: string
    passwordLabel: string
    passwordIncorrect: string
    usernameLabel: string
    loginButton: string
  }
  modal: {
    title: string
    nameLabel: string
    namePlaceholder: string
    usernameLabel: string
    usernamePlaceholder: string
    submitBtn: string
    cancelBtn: string
    error: string
  }
  server: {
    commandLabel: string
    consoleTitle: string
    backToHome: string
    consoleLoginMessage: string
  }
  dashboard: {
    title: string
    state: string
    cpu: string
    memory: string
    uptime: string
    actions: string
    start: string
    stop: string
    restart: string
    running: string
    stopped: string
    crashed: string
    unknown: string
    operationStarted: string
    operationError: string
  }
  files: {
    title: string
    up: string
    refresh: string
    loading: string
    loadError: string
    noItems: string
    folder: string
    rename: string
    delete: string
    newName: string
    confirmDelete: string
    name: string
    type: string
    size: string
    modified: string
    actions: string
  }
  backups: {
    title: string
    create: string
    restore: string
    download: string
    delete: string
    confirmDelete: string
    creating: string
    restoring: string
    noBackups: string
  }
  settings: {
    title: string
    save: string
    reset: string
    serverProperties: string
    worldSettings: string
    difficulty: string
    gamemode: string
    maxPlayers: string
  }
  modpack: {
    title: string
    upload: string
    install: string
    uninstall: string
    version: string
    description: string
    noModpacks: string
  }
}

// Tipo per le traduzioni caricate
export type LoadedTranslations = Record<SupportedLanguage, TranslationKey>

// Tipo per l'hook useTranslation
export type UseTranslationReturnType = {
  t: TranslationKey
  language: SupportedLanguage
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>
  isLoading: boolean
}

// Tipo per il contesto
export type I18nContextType = {
  language: SupportedLanguage
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>
  translations: Partial<LoadedTranslations>
  isLoading: boolean
  loadTranslations: (lang: SupportedLanguage) => Promise<void>
}

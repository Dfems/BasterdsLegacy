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
    loggedIn: {
      welcomeBack: string
      serverOverview: string
      quickActions: string
      systemInfo: string
      downloadSection: string
      cpu: string
      memory: string
      uptime: string
      goToDashboard: string
      goToConsole: string
      goToFiles: string
      serverRunning: string
      serverStopped: string
      lastRestart: string
    }
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
    serverStatus: string
    running: string
    stopped: string
    start: string
    stop: string
    restart: string
    clear: string
    send: string
    startingMessage: string
    stoppingMessage: string
    restartingMessage: string
    powerError: string
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
    systemMemory: string
    diskStorage: string
    tps: string
    tickTime: string
    playersOnline: string
    processMemory: string
    used: string
    free: string
    total: string
    utilized: string
    utilized_masculine: string
    notAvailable: string
    checkingSpace: string
    perfect: string
    good: string
    acceptable: string
    slow: string
    online: string
    offline: string
    rconRequired: string
    enableRcon: string
    rconEnabled: string
    rconEnableError: string
    restartRequired: string
    restartServer: string
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
    upload: string
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
    loading: string
    errorLoad: string
    sftp: {
      title: string
      description: string
      ssh: string
      user: string
    }
    theme: {
      title: string
      description: string
      system: string
      dark: string
      light: string
      current: string
    }
  }
  modpack: {
    title: string
    upload: string
    install: string
    uninstall: string
    version: string
    description: string
    noModpacks: string
    mode: string
    automatic: string
    manual: string
    loader: string
    mcVersion: string
    jarFileName: string
    jarPlaceholder: string
    jarHelp: string
    installing: string
    installAuto: string
    notes: string
    versionUnsupported: string
    versionInfo: string
    errorVersions: string
  }
  whitelist: {
    title: string
    username: string
    usernamePlaceholder: string
    addUser: string
    removeUser: string
    loading: string
    error: string
    noPlayers: string
  }
  users: {
    title: string
    createTitle: string
    showForm: string
    email: string
    password: string
    role: string
    roleUser: string
    roleViewer: string
    create: string
    creating: string
    created: string
    yes: string
    no: string
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

import type { SupportedLanguage } from '@/shared/libs/constants/languages'

// Definiamo i tipi per le traduzioni in base alla struttura JSON
export type TranslationKey = {
  common: {
    appName: string
    login: string
    logout: string
    admin: string
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
    uploadImage: string
    download: string
    status: string
    modpack: string
    loader: string
    created: string
    size: string
    actions: string
    id: string
    warning?: string
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
    guide?: {
      title: string
      step1Title: string
      step1Text: string
      step2Title: string
      step2Text: string
      step3Title: string
      step3Text: string
      step4Title: string
      step4Text: string
    }
    loggedIn: {
      welcomeBack: string
      serverOverview: string
      quickActions: string
      systemInfo: string
      downloadSection: string
      description?: string
      currentModpack?: string
      currentVersion: string
      modpackInstalled: string
      modpackNotFound: string
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
    consoleDescription: string
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
    controlsTitle: string
    controlsDescription: string
    consoleOutput: string
    commandPlaceholder: string
    consolePlaceholder: string
    noJarError: string
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
    headerTitle?: string
    headerDescription?: string
    up: string
    refresh: string
    loading: string
    loadingDir?: string
    connectionError?: string
    loadError: string
    noItems: string
    emptyHint: string
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
    systemFiles: string
    directories: string
    storage: string
    many: string
    manageable: string
    organized: string
    high: string
    ok: string
    navigationTitle: string
    navigationDescription: string
    uploadTitle: string
    uploadDescription: string
    contentsTitle: string
    open: string
    accessible: string
    readable: string
    tagDirectory: string
    tagFile: string
    emptyLabel: string
  }
  backups: {
    title: string
    headerTitle?: string
    headerDescription?: string
    create: string
    restore: string
    download: string
    delete: string
    confirmDelete: string
    creating: string
    restoring: string
    noBackups: string
    emptyHint?: string
    availableBackups?: string
    storageUsed?: string
    systemStatus?: string
    fullBackupTitle?: string
    fullBackupDescription?: string
    startFullBackup?: string
    worldBackupTitle?: string
    worldBackupDescription?: string
    startWorldBackup?: string
    ready?: string
    schedule: {
      title: string
      enabled: string
      disabled: string
      frequency: string
      mode: string
      time: string
      day: string
      status: string
      nextRun: string
      lastRun: string
      configuration: string
      presets: string
      custom: string
      enable: string
      disable: string
      save: string
      stateLabel?: string
      cronPatternLabel?: string
      preset: {
        disabled: string
        daily_3am: string
        daily_2am: string
        every_2_days: string
        every_3_days: string
        weekly_monday: string
        weekly_sunday: string
        triple_daily: string
      }
      frequency_options: {
        daily: string
        every_2_days: string
        every_3_days: string
        weekly: string
        custom: string
      }
      mode_options: {
        full: string
        world: string
      }
      day_options: {
        0: string
        1: string
        2: string
        3: string
        4: string
        5: string
        6: string
      }
      help: {
        frequency: string
        mode: string
        time: string
        day: string
        custom: string
      }
      validation: {
        timeRequired: string
        timeInvalid: string
        dayRequired: string
        cronRequired: string
        cronInvalid: string
      }
      messages: {
        loading: string
        updateSuccess: string
        updateError: string
        loadError: string
      }
    }
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
    headerDescription: string
    ownerOnlyTitle: string
    ownerOnlyDescription: string
    tabs: {
      overview: {
        title: string
        description: string
      }
      environment: {
        title: string
        description: string
      }
      ui: {
        title: string
        description: string
      }
      server: {
        title: string
        description: string
      }
      advanced: {
        title: string
        description: string
      }
    }
    environment: {
      title: string
      description: string
      javaBin: {
        label: string
        description: string
        placeholder: string
      }
      mcDir: {
        label: string
        description: string
        placeholder: string
      }
      backupDir: {
        label: string
        description: string
        placeholder: string
      }
      rcon: {
        title: string
        enabled: string
        host: {
          label: string
          placeholder: string
        }
        port: {
          label: string
          placeholder: string
        }
        password: {
          label: string
          placeholder: string
        }
      }
      logging: {
        title: string
        description: string
        level: {
          label: string
          description: string
          trace: string
          debug: string
          info: string
          warn: string
          error: string
          fatal: string
        }
        levels: {
          label: string
          description: string
          all: string
          trace: string
          debug: string
          info: string
          warn: string
          error: string
          fatal: string
        }
        dir: {
          label: string
          description: string
          placeholder: string
        }
        fileEnabled: {
          label: string
          description: string
        }
        retentionDays: {
          label: string
          description: string
          placeholder: string
        }
        maxFiles: {
          label: string
          description: string
          placeholder: string
        }
      }
      success: string
      error: string
      validationError: string
    }
    backgroundRotation: {
      title: string
      description: string
      toggle: string
      secondsLabel: string
      current: string
      enabled: string
      disabled: string
    }
    sftp: {
      title: string
      description: string
      ssh: string
      user: string
      commandLabel?: string
      exampleLabel?: string
      exampleSsh?: string
    }
    theme: {
      title: string
      description: string
      system: string
      dark: string
      light: string
      current: string
    }
    backgroundUpload: {
      title: string
      description: string
    }
    buttons: {
      title: string
      description: string
      launcher: {
        title: string
        visible: string
        path: { label: string; placeholder: string }
      }
      config: {
        title: string
        visible: string
        path: { label: string; placeholder: string }
      }
      modpack: {
        title: string
        name: { label: string; placeholder: string }
        version: { label: string; placeholder: string }
      }
    }
    overview: {
      java: string
      directories: string
      rconStatus: string
      connection: string
      disabled: string
      backup: string
      schedule: string
      retention: string
      retentionHelp?: string
      days: string
      weeks: string
    }
    advancedInfo?: {
      security: {
        title: string
        description: string
        authTitle: string
        authDescription: string
        permsTitle: string
        permsDescription: string
        backupsTitle: string
        backupsDescription: string
      }
      system: {
        title: string
        description: string
        osTitle: string
        osDescription: string
        javaTitle: string
        javaDescription: string
        processesTitle: string
        processesDescription: string
      }
      warning: {
        title: string
        stability: string
        backups: string
        contactAdmin: string
      }
    }
  }
  modpack: {
    managementTitle?: string
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
    loaderVersionPlaceholder: string
    mcVersionPlaceholder: string
    metaConfigTitle: string
    metaConfigDescription: string
    metaSavedOk?: string
    metaSavedError?: string
    metaHint?: string
    jarFileName: string
    jarPlaceholder: string
    jarHelp: string
    installing: string
    installAuto: string
    notes: string
    versionUnsupported: string
    versionInfo: string
    errorVersions: string
    installPrompt: string
    installSectionDescription?: string
    progressSectionDescription?: string
  }
  whitelist: {
    title: string
    headerTitle?: string
    headerDescription?: string
    username: string
    usernamePlaceholder: string
    addUser: string
    removeUser: string
    loading: string
    error: string
    noPlayers: string
    emptyHint?: string
    addPlayerTitle?: string
    addPlayerDescription?: string
    totalPlayers?: string
    whitelistSystem?: string
    serverStatus?: string
    populated?: string
    small?: string
    secure?: string
    authorizedPlayers?: string
    authorized?: string
    loadingData?: string
    connectionError?: string
    whitelistLabel?: string
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
  ui?: {
    modernInterface: string
    dashboard: string
    overview: string
    systemInfo: string
    quickActions: string
    recentActivity: string
    statistics: string
    performance: string
    monitoring: string
    alerts: string
    notifications: string
    trends: string
    analytics: string
    insights: string
    metrics: string
    realTime: string
    lastUpdated: string
    autoRefresh: string
    refreshRate: string
    viewDetails: string
    expandCard: string
    collapseCard: string
    toggleView: string
    filterData: string
    exportData: string
    shareView: string
    monitoringIntro?: string
    alertsIntro?: string
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

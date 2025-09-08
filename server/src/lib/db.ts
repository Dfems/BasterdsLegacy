import { PrismaClient } from '@prisma/client'

// Types for mock database operations
type FindUniqueOptions = {
  where?: {
    id?: string
    email?: string
  }
}

type CreateOptions = {
  data: {
    email: string
    passHash: string
    role: string
  }
}

type DeleteOptions = {
  where: {
    id: string
  }
}

type CommandHistoryCreateOptions = {
  data: {
    user: string
    command: string
  }
}

type BackupCreateOptions = {
  data: {
    name: string
    path: string
    size: number
  }
}

type SettingFindUniqueOptions = {
  where: {
    key: string
  }
}

type SettingUpsertOptions = {
  where: {
    key: string
  }
  create: {
    key: string
    value: string
  }
  update: {
    value: string
  }
}

// Configurazione Prisma con gestione automatica errori
let db: PrismaClient

try {
  db = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  })
  console.log('✅ Database Prisma connesso correttamente')
} catch (error) {
  console.error('❌ Errore connessione Prisma:', error)
  
  // Fallback a mock per sviluppo quando Prisma non è disponibile
  console.log('⚠️  Modalità fallback: usando mock database')
  
  const mockDb = {
    user: {
      findUnique: async (options: FindUniqueOptions) => {
        console.log('Mock DB: user.findUnique', options)
        if (options?.where?.email === 'admin@test.com') {
          return {
            id: 'mock-admin-id',
            email: 'admin@test.com',
            passHash: '$2b$10$6wgb8p3n3izo5F2lpQzgXub7u5sMXPHfYnb53i4Z0.wRSDEfQ6C3q', // password
            role: 'owner',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
        return null
      },
      count: async () => {
        console.log('Mock DB: user.count')
        return 1 // Simula che esiste almeno un utente
      },
      findMany: async () => {
        console.log('Mock DB: user.findMany')
        return []
      },
      create: async (data: CreateOptions) => {
        console.log('Mock DB: user.create', data)
        return { 
          id: `mock-${Date.now()}`, 
          createdAt: new Date(), 
          updatedAt: new Date(),
          ...data.data 
        }
      },
      delete: async (options: DeleteOptions) => {
        console.log('Mock DB: user.delete', options)
        return { id: options.where.id }
      }
    },
    commandHistory: {
      create: async (data: CommandHistoryCreateOptions) => {
        console.log('Mock DB: commandHistory.create', data)
        return { 
          id: `mock-cmd-${Date.now()}`, 
          ts: new Date(),
          ...data.data 
        }
      }
    },
    backup: {
      findMany: async () => {
        console.log('Mock DB: backup.findMany')
        return []
      },
      create: async (data: BackupCreateOptions) => {
        console.log('Mock DB: backup.create', data)
        return { 
          id: `mock-backup-${Date.now()}`, 
          createdAt: new Date(),
          ...data.data 
        }
      }
    },
    setting: {
      findUnique: async (options: SettingFindUniqueOptions) => {
        console.log('Mock DB: setting.findUnique', options)
        // Simula che non ci sia background impostato inizialmente
        return null
      },
      upsert: async (data: SettingUpsertOptions) => {
        console.log('Mock DB: setting.upsert', data)
        const resolved = {
          key: data.where.key,
          value: data.update?.value ?? data.create.value,
        }
        return resolved
      },
  deleteMany: async (options: { where?: { key?: string } }) => {
        console.log('Mock DB: setting.deleteMany', options)
        return { count: 1 }
      }
    }
  }
  
  // Cast to PrismaClient type for compatibility
  db = mockDb as unknown as PrismaClient
}

export { db }

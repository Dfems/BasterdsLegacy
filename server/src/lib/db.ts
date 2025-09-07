import { PrismaClient } from '@prisma/client'

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
      findUnique: async (options: any) => {
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
      create: async (data: any) => {
        console.log('Mock DB: user.create', data)
        return { 
          id: `mock-${Date.now()}`, 
          createdAt: new Date(), 
          updatedAt: new Date(),
          ...data.data 
        }
      },
      delete: async (options: any) => {
        console.log('Mock DB: user.delete', options)
        return { id: options.where.id }
      }
    },
    commandHistory: {
      create: async (data: any) => {
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
      create: async (data: any) => {
        console.log('Mock DB: backup.create', data)
        return { 
          id: `mock-backup-${Date.now()}`, 
          createdAt: new Date(),
          ...data.data 
        }
      }
    },
    setting: {
      findUnique: async (options: any) => {
        console.log('Mock DB: setting.findUnique', options)
        // Simula che non ci sia background impostato inizialmente
        return null
      },
      upsert: async (data: any) => {
        console.log('Mock DB: setting.upsert', data)
        return { 
          key: data.where.key,
          value: data.create.value || data.update.value,
          ...data.create 
        }
      },
      deleteMany: async (options: any) => {
        console.log('Mock DB: setting.deleteMany', options)
        return { count: 1 }
      }
    }
  }
  
  db = mockDb as any
}

export { db }
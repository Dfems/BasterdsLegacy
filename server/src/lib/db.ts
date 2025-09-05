// Mock temporaneo per sviluppo - Prisma non disponibile in questo ambiente
// import { PrismaClient } from '@prisma/client'

console.log('⚠️  Modalità sviluppo: usando mock database (Prisma non disponibile)')

// Mock semplificato delle operazioni database necessarie per lo sviluppo
const mockDb = {
  user: {
    findUnique: async (options: any) => {
      console.log('Mock DB: user.findUnique', options)
      // Utente di test per sviluppo
      if (options?.where?.email === 'admin@test.com') {
        return {
          id: 1,
          email: 'admin@test.com',
          passHash: '$2b$10$test.hash.for.development', // Hash per "password"
          role: 'admin'
        }
      }
      return null
    },
    findMany: async () => {
      console.log('Mock DB: user.findMany')
      return []
    }
  },
  auditLog: {
    create: async (data: any) => {
      console.log('Mock DB: auditLog.create', data)
      return { id: Date.now(), ...data.data }
    }
  }
}

export const db = mockDb as any
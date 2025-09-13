#!/usr/bin/env node

/**
 * Test script per verificare il sistema di logging
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

import { buildApp } from '../src/app.js'

async function testLogging() {
  console.log('🧪 Testing logging system...')
  
  const app = buildApp()
  
  try {
    // Test 1: Verifica che la directory dei log sia creata
    const logDir = './logs'
    console.log('📁 Checking log directory creation...')
    
    // Avvia il server per inizializzare il logging
    await app.ready()
    
    // Test 2: Verifica che i log vengano scritti
    console.log('📝 Testing log writing...')
    
    app.log.info('Test log message from integration test')
    app.log.warn('Test warning message')
    app.log.error('Test error message (this is intentional)')
    
    // Test 3: Test audit logging
    console.log('📋 Testing audit logging...')
    
    const { auditLog } = await import('../src/lib/audit.js')
    
    await auditLog({
      type: 'server',
      op: 'startup',
      details: { test: true, component: 'integration-test' }
    })
    
    await auditLog({
      type: 'job',
      name: 'test-job',
      op: 'start'
    })
    
    await auditLog({
      type: 'job',
      name: 'test-job',
      op: 'end',
      durationMs: 1500
    })
    
    // Dai un po' di tempo per scrivere i log
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Logging system test completed successfully!')
    console.log('📋 Check the following for logs:')
    console.log('   - Console output (should see structured logs)')
    console.log(`   - Log directory: ${path.resolve(logDir)}`)
    
    // Verifica se esiste il file di log
    try {
      const logFile = path.join(logDir, 'app.log')
      const stats = await fs.stat(logFile)
      console.log(`   - Log file exists: ${logFile} (${stats.size} bytes)`)
      
      // Leggi e mostra le ultime righe del log
      const content = await fs.readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')
      console.log('📄 Last few log entries:')
      lines.slice(-5).forEach((line, i) => {
        console.log(`   ${lines.length - 5 + i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`)
      })
    } catch (error) {
      console.log(`   - Log file not found or error: ${error}`)
    }
    
  } catch (error) {
    console.error('❌ Logging test failed:', error)
    process.exit(1)
  } finally {
    await app.close()
  }
}

// Esegui il test se questo script viene chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testLogging()
    .then(() => {
      console.log('🎉 All tests passed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error)
      process.exit(1)
    })
}
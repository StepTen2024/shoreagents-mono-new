/**
 * Screenshot Service Diagnostic Tool
 * Run this to check if screenshots will work in production
 */

const { screen, desktopCapturer, net } = require('electron')

async function runDiagnostic() {
  console.log('\n========================================')
  console.log('📸 SCREENSHOT SERVICE DIAGNOSTIC')
  console.log('========================================\n')

  const results = {
    passed: [],
    failed: [],
    warnings: []
  }

  // Test 1: Check if Electron modules are available
  console.log('1️⃣  Checking Electron modules...')
  try {
    if (!screen) throw new Error('screen module not available')
    if (!desktopCapturer) throw new Error('desktopCapturer module not available')
    if (!net) throw new Error('net module not available')
    
    console.log('   ✅ All Electron modules available')
    results.passed.push('Electron modules')
  } catch (error) {
    console.error('   ❌ Electron modules missing:', error.message)
    results.failed.push(`Electron modules: ${error.message}`)
  }

  // Test 2: Check if form-data package is installed
  console.log('\n2️⃣  Checking form-data package...')
  try {
    const FormData = require('form-data')
    if (typeof FormData !== 'function') {
      throw new Error('form-data is not a constructor')
    }
    console.log('   ✅ form-data package available')
    results.passed.push('form-data package')
  } catch (error) {
    console.error('   ❌ form-data package missing:', error.message)
    console.error('   → Run: npm install form-data')
    results.failed.push('form-data package missing')
  }

  // Test 3: Check if we can get display information
  console.log('\n3️⃣  Checking display detection...')
  try {
    const displays = screen.getAllDisplays()
    console.log(`   ✅ Detected ${displays.length} display(s)`)
    displays.forEach((display, index) => {
      console.log(`      Display ${index}: ${display.bounds.width}x${display.bounds.height}`)
    })
    results.passed.push(`${displays.length} display(s) detected`)
  } catch (error) {
    console.error('   ❌ Display detection failed:', error.message)
    results.failed.push('Display detection')
  }

  // Test 4: Try to capture a screenshot
  console.log('\n4️⃣  Testing screenshot capture...')
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 100, height: 100 }
    })
    
    if (sources.length === 0) {
      throw new Error('No screen sources found')
    }
    
    const image = sources[0].thumbnail
    if (!image || image.isEmpty()) {
      throw new Error('Screenshot image is empty')
    }
    
    const jpegBuffer = image.toJPEG(70)
    const sizeKB = (jpegBuffer.length / 1024).toFixed(1)
    
    console.log(`   ✅ Screenshot captured successfully (${sizeKB} KB)`)
    results.passed.push('Screenshot capture')
  } catch (error) {
    console.error('   ❌ Screenshot capture failed:', error.message)
    results.failed.push(`Screenshot capture: ${error.message}`)
  }

  // Test 5: Check FormData functionality
  console.log('\n5️⃣  Testing FormData creation...')
  try {
    const FormData = require('form-data')
    const formData = new FormData()
    const testBuffer = Buffer.from('test')
    
    formData.append('test', testBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    })
    
    const headers = formData.getHeaders()
    if (!headers['content-type']) {
      throw new Error('Headers not generated correctly')
    }
    
    console.log('   ✅ FormData works correctly')
    console.log(`      Content-Type: ${headers['content-type'].substring(0, 50)}...`)
    results.passed.push('FormData creation')
  } catch (error) {
    console.error('   ❌ FormData test failed:', error.message)
    results.failed.push('FormData creation')
  }

  // Test 6: Check if net.request is available
  console.log('\n6️⃣  Testing net.request...')
  try {
    if (typeof net.request !== 'function') {
      throw new Error('net.request is not a function')
    }
    
    console.log('   ✅ net.request is available')
    results.passed.push('net.request available')
  } catch (error) {
    console.error('   ❌ net.request not available:', error.message)
    results.failed.push('net.request')
  }

  // Test 7: Check Node.js version
  console.log('\n7️⃣  Checking Node.js version...')
  try {
    const version = process.version
    const major = parseInt(version.split('.')[0].substring(1))
    
    console.log(`   ℹ️  Node.js version: ${version}`)
    
    if (major < 18) {
      results.warnings.push(`Node.js version ${version} is old. Recommended: 20+`)
      console.log('   ⚠️  Consider upgrading to Node.js 20+')
    } else {
      console.log('   ✅ Node.js version is good')
      results.passed.push('Node.js version')
    }
  } catch (error) {
    console.error('   ❌ Could not check Node.js version')
  }

  // Summary
  console.log('\n========================================')
  console.log('📊 DIAGNOSTIC SUMMARY')
  console.log('========================================\n')

  console.log(`✅ Passed: ${results.passed.length}`)
  results.passed.forEach(item => console.log(`   • ${item}`))

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`)
    results.warnings.forEach(item => console.log(`   • ${item}`))
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`)
    results.failed.forEach(item => console.log(`   • ${item}`))
  }

  console.log('\n========================================')
  if (results.failed.length === 0) {
    console.log('✅ ALL CHECKS PASSED - Screenshots should work!')
    console.log('========================================\n')
    return true
  } else {
    console.log('❌ SOME CHECKS FAILED - Screenshots may not work')
    console.log('========================================\n')
    return false
  }
}

module.exports = { runDiagnostic }

// If run directly
if (require.main === module) {
  runDiagnostic().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}


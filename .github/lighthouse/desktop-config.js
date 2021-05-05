module.exports = {
  extends: 'lighthouse:default',
  settings: {
    emulatedFormFactor: 'desktop',
    throttling: { cpuSlowdownMultiplier: 2 }
  }
}

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    // Mantiene la convención del ejercicio (cypress/integration en lugar de cypress/e2e)
    specPattern: 'cypress/integration/**/*.spec.{js,ts}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});

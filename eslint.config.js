const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    { ignores: ['node_modules/', 'assets/', 'apps-script/'] },
    js.configs.recommended,
    {
        files: ['config.js', 'script.js', 'js/**/*.js', 'sw.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: { ...globals.browser, ...globals.serviceworker, module: 'readonly' }
        },
        rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }] }
    },
    {
        files: ['tests/**/*.js', 'eslint.config.js', 'tailwind.config.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node }
    }
];

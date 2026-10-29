import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', '.next', 'out', 'next-env.d.ts', '.cache', 'public/mapa/motor'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    // Los recorridos E2E son un script de Node en CommonJS (Playwright se carga con require).
    files: ['e2e/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // En las pruebas la aserción de no nulo es una afirmación sobre el dato de prueba, no una conversión insegura.
    files: ['**/*.test.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Nada de almacenamiento del navegador para datos de la app (ver src/security/no-storage.test.ts).
      'no-restricted-globals': ['error', 'localStorage', 'sessionStorage', 'indexedDB'],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);

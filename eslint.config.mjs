import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import antfu from '@antfu/eslint-config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import storybook from 'eslint-plugin-storybook';
import tailwind from 'eslint-plugin-tailwindcss';

export default antfu(
  {
    react: true,
    nextjs: true,
    typescript: true,

    // Configuration preferences
    lessOpinionated: true,
    isInEditor: false,

    // Code style
    stylistic: {
      semi: true,
    },

    // Format settings
    formatters: {
      css: true,
    },

    // Ignored paths
    ignores: [
      'migrations/**/*',
      '**/*.md',
      'CLAUDE.md',
      'PRD.md',
      'README.md',
      '**/*_GUIDE.md',
      '**/*_COMPLETE.md',
      '**/*_NEEDED.md',
      '**/*_FIXES.md',
      '**/*_STATUS.md',
    ],
  },
  // --- Accessibility Rules ---
  jsxA11y.flatConfigs.recommended,
  // --- Tailwind CSS Rules ---
  ...tailwind.configs['flat/recommended'],
  {
    settings: {
      tailwindcss: {
        config: `${dirname(fileURLToPath(import.meta.url))}/src/styles/global.css`,
      },
    },
  },
  // --- E2E Testing Rules ---
  {
    files: [
      '**/*.spec.ts',
      '**/*.e2e.ts',
    ],
    ...playwright.configs['flat/recommended'],
  },
  // --- Storybook Rules ---
  ...storybook.configs['flat/recommended'],
  // --- Custom Rule Overrides ---
  {
    rules: {
      'antfu/no-top-level-await': 'off', // Allow top-level await
      'ts/consistent-type-definitions': ['error', 'type'], // Use `type` instead of `interface`
      'react/prefer-destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
      'node/prefer-global/process': 'off', // Allow using `process.env`
      'test/padding-around-all': 'error', // Add padding in test files
      'test/prefer-lowercase-title': 'off', // Allow using uppercase titles in test titles
      'no-console': 'off', // Allow console statements
      'no-alert': 'off', // Allow alert statements
      'node/prefer-global/buffer': 'off', // Allow Buffer usage
      'ts/no-use-before-define': 'off', // Allow function hoisting
      'jsx-a11y/click-events-have-key-events': 'off', // Disable accessibility click events
      'jsx-a11y/no-static-element-interactions': 'off', // Disable accessibility static elements
      'jsx-a11y/label-has-associated-control': 'off', // Disable label association
      'jsx-a11y/media-has-caption': 'off', // Disable media captions
      'curly': 'off', // Allow single-line if statements
      'import/no-mutable-exports': 'off', // Allow mutable exports
      'unused-imports/no-unused-vars': 'warn', // Downgrade to warning
      'style/multiline-ternary': 'off', // Allow single-line ternaries
      'style/brace-style': 'off', // Allow flexible brace styles
      'jsx-a11y/img-redundant-alt': 'off', // Allow redundant alt text
      'jsx-a11y/no-noninteractive-tabindex': 'off', // Allow tabindex on non-interactive elements
      'unicorn/prefer-number-properties': 'off', // Allow isNaN instead of Number.isNaN
      'ts/no-require-imports': 'off', // Allow require() imports
      'react/no-nested-component-definitions': 'off', // Allow nested components
      'next/no-html-link-for-pages': 'off', // Allow <a> tags
      'react-hooks-extra/no-direct-set-state-in-use-effect': 'off', // Allow setState in useEffect
    },
  },
);

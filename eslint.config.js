/**
 * @fileoverview FlynCodes Universal Design - ESLint configuration file
 * @version 4
 * @date 2025-03-18
 * @author FlynCodes {@link https://flyn.codes|FlynCodes website}
 * @license Proprietary. All Rights Reserved © 2025 Flyn.
 * @description This file is for organisations, companies, non-profits, and projects FlynCodes is involved in, ensuring a universal and consistent approach with best practices across all projects.
 */

import neostandard from 'neostandard'
import globals from 'globals'

export default [
  ...neostandard(),
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        module: 'off',
        __dirname: 'off',
        __filename: 'off'
      }
    },
    rules: {
      'no-undef': 'error',
      semi: ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'dot-notation': 'error',
      strict: [
        'error',
        'global'
      ],
      'node/no-callback-literal': 'off',
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always'
        }
      ],
      'object-shorthand': [
        'error',
        'always'
      ],
      'prefer-destructuring': [
        'error',
        {
          object: true,
          array: true
        }
      ]
    }
  }
]

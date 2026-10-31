import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Convención del proyecto: el prefijo `_` marca un binding
    // intencionalmente sin uso (típicamente para excluirlo de un
    // destructuring con rest, o para ignorar parámetros no usados
    // de una firma). Se refleja aquí para no tener que recurrir a
    // `void x` en cada caso ni a eslint-disable puntuales.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Código generado por graphql-codegen: no se edita a mano y trae
    // directivas eslint-disable que ESLint marca como obsoletas.
    // Se excluye para que `pnpm lint` no dependa de su contenido ni de
    // que codegen las regenere.
    'src/graphql/generated/**',
  ]),
]);

export default eslintConfig;

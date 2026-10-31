import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/graphql/schema/**/*.graphql',
  documents: 'src/graphql/operations/**/*.graphql',

  generates: {
    './src/graphql/generated/': {
      preset: 'client',
      plugins: [],
    },

    // SDL empaquetado como string en un módulo TS para evitar `fs` en runtime.
    './src/graphql/generated/schema.ts': {
      plugins: [
        {
          add: {
            content: '// AUTO-GENERADO por graphql-codegen. No editar a mano.',
          },
        },
        {
          add: {
            content: 'export const typeDefs = /* GraphQL */ `',
          },
        },
        'schema-ast',
        {
          add: {
            placement: 'append',
            content: '`;',
          },
        },
      ],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;

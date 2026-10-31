export type ValidationDict = Record<string, unknown>;

/**
 * Convierte una clave de error ('name.min') en su texto traducido.
 * Puro: sirve en cliente, servidor y rutas API.
 * Si falta la traducción devuelve la propia clave, para que se note en pantalla.
 */
export function resolveError(
  dict: ValidationDict,
  key?: string,
): string | undefined {
  if (!key) return undefined;

  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) => (acc as ValidationDict | undefined)?.[part],
      dict,
    );

  return typeof value === 'string' ? value : key;
}

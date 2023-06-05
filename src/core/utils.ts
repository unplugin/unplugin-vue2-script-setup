import { camelize, capitalize } from '@vue/shared'

export const pascalize = (str: string) => capitalize(camelize(str))

export const isNotNil = <T>(value: T): value is NonNullable<T> => value != null

export function exhaustiveCheckReturnUndefined(_param: never) {
  return undefined as never
}

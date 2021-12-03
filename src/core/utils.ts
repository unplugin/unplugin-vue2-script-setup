import { camelize, capitalize } from '@vue/shared'

export const pascalize = (str: string) => capitalize(camelize(str))

export const isNotNil = <T>(value: T): value is NonNullable<T> => value != null

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const exhaustiveCheckReturnUndefined = (param: never) =>
  undefined as never

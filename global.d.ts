import {
  ComponentPropsOptions,
  ExtractPropTypes,
} from '@vue/composition-api'

export type ObjectEmitsOptions = Record<
string,
((...args: any[]) => any) | null
>

export type EmitsOptions = ObjectEmitsOptions | string[]

export type EmitsToProps<T extends EmitsOptions> = T extends string[]
  ? {
    [K in string & `on${Capitalize<T[number]>}`]?: (...args: any[]) => any
  }
  : T extends ObjectEmitsOptions
    ? {
      [K in string &
        `on${Capitalize<string & keyof T>}`]?: K extends `on${infer C}`
        ? T[Uncapitalize<C>] extends null
          ? (...args: any[]) => any
          : (
            ...args: T[Uncapitalize<C>] extends (...args: infer P) => any
              ? P
              : never
          ) => any
        : never
    }
    : {}

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

export type EmitFn<
  Options = ObjectEmitsOptions,
  Event extends keyof Options = keyof Options
> = Options extends Array<infer V>
  ? (event: V, ...args: any[]) => void
  : {} extends Options // if the emit is empty object (usually the default value for emit) should be converted to function
    ? (event: string, ...args: any[]) => void
    : UnionToIntersection<
    {
      [key in Event]: Options[key] extends (...args: infer Args) => any
        ? (event: key, ...args: Args) => void
        : (event: key, ...args: any[]) => void
    }[Event]
    >

declare global {
  /**
   * Vue `<script setup>` compiler macro for declaring component props. The
   * expected argument is the same as the component `props` option.
   *
   * Example runtime declaration:
   * ```js
   * // using Array syntax
   * const props = defineProps(['foo', 'bar'])
   * // using Object syntax
   * const props = defineProps({
   *   foo: String,
   *   bar: {
   *     type: Number,
   *     required: true
   *   }
   * })
   * ```
   *
   * Equivalent type-based decalration:
   * ```ts
   * // will be compiled into equivalent runtime declarations
   * const props = defineProps<{
   *   foo?: string
   *   bar: number
   * }>()
   * ```
   *
   * This is only usable inside `<script setup>`, is compiled away in the
   * output and should **not** be actually called at runtime.
   */
  // overload 1: runtime props w/ array
  export function defineProps<PropNames extends string = string>(
    props: PropNames[]
  ): Readonly<{ [key in PropNames]?: any }>
  // overload 2: runtime props w/ object
  export function defineProps<
    PP extends ComponentPropsOptions = ComponentPropsOptions
  >(props: PP): Readonly<ExtractPropTypes<PP>>
  // overload 3: typed-based declaration
  export function defineProps<TypeProps>(): Readonly<TypeProps>

  /**
   * Vue `<script setup>` compiler macro for declaring a component's emitted
   * events. The expected argument is the same as the component `emits` option.
   *
   * Example runtime declaration:
   * ```js
   * const emit = defineEmits(['change', 'update'])
   * ```
   *
   * Example type-based decalration:
   * ```ts
   * const emit = defineEmits<{
   *   (event: 'change'): void
   *   (event: 'update', id: number): void
   * }>()
   *
   * emit('change')
   * emit('update', 1)
   * ```
   *
   * This is only usable inside `<script setup>`, is compiled away in the
   * output and should **not** be actually called at runtime.
   */
  // overload 1: runtime emits w/ array
  export function defineEmits<EE extends string = string>(
    emitOptions: EE[]
  ): EmitFn<EE[]>
  export function defineEmits<E extends EmitsOptions = EmitsOptions>(
    emitOptions: E
  ): EmitFn<E>
  export function defineEmits<TypeEmit>(): TypeEmit

  /**
   * Vue `<script setup>` compiler macro for declaring a component's exposed
   * instance properties when it is accessed by a parent component via template
   * refs.
   *
   * `<script setup>` components are closed by default - i.e. varaibles inside
   * the `<script setup>` scope is not exposed to parent unless explicitly exposed
   * via `defineExpose`.
   *
   * This is only usable inside `<script setup>`, is compiled away in the
   * output and should **not** be actually called at runtime.
   */
  export function defineExpose(exposed?: Record<string, any>): void

  type NotUndefined<T> = T extends undefined ? never : T

  type InferDefaults<T> = {
    [K in keyof T]?: NotUndefined<T[K]> extends
    | number
    | string
    | boolean
    | symbol
    | Function
      ? NotUndefined<T[K]>
      : (props: T) => NotUndefined<T[K]>
  }

  type PropsWithDefaults<Base, Defaults> = Base &
  {
    [K in keyof Defaults]: K extends keyof Base ? NotUndefined<Base[K]> : never
  }

  /**
   * Vue `<script setup>` compiler macro for providing props default values when
   * using type-based `defineProps` decalration.
   *
   * Example usage:
   * ```ts
   * withDefaults(defineProps<{
   *   size?: number
   *   labels?: string[]
   * }>(), {
   *   size: 3,
   *   labels: () => ['default label']
   * })
   * ```
   *
   * This is only usable inside `<script setup>`, is compiled away in the output
   * and should **not** be actually called at runtime.
   */
  export function withDefaults<Props, Defaults extends InferDefaults<Props>>(
    props: Props,
    defaults: Defaults,
  ): PropsWithDefaults<Props, Defaults>
}

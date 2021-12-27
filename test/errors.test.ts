import { describe, expect, it, sinon } from 'vitest'
import { transform as t } from '../src'

describe('errors', () => {
  it('langs', () => {
    expect(() =>
      t(`
<script setup>
const a = 1
</script>

<script lang="ts">
export default {}
</script>
`, 'Lang.vue'))
      .toThrowError('<script setup> language must be the same as <script>')
  })

  it('defineProps', () => {
    expect(() =>
      t(`
<script setup>
defineProps()
const a = defineProps()
</script>
`, 'DefineProps.vue'))
      .toThrowError('duplicate defineProps() call')
  })

  it('top-level await', () => {
    expect(() =>
      t(`
<script setup>
defineProps()
await something()
</script>
`, 'TopLevel.vue'))
      .toThrowError('top-level await is not supported in Vue 2')

    expect(() =>
      t(`
<script setup>
defineProps()
const {data} = await something()
</script>
`, 'TopLevel.vue'))
      .toThrowError('top-level await is not supported in Vue 2')
  })

  it('ref sugar', () => {
    sinon.stub(console, 'warn')

    expect(() =>
      t(`
     const a = $ref(1)
     `, 'Ref.ts', { refTransform: true }))
      .toThrowError('$ref() bindings can only be declared with let')

    expect(() =>
      t(`
<script setup>
defineProps()
const a = async () => {
  await something()
}
</script>
`, 'App.vue'))
      .not.toThrow()

    sinon.restore()
  })
})

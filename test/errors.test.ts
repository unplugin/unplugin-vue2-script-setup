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
`))
      .toThrowError('<script setup> language must be the same as <script>')
  })

  it('defineProps', () => {
    expect(() =>
      t(`
<script setup>
defineProps()
const a = defineProps()
</script>
`))
      .toThrowError('duplicate defineProps() call')
  })

  it('top-level await', () => {
    expect(() =>
      t(`
<script setup>
defineProps()
await something()
</script>
`))
      .toThrowError('top-level await is not supported in Vue 2')

    expect(() =>
      t(`
<script setup>
defineProps()
const {data} = await something()
</script>
`))
      .toThrowError('top-level await is not supported in Vue 2')

    expect(() =>
      t(`
<script setup>
defineProps()
const a = async () => {
  await something()
}
</script>
`))
      .not.toThrow()
  })
})

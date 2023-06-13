import { describe, expect, it } from 'vitest'
import { transform } from '../src'

describe('filter native tags as vue components', () => {
  describe('no components output', () => {
    const cases: string[] = [
      `
      <script setup lang="ts">
      import Button from './DynamicStyle.vue';
      </script>
      
      <template>
        <button>{{ Button }}</button>
      </template>
      `,
      `
      <script setup lang="ts">
      import button from './DynamicStyle.vue';
      </script>
      
      <template>
        <Button>{{ button }}</Button>
      </template>
      `,
      `
      <script setup lang="ts">
      let p='hello'
      let Div='hello'
      </script>
      
      <template>
        <div>
          <p>{{ p }}</p>
          <Button>{{ Div }}</Button>
        </div>
      </template>
      `,
    ]

    for (const input of cases) {
      it(input, async () => {
        const result = await transform(input, 'Lang.vue', { reactivityTransform: true })
        expect(result?.code.includes('__sfc_main.components')).toEqual(false)
      })
    }
  })

  it('keep non-native components', async () => {
    const input = `
    <script setup lang="ts">
    import Button from './DynamicStyle.vue';
    import DynamicStyle from './DynamicStyle.vue';
    let p='hello'
    </script>
    
    <template>
      <dynamic-style/>
      <p>{{ p }}</p>
      <button>{{ Button }}</button>
    </template>
    `
    const result = await transform(input, 'Lang.vue', { reactivityTransform: true })
    expect(result?.code.includes('__sfc_main.components = Object.assign({\n  DynamicStyle\n}, __sfc_main.components);')).toEqual(true)
  })
})

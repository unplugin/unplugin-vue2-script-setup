import { describe, expect, it } from 'vitest'
import { transform } from '../src'

describe('filter native tags as vue components', () => {
  describe('no components output', () => {
    const cases: string[] = [
      `
      <script setup lang="ts">
      import button from './DynamicStyle.vue';
      </script>
      
      <template>
        <button>{{ Button }}</button>
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
      `
      <script setup lang="ts">
      let svg='hello'
      </script>
      
      <template>
        <div>
          <p>{{ svg }}</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.46 283.46">
            <defs>
              <style>
                .cls-1{fill:#231815;}
                @media (prefers-color-scheme: dark) { .cls-1{fill:#ffffff;} }
              </style>
            </defs>
            <path class="cls-1" d="M144.89,89.86c-33.46,0-54.44,14.56-66.14,26.76a86,86,0,0,0-23.69,58.94c0,22.64,8.81,43.48,24.8,58.67,15.7,14.92,36.9,23.14,59.68,23.14,23.81,0,46-8.49,62.49-23.91,17-15.9,26.37-37.93,26.37-62C228.4,120.37,185.94,89.86,144.89,89.86Zm.49,153.67a61.49,61.49,0,0,1-46.45-20.4c-12.33-13.76-18.85-32.64-18.85-54.62,0-20.7,6.07-37.67,17.57-49.07,10.11-10,24.39-15.62,40.19-15.74,19,0,35.22,6.56,46.76,19,12.6,13.58,19.27,34,19.27,58.95C203.87,224.39,174.49,243.53,145.38,243.53Z"/>
            <polygon class="cls-1" points="198.75 74.96 179.45 74.96 142.09 37.83 104.51 74.96 86.14 74.96 138.09 24.25 146.81 24.25 198.75 74.96"/>
          </svg>
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

  it('capitalized native tags as components', async () => {
    const input = `
    <script setup lang="ts">
    import Button from './DynamicStyle.vue';
    </script>
    
    <template>
      <Button>{{ Button }}</Button>
    </template>
    `
    const result = await transform(input, 'Lang.vue', { reactivityTransform: true })
    expect(result?.code.includes('__sfc_main.components = Object.assign({\n  Button\n}, __sfc_main.components);')).toEqual(true)
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

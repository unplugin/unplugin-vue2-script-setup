import { } from 'node:test'
import { describe, expect, it } from 'vitest'
import { scriptSetupRE } from '../src/core'

describe('transform filter', () => {
  describe('look for what needs to be converted by regular ', () => {
    const cases: string[] = [
      `<script  lang="tsx"
      setup>
      import HelloWorld from './HelloWorld.vue'
      </setup>`,
      '<script  lang="ts" setup>',
      `<script 
       lang="ts"
        setup>
        import HelloWorld from './HelloWorld.vue'
        </script>`,
        `<script 
        setup>
        import HelloWorld from './HelloWorld.vue'
        </script>`,
        `<script setup>
        import HelloWorld from './HelloWorld.vue'
        </script>`,
        `<script setup lang="tsx"      >
        import HelloWorld from './HelloWorld.vue'
        </script>
        `,
        `<script setup 
        lang="ts">
        import HelloWorld from './HelloWorld.vue'
        </script>
        `,
        `<script 
        setup 
                lang="ts">
        import HelloWorld from './HelloWorld.vue'
        </script>
                `,
       `<script setup 
                lang="ts">
         import HelloWorld from './HelloWorld.vue'
        </script>`,
    ]

    for (const input of cases) {
      it(input, () => {
        expect(scriptSetupRE.test(input)).toEqual(true)
      })
    }
  })

  describe('filter what is not needed by regular ', () => {
    const cases: string[] = [
      `<scriptlang="ts"
      setup>
      import HelloWorld from './HelloWorld.vue'
      </script>
      `,
      `<script lang="ts">
      import HelloWorld from './HelloWorld.vue'
      </script>`,
      `<script>
      import HelloWorld from './HelloWorld.vue'
      </script>
      `,
    ]

    for (const input of cases) {
      it(input, () => {
        expect(scriptSetupRE.test(input)).toEqual(false)
      })
    }
  })
})

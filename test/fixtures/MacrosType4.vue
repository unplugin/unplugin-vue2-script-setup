<script setup lang="ts">
type Test = number[]
withDefaults(
  defineProps<{ test: Test }>(),
  { test: () => [] },
)
</script>

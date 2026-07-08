<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'note' | 'warning' | 'terminal'
    title?: string
  }>(),
  {
    type: 'note',
    title: '',
  },
)

const label = computed(() => props.title || props.type)
</script>

<template>
  <aside class="content-callout" :data-type="type">
    <p class="content-callout-label">{{ label }}</p>
    <div class="content-callout-body">
      <slot />
    </div>
  </aside>
</template>

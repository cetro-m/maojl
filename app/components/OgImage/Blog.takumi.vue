<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'MAOJL.XYZ',
  description: '',
})
</script>

<template>
  <div class="w-full h-full flex flex-col justify-between p-[72px] bg-[#090b0f] text-[#e7ffe4] border-[16px] border-[#33403b]">
    <div class="flex text-[34px] text-[#75ff6a]">
      &gt;_ MAOJL.XYZ / LOGBOOK
    </div>
    <div class="flex flex-col">
      <h1 class="m-0 text-[76px] leading-none text-[#e7ffe4]">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-[28px] mb-0 text-[30px] text-[#91a09a]">
        {{ description }}
      </p>
    </div>
    <div class="flex text-[26px] text-[#5de4ff]">
      WHEN IN DOUBT, GREP IT.
    </div>
  </div>
</template>

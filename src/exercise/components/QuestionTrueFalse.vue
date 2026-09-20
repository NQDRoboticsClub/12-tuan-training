<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  result: { type: Boolean, default: null },
})
const emit = defineEmits(['ready'])

const keys = props.question.content.keys
const picks = ref(keys.map(() => null))

const allAnswered = computed(() => picks.value.every((v) => v !== null))
watch(allAnswered, (v) => emit('ready', v), { immediate: true })

function pick(i, value) {
  if (!props.locked) picks.value[i] = value
}

function btnClass(i, value) {
  const base = 'border-border text-muted-foreground'
  if (props.locked) {
    if (keys[i].answer === value) return 'border-green-400 bg-green-50 text-green-800'
    if (picks.value[i] === value) return 'border-red-400 bg-red-50 text-red-800'
    return `${base} opacity-60`
  }
  return picks.value[i] === value
    ? 'border-primary-400 bg-primary-50 text-primary-700'
    : `${base} hover:border-primary-300`
}

defineExpose({
  check: () => keys.every((k, i) => picks.value[i] === k.answer),
})
</script>

<template>
  <div class="space-y-3">
    <div v-for="(k, i) in keys" :key="i"
      class="course-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="whitespace-pre-wrap text-base font-semibold text-foreground">
        {{ k.content }}
      </p>

      <div class="flex shrink-0 gap-2">
        <button v-for="value in [true, false]" :key="String(value)" type="button" :disabled="locked"
          @click="pick(i, value)"
          class="w-20 rounded-xl border-2 border-b-4 px-3 py-2 text-sm font-bold transition-colors duration-150"
          :class="btnClass(i, value)">
          {{ value ? 'Đúng' : 'Sai' }}
        </button>
      </div>
    </div>
  </div>
</template>

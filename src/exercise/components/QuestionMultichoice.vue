<script setup>
import { ref, watch } from 'vue'
import { shuffle } from '../../lib/exerciseLogic'

const props = defineProps({
  question: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  result: { type: Boolean, default: null },
})
const emit = defineEmits(['ready'])

const choices = props.question.content.choices
const order = shuffle(choices.map((_, i) => i))
const selected = ref(null)

watch(selected, (v) => emit('ready', v !== null), { immediate: true })

function pick(i) {
  if (!props.locked) selected.value = i
}

function cardClass(i) {
  if (props.locked) {
    if (choices[i].answer) return 'border-green-400 bg-green-50 text-green-800'
    if (selected.value === i) return 'border-red-400 bg-red-50 text-red-800'
    return 'border-border opacity-60'
  }
  return selected.value === i
    ? 'border-primary-400 bg-primary-50 text-primary-700'
    : 'border-border hover:border-primary-300'
}

defineExpose({
  check: () => selected.value !== null && choices[selected.value].answer === true,
})
</script>

<template>
  <div class="space-y-3">
    <button v-for="i in order" :key="i" type="button" :disabled="locked" @click="pick(i)"
      class="w-full whitespace-pre-wrap rounded-2xl border-2 border-b-4 px-4 py-3.5 text-left text-base font-semibold transition-colors duration-150"
      :class="cardClass(i)">
      {{ choices[i].content }}
    </button>
  </div>
</template>

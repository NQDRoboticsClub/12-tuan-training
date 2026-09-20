<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { normalizeAnswer } from '../../lib/exerciseLogic'

const props = defineProps({
  question: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  result: { type: Boolean, default: null },
})
const emit = defineEmits(['ready'])

// [{ type: 'text', text } | { type: 'gap', gi, accepted: [...] }]
let gapCount = 0
const segments = props.question.content.text.map((seg) =>
  typeof seg === 'string'
    ? { type: 'text', text: seg }
    : { type: 'gap', gi: gapCount++, accepted: seg.answer }
)
const gaps = segments.filter((s) => s.type === 'gap')

const values = ref(gaps.map(() => ''))
const inputs = ref([])

const allFilled = computed(() => values.value.every((v) => v.trim() !== ''))
watch(allFilled, (v) => emit('ready', v), { immediate: true })

onMounted(() => inputs.value[0]?.focus())

const widthFor = (gap) => `${Math.max(5, ...gap.accepted.map((a) => a.length)) + 3}ch`

function isRight(gi) {
  const typed = normalizeAnswer(values.value[gi])
  return gaps[gi].accepted.some((a) => normalizeAnswer(a) === typed)
}

function inputClass(gi) {
  if (props.locked) {
    return isRight(gi)
      ? 'border-green-400 bg-green-50 text-green-800'
      : 'border-red-400 bg-red-50 text-red-800'
  }
  return 'border-border bg-transparent focus:border-primary-400'
}

defineExpose({ check: () => gaps.every((_, gi) => isRight(gi)) })
</script>

<template>
  <div class="space-y-4">
    <p class="whitespace-pre-wrap text-lg leading-[3rem] text-foreground">
      <template v-for="(seg, i) in segments" :key="i">
        <span v-if="seg.type === 'text'">{{ seg.text }}</span>
        <input v-else :ref="(el) => (inputs[seg.gi] = el)" v-model="values[seg.gi]" type="text" :readonly="locked"
          autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
          class="mx-1 rounded-lg border-2 border-b-4 px-2 py-1 text-center font-mono text-base text-foreground outline-none transition-colors"
          :class="inputClass(seg.gi)" :style="{ width: widthFor(seg) }" />
      </template>
    </p>

    <div v-if="locked && result === false" class="course-note rounded-2xl p-4">
      <p class="text-xs font-bold text-primary-700">✨ đáp án đúng</p>
      <p class="mt-1 font-mono text-sm">
        <span v-for="(g, i) in gaps" :key="i">
          <span v-if="i > 0"> · </span>{{ g.accepted.join(' / ') }}
        </span>
      </p>
    </div>
  </div>
</template>

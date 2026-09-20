<script setup>
import { ref, computed, watch } from 'vue'
import { shuffle, normalizeAnswer } from '../../lib/exerciseLogic'

const props = defineProps({
  question: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  result: { type: Boolean, default: null },
})
const emit = defineEmits(['ready'])

// [{ type: 'text', text } | { type: 'gap', gi, answer }]
let gapCount = 0
const segments = props.question.content.text.map((seg) =>
  typeof seg === 'string'
    ? { type: 'text', text: seg }
    : { type: 'gap', gi: gapCount++, answer: seg.answer }
)
const gaps = segments.filter((s) => s.type === 'gap')

// Word bank = every gap answer + the distractors in "unused".
const words = [...gaps.map((g) => g.answer), ...(props.question.content.unused ?? [])]
const order = shuffle(words.map((_, i) => i))

// slots[gi] = index into `words` (or null)
const slots = ref(gaps.map(() => null))
const used = computed(() => new Set(slots.value.filter((v) => v !== null)))

const allFilled = computed(() => slots.value.every((v) => v !== null))
watch(allFilled, (v) => emit('ready', v), { immediate: true })

function pickWord(id) {
  if (props.locked || used.value.has(id)) return
  const gi = slots.value.indexOf(null)
  if (gi !== -1) slots.value[gi] = id
}

function clearSlot(gi) {
  if (!props.locked) slots.value[gi] = null
}

// Desktop drag & drop (tapping works everywhere, including phones).
function onDragStart(e, id) {
  e.dataTransfer?.setData('text/plain', String(id))
}
function onDrop(e, gi) {
  if (props.locked) return
  const raw = e.dataTransfer?.getData('text/plain')
  const id = Number(raw)
  if (raw === '' || Number.isNaN(id) || used.value.has(id)) return
  slots.value[gi] = id
}

const isRight = (gi) =>
  slots.value[gi] !== null &&
  normalizeAnswer(words[slots.value[gi]]) === normalizeAnswer(gaps[gi].answer)

function slotClass(gi) {
  if (props.locked) {
    return isRight(gi)
      ? 'border-green-400 bg-green-50 text-green-800'
      : 'border-red-400 bg-red-50 text-red-800'
  }
  return slots.value[gi] === null
    ? 'border-dashed border-border bg-muted'
    : 'border-border bg-background hover:border-primary-300'
}

defineExpose({ check: () => gaps.every((_, gi) => isRight(gi)) })
</script>

<template>
  <div class="space-y-6">
    <p class="whitespace-pre-wrap text-lg leading-[3.25rem] text-foreground">
      <template v-for="(seg, i) in segments" :key="i">
        <span v-if="seg.type === 'text'">{{ seg.text }}</span>
        <button v-else type="button" @click="clearSlot(seg.gi)" @dragover.prevent @drop.prevent="onDrop($event, seg.gi)"
          class="mx-1 inline-flex h-10 min-w-[6rem] items-center justify-center rounded-xl border-2 border-b-4 px-3 align-middle font-mono text-base transition-colors"
          :class="slotClass(seg.gi)">
          {{ slots[seg.gi] === null ? '' : words[slots[seg.gi]] }}
        </button>
      </template>
    </p>

    <div class="flex flex-wrap gap-2">
      <button v-for="id in order" :key="id" type="button" :disabled="locked || used.has(id)"
        :draggable="!locked && !used.has(id)" @dragstart="onDragStart($event, id)" @click="pickWord(id)"
        class="rounded-xl border-2 border-b-4 px-3.5 py-2 font-mono text-sm font-semibold transition-colors"
        :class="used.has(id)
          ? 'select-none border-transparent bg-muted text-transparent'
          : 'border-border bg-background text-foreground hover:border-primary-300'">
        {{ words[id] }}
      </button>
    </div>

    <div v-if="locked && result === false" class="course-note rounded-2xl p-4">
      <p class="text-xs font-bold text-primary-700">✨ đáp án đúng</p>
      <p class="mt-1 font-mono text-sm">
        <span v-for="(g, i) in gaps" :key="i"><span v-if="i > 0"> · </span>{{ g.answer }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { shuffle, buildSorting, gradeSorting } from '../../lib/exerciseLogic'

const props = defineProps({
  question: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  result: { type: Boolean, default: null },
})
const emit = defineEmits(['ready'])

const { leaves, pattern, hasSwaps } = buildSorting(props.question.content.order)
const order = shuffle(leaves.map((l) => l.id))

// ids of the lines the learner has placed, top to bottom
const line = ref([])
const inBank = computed(() => order.filter((id) => !line.value.includes(id)))

watch(
  () => inBank.value.length === 0,
  (v) => emit('ready', v),
  { immediate: true }
)

function add(id) {
  if (!props.locked && !line.value.includes(id)) line.value.push(id)
}
function removeAt(i) {
  if (!props.locked) line.value.splice(i, 1)
}

// Desktop drag & drop from the bank into the answer area.
function onDragStart(e, id) {
  e.dataTransfer?.setData('text/plain', String(id))
}
function onDrop(e) {
  const raw = e.dataTransfer?.getData('text/plain')
  if (raw === undefined || raw === '') return
  add(Number(raw))
}

const zoneClass = computed(() => {
  if (props.locked) {
    return props.result ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
  }
  return 'border-border'
})

defineExpose({
  check: () =>
    gradeSorting(
      pattern,
      line.value.map((id) => leaves[id])
    ),
})
</script>

<template>
  <div class="space-y-5">
    <div class="min-h-[6rem] space-y-2 rounded-2xl border-2 border-dashed p-3 transition-colors" :class="zoneClass"
      @dragover.prevent @drop.prevent="onDrop">
      <p v-if="!line.length" class="py-5 text-center text-sm text-muted-foreground">
        Chạm vào các dòng bên dưới theo đúng thứ tự
      </p>

      <button v-for="(id, i) in line" :key="id" type="button" :disabled="locked" @click="removeAt(i)"
        class="flex w-full items-center gap-3 rounded-xl border-2 border-b-4 border-border bg-background px-3 py-2 text-left transition-colors"
        :class="locked ? '' : 'hover:border-primary-300'">
        <span class="w-5 shrink-0 text-xs font-bold text-muted-foreground">{{ i + 1 }}</span>
        <span class="whitespace-pre-wrap break-all font-mono text-sm text-foreground">{{ leaves[id].text }}</span>
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <button v-for="id in inBank" :key="id" type="button" :disabled="locked" :draggable="!locked"
        @dragstart="onDragStart($event, id)" @click="add(id)"
        class="w-full rounded-xl border-2 border-b-4 border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary-300">
        <span class="whitespace-pre-wrap break-all font-mono text-sm text-foreground">{{ leaves[id].text }}</span>
      </button>
    </div>

    <div v-if="locked && result === false" class="course-note rounded-2xl p-4">
      <p class="text-xs font-bold text-primary-700">✨ thứ tự đúng</p>
      <ol class="mt-2 space-y-1">
        <li v-for="l in leaves" :key="l.id" class="flex gap-3 font-mono text-sm">
          <span class="w-5 shrink-0 text-xs font-bold text-muted-foreground">{{ l.id + 1 }}</span>
          <span class="whitespace-pre-wrap break-all">{{ l.text }}</span>
        </li>
      </ol>
      <p v-if="hasSwaps" class="mt-2 text-xs text-muted-foreground">
        (Một số dòng trong cùng nhóm có thể đổi chỗ cho nhau.)
      </p>
    </div>
  </div>
</template>

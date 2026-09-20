<script setup>
import { computed, reactive, markRaw, watch } from 'vue'
import NestedPiece from './NestedPiece.vue'
import {
  buildNested,
  gradeNested,
  canonicalPlacement,
  blockLabel,
  shuffle,
} from '../../lib/exerciseLogic'

const props = defineProps({
  question: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  result: { type: Boolean, default: null },
})
const emit = defineEmits(['ready'])

const built = buildNested(props.question.content.root)
const pieces = markRaw(built.pieces)

// zoneId -> [pieceId]. 'root' is the big area at the top; every block has its own zones.
const placement = reactive({ root: [] })
for (const p of Object.values(pieces)) {
  if (p.kind === 'block') for (const z of p.zones) placement[z.zoneId] = []
}

const order = shuffle(Object.keys(pieces))
const inBank = computed(() => {
  const placed = new Set(Object.values(placement).flat())
  return order.filter((id) => !placed.has(id))
})

watch(
  () => inBank.value.length === 0,
  (v) => emit('ready', v),
  { immediate: true }
)

function placeIn(zoneId, pieceId) {
  if (props.locked || !placement[zoneId] || !inBank.value.includes(pieceId)) return
  placement[zoneId].push(pieceId)

  // Handy: after placing a block, the next piece goes inside it.
  const piece = pieces[pieceId]
  if (piece.kind === 'block' && piece.zones.length) ctx.active = piece.zones[0].zoneId
}

// Empty every zone of a block (and of the blocks inside it) -> pieces go back to the bank.
function clearZones(pieceId) {
  const piece = pieces[pieceId]
  if (piece.kind !== 'block') return
  for (const z of piece.zones) {
    const kids = placement[z.zoneId].splice(0)
    if (ctx.active === z.zoneId) ctx.active = 'root'
    kids.forEach(clearZones)
  }
}

const ctx = reactive({
  pieces,
  placement,
  active: 'root',
  locked: computed(() => props.locked),
  readonly: false,
  setActive(zoneId) {
    if (!props.locked) ctx.active = zoneId
  },
  remove(pieceId) {
    if (props.locked) return
    for (const zoneId of Object.keys(placement)) {
      const i = placement[zoneId].indexOf(pieceId)
      if (i !== -1) {
        placement[zoneId].splice(i, 1)
        break
      }
    }
    clearZones(pieceId)
  },
  dropOn(zoneId, e) {
    const id = e?.dataTransfer?.getData('text/plain')
    if (id) placeIn(zoneId, id)
  },
})

function onDragStart(e, id) {
  e.dataTransfer?.setData('text/plain', id)
}

// Read-only copy of one valid answer, shown after a wrong attempt.
const solutionCtx = computed(() => ({
  pieces,
  placement: canonicalPlacement(built),
  active: null,
  locked: true,
  readonly: true,
  setActive() {},
  remove() {},
  dropOn() {},
}))

const rootClass = computed(() => {
  if (props.locked) {
    return props.result ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
  }
  return ctx.active === 'root' ? 'border-primary-400 bg-primary-50' : 'border-border'
})

defineExpose({ check: () => gradeNested(built, placement) })
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-muted-foreground">
      Chạm vào vùng muốn điền (viền sáng lên), rồi chạm các mảnh bên dưới để đặt vào.
      Chạm mảnh đã đặt để lấy nó ra.
    </p>

    <!-- root area -->
    <div class="min-h-[6rem] cursor-pointer rounded-2xl border-2 border-dashed p-3 transition-colors" :class="rootClass"
      @click="ctx.setActive('root')" @dragover.prevent @drop.prevent="ctx.dropOn('root', $event)">
      <div class="flex flex-col items-start gap-1.5">
        <NestedPiece v-for="id in placement.root" :key="id" :piece-id="id" :ctx="ctx" />
      </div>
      <p v-if="!placement.root.length" class="py-5 text-center text-sm text-muted-foreground">
        Bắt đầu đặt các mảnh vào đây
      </p>
    </div>

    <!-- bank -->
    <div class="flex flex-wrap gap-2">
      <button v-for="id in inBank" :key="id" type="button" :disabled="locked" :draggable="!locked"
        @dragstart="onDragStart($event, id)" @click="placeIn(ctx.active, id)"
        class="rounded-xl border-2 border-b-4 border-border bg-background px-3 py-2 font-mono text-sm font-semibold text-foreground transition-colors hover:border-primary-300">
        {{ pieces[id].kind === 'text' ? pieces[id].text : blockLabel(pieces[id]) }}
      </button>
    </div>

    <!-- solution -->
    <div v-if="locked && result === false" class="course-note rounded-2xl p-4">
      <p class="mb-2 text-xs font-bold text-primary-700">✨ đáp án đúng</p>
      <div class="flex flex-col items-start gap-1.5">
        <NestedPiece v-for="id in solutionCtx.placement.root" :key="id" :piece-id="id" :ctx="solutionCtx" />
      </div>
    </div>
  </div>
</template>

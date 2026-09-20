<script setup>
// Renders one placed piece of a nested_dnd_sort question.
// - text piece  -> a small chip (tap to take it back)
// - block piece -> a frame with its static text and its drop zones (recursive)
import { computed } from 'vue'

const props = defineProps({
  pieceId: { type: String, required: true },
  ctx: { type: Object, required: true },
})

const piece = computed(() => props.ctx.pieces[props.pieceId])
const interactive = computed(() => !props.ctx.readonly && !props.ctx.locked)
const kids = (zoneId) => props.ctx.placement[zoneId] ?? []

function zoneClass(zoneId) {
  if (props.ctx.readonly) return 'border-transparent'
  return props.ctx.active === zoneId ? 'border-primary-400 bg-primary-50' : 'border-border'
}
</script>

<template>
  <!-- text chip -->
  <button v-if="piece.kind === 'text'" type="button" :disabled="!interactive" @click.stop="ctx.remove(pieceId)"
    class="rounded-lg border-2 border-b-4 border-border bg-background px-2.5 py-1 text-left font-mono text-xs text-foreground disabled:cursor-default"
    :class="interactive ? 'hover:border-primary-300' : ''">
    {{ piece.text }}
  </button>

  <!-- block frame -->
  <div v-else class="relative inline-flex max-w-full flex-col rounded-xl border-2 border-border bg-background py-1.5 pl-2.5"
    :class="interactive ? 'pr-7' : 'pr-2.5'">
    <button v-if="interactive" type="button" title="Lấy ra" @click.stop="ctx.remove(pieceId)"
      class="absolute right-1.5 top-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary-600">
      ✕
    </button>

    <div class="flex flex-wrap items-start gap-x-1 gap-y-1 font-mono text-sm text-foreground">
      <template v-for="(part, i) in piece.parts" :key="i">
        <span v-if="part.type === 'static'" class="whitespace-pre py-0.5">{{ part.text }}</span>

        <!-- forces the next item onto a new line -->
        <span v-else-if="part.type === 'newline'" class="h-0 basis-full" />

        <!-- drop zone -->
        <div v-else
          class="flex min-h-[2rem] min-w-[6rem] flex-col items-start gap-1 rounded-lg border-2 border-dashed px-1.5 py-1 transition-colors"
          :class="zoneClass(part.zoneId)" @click.stop="ctx.setActive(part.zoneId)" @dragover.prevent
          @drop.prevent.stop="ctx.dropOn(part.zoneId, $event)">
          <NestedPiece v-for="id in kids(part.zoneId)" :key="id" :piece-id="id" :ctx="ctx" />
          <span v-if="!kids(part.zoneId).length && !ctx.readonly" class="px-1 py-0.5 text-xs text-muted-foreground">
            đặt vào đây
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

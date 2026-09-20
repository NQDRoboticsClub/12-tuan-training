<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

import LiteYoutubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/style.css'


const TOTAL_WEEKS = 12

// lessons[week] = { loading, error, data: { videos, others, slides, unlocked } }
const lessons = reactive({})
const activeWeek = ref(1)

function emptyData() {
  return { videos: [], others: [], slides: null, unlocked: false }
}

async function loadLesson(week) {
  lessons[week] = { loading: true, error: false, data: emptyData() }
  try {
    const res = await fetch(`/12-tuan-training/documents/buoi${week}.json`)
    if (week == 1) {
      console.log(res);
    }
    if (!res.ok) throw new Error('missing')
    const data = await res.json()
    lessons[week] = { loading: false, error: false, data: { ...emptyData(), ...data } }
  } catch (e) {
    lessons[week] = { loading: false, error: true, data: emptyData() }
  }
}

onMounted(() => {
  for (let w = 1; w <= TOTAL_WEEKS; w++) loadLesson(w)
})

const currentLesson = computed(() => lessons[activeWeek.value])

function isUnlocked(week) {
  const l = lessons[week]
  return !!(l && !l.loading && l.data.unlocked)
}

function selectWeek(week) {
  if (isUnlocked(week)) activeWeek.value = week
}

function fileNameFromPath(path) {
  if (!path) return 'Tài liệu'
  return path.split('/').pop()
}
</script>

<template>
  <main class="course-grid min-h-screen">
    <div class="mx-auto max-w-5xl px-5 py-10">
      <!-- Header -->
      <header class="mb-10">
        <a href="/12-tuan-training/" class="mb-5 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl shadow-sm">
            <img src="/logo.jpg" alt="Web & Web App logo" class="h-full w-full object-cover" />
          </div>
          <div>
            <p class="font-bold text-primary-700"> Web & Web App </p>
          </div>
        </a>
        <h1 class="max-w-2xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Tài liệu từng buổi
        </h1>
      </header>

      <!-- Tabs -->
      <nav class="mb-8 flex gap-2 overflow-x-auto pb-2">
        <button v-for="week in TOTAL_WEEKS" :key="week" type="button" :disabled="!isUnlocked(week)"
          @click="selectWeek(week)"
          class="flex shrink-0 flex-col items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors duration-200"
          :class="activeWeek === week
            ? 'bg-primary-600 text-white shadow-sm'
            : isUnlocked(week)
              ? 'course-card text-foreground hover:text-primary-600'
              : 'course-card cursor-not-allowed text-muted-foreground opacity-50 grayscale'">
          <span> Buổi {{ String(week - 1).padStart(2, '0') }} </span>
          <span v-if="!isUnlocked(week)" class="text-[10px] font-medium"> 🔒 khoá </span>
        </button>
      </nav>

      <!-- Content -->
      <section v-if="currentLesson && currentLesson.loading"
        class="course-card p-8 text-center text-sm text-muted-foreground">
        Đang tải...
      </section>

      <section v-else-if="!isUnlocked(activeWeek)" class="course-card p-8 text-center">
        <p class="text-2xl">🔒</p>
        <p class="mt-2 text-sm font-semibold text-muted-foreground"> Buổi này chưa được mở khoá </p>
      </section>

      <section v-else class="space-y-10">
        <!-- Slides -->
        <div class="course-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="mb-1 text-xs font-bold uppercase tracking-wider text-primary-600"> Slides </p>
          </div>
          <a v-if="currentLesson.data.slides" :href="currentLesson.data.slides" target="_blank" rel="noopener"
            class="shrink-0 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90">
            Mở →
          </a>
          <p v-else class="text-sm text-muted-foreground"> Chưa có slide </p>
        </div>

        <!-- Videos -->
        <div>
          <div class="mb-4">
            <p class="text-xs font-bold uppercase tracking-wider text-primary-600"> Video </p>
          </div>
          <p v-if="!currentLesson.data.videos.length" class="text-sm text-muted-foreground"> Chưa có video </p>
          <div v-else class="flex gap-4 overflow-x-auto pb-2">
            <div v-for="videoId in currentLesson.data.videos" :key="videoId"
              class="course-card w-[280px] shrink-0 overflow-hidden p-2">
              <LiteYoutubeEmbed :id="videoId" class="rounded-lg w-[260px] h-[120px]" />
            </div>
          </div>
        </div>

        <!-- Others / documents -->
        <div>
          <div class="mb-4">
            <p class="text-xs font-bold uppercase tracking-wider text-primary-600"> Tài liệu khác </p>
          </div>
          <p v-if="!currentLesson.data.others.length" class="text-sm text-muted-foreground"> Chưa có tài liệu </p>
          <div v-else class="flex gap-4 overflow-x-auto pb-2">
            <a v-for="item in currentLesson.data.others" :key="item.path" :href="item.path" download
              class="course-card group flex w-[180px] shrink-0 flex-col items-center gap-2 p-5 text-center">
              <p class="text-sm font-semibold text-foreground transition-colors group-hover:text-primary-600">
                {{ item.name || fileNameFromPath(item.path) }}
              </p>
              <span class="text-xs font-semibold text-primary-600"> Tải xuống ↓ </span>
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
        Và chúng mình là... NQD Robotics Club🤖
      </footer>
    </div>
  </main>
</template>

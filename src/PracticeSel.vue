<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const TOTAL_WEEKS = 12
const lessons = reactive({})
const activeWeek = ref(1)
const currentLesson = computed(() => lessons[activeWeek.value])

const emptyData = () => ({ videos: [], others: [], slides: '', unlocked: false, exercises: [], files: [] })
async function loadLesson(week) {
  lessons[week] = { loading: true, error: false, data: emptyData() }
  try {
    const response = await fetch(`/12-tuan-training/documents/buoi${week}.json`)
    if (!response.ok) throw new Error('missing')
    lessons[week] = { loading: false, error: false, data: { ...emptyData(), ...(await response.json()) } }
  } catch {
    lessons[week] = { loading: false, error: true, data: emptyData() }
  }
}
onMounted(() => { for (let week = 1; week <= TOTAL_WEEKS; week++) loadLesson(week) })
const isUnlocked = (week) => !!lessons[week] && !lessons[week].loading && lessons[week].data.unlocked
const fileName = (file) => file.name || file.path?.split('/').pop() || 'Tài liệu'
const files = computed(() => currentLesson.value?.data.files?.length ? currentLesson.value.data.files : currentLesson.value?.data.others ?? [])
const exercises = computed(() => currentLesson.value?.data.exercises ?? [])
const exerciseId = (exercise) => typeof exercise === 'number' ? exercise : exercise.id ?? exercise.exercise_id
const exerciseName = (exercise) => typeof exercise === 'number' ? `Bài tập #${exercise}` : exercise.name || `Bài tập #${exerciseId(exercise)}`
const uploadUrl = computed(() => `/12-tuan-training/#/upload?lesson=${activeWeek.value}`)
</script>

<template>
  <main class="course-grid min-h-screen">
    <div class="mx-auto max-w-5xl px-5 py-10">
      <header class="mb-10"><a href="/12-tuan-training/" class="mb-5 flex items-center gap-3"><div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl shadow-sm"><img src="/logo.jpg" alt="Web & Web App logo" class="h-full w-full object-cover" /></div><p class="font-bold text-primary-700">Web & Web App</p></a><h1 class="text-3xl font-black tracking-tight sm:text-4xl">Bài tập thực hành</h1><p class="mt-2 text-sm text-muted-foreground">Chọn buổi học, mở bài tập hoặc tải file để làm và nộp bài.</p></header>
      <nav class="mb-8 flex gap-2 overflow-x-auto pb-2"><button v-for="week in TOTAL_WEEKS" :key="week" type="button" :disabled="!isUnlocked(week)" @click="activeWeek = week" class="flex shrink-0 flex-col items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold" :class="activeWeek === week ? 'bg-primary-600 text-white shadow-sm' : isUnlocked(week) ? 'course-card hover:text-primary-600' : 'course-card cursor-not-allowed text-muted-foreground opacity-50'"><span>Buổi {{ String(week).padStart(2, '0') }}</span><span v-if="!isUnlocked(week)" class="text-[10px] font-medium">🔒 khoá</span></button></nav>
      <section v-if="currentLesson?.loading" class="course-card p-8 text-center text-sm text-muted-foreground">Đang tải...</section>
      <section v-else-if="!isUnlocked(activeWeek)" class="course-card p-8 text-center"><p class="text-2xl">🔒</p><p class="mt-2 text-sm font-semibold text-muted-foreground">Buổi này chưa được mở khoá</p></section>
      <section v-else class="grid gap-5 md:grid-cols-2">
        <article class="course-card flex flex-col p-6"><p class="text-xs font-bold uppercase tracking-wider text-primary-600">Bài tập tương tác</p><h2 class="mt-2 text-xl font-black">Chọn bài để làm</h2><p class="mt-2 text-sm text-muted-foreground">Mở bài tập trực tiếp trên trình duyệt và nhận điểm sau khi hoàn thành.</p><div v-if="exercises.length" class="mt-5 space-y-2"><a v-for="exercise in exercises" :key="exerciseId(exercise)" :href="`/12-tuan-training/#/practice/exercise/${exerciseId(exercise)}`" class="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:border-primary-300 hover:text-primary-600"><span>{{ exerciseName(exercise) }}</span><span>→</span></a></div><div v-else class="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Chưa có bài tập cho buổi này.</div></article>
        <article class="course-card flex flex-col p-6"><p class="text-xs font-bold uppercase tracking-wider text-primary-600">File bài tập</p><h2 class="mt-2 text-xl font-black">Tải xuống và nộp bài</h2><div v-if="files.length" class="mt-5 space-y-2"><a v-for="file in files" :key="file.path" :href="file.path" download class="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:border-primary-300"><span class="truncate font-semibold">📄 {{ fileName(file) }}</span><span class="shrink-0 text-xs font-bold text-primary-600">Tải xuống ↓</span></a></div><div v-else class="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Chưa có file bài tập cho buổi này.</div><a :href="uploadUrl" class="mt-5 block rounded-xl bg-primary-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-primary-700">Đến trang nộp bài →</a></article>
      </section>
      <footer class="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">Và chúng mình là... NQD Robotics Club🤖</footer>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'

const API_BASE_URL = 'https://robotics-backend-ktby.onrender.com'
const EXERCISE_BASE = '/12-tuan-training/exercises'
const HOME_URL = '/12-tuan-training/'

const props = defineProps({ id: { type: [String, Number], default: null } })
const QUESTION_TYPES = {
  multichoice: () => import('./components/QuestionMultichoice.vue'),
  true_false: () => import('./components/QuestionTrueFalse.vue'),
  gap_text: () => import('./components/QuestionGapText.vue'),
  gap_dnd: () => import('./components/QuestionGapDnd.vue'),
  sorting: () => import('./components/QuestionSorting.vue'),
  nested_dnd_sort: () => import('./components/QuestionNestedDnd.vue'),
}
const components = reactive({})
const exerciseId = computed(() => props.id ?? window.location.hash.match(/exercise\/(\d+)/)?.[1])
const status = ref('loading')
const errorMessage = ref('')
const quiz = ref(null)
const index = ref(0)
const phase = ref('answering')
const result = ref(null)
const canCheck = ref(false)
const questionRef = ref(null)
const solved = ref(0)
const mistakes = ref(0)
const firstTry = reactive({})
const name = ref('')
const className = ref('')
const submitting = ref(false)
const scoreSent = ref(false)
const scoreError = ref('')

const questions = computed(() => quiz.value?.contents ?? [])
const current = computed(() => questions.value[index.value])
const currentType = computed(() => current.value && components[current.value.type])
const progress = computed(() => questions.value.length ? Math.round(solved.value / questions.value.length * 100) : 0)
const firstTryCorrect = computed(() => Object.values(firstTry).filter(Boolean).length)
const canSubmitScore = computed(() => name.value.trim() && className.value.trim())

async function load() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    if (!/^\d+$/.test(String(exerciseId.value))) throw new Error('invalid')
    const response = await fetch(`${EXERCISE_BASE}/${exerciseId.value}.json`)
    if (!response.ok) throw new Error('missing')
    const data = await response.json()
    const contents = (data.contents ?? []).filter((question) => QUESTION_TYPES[question?.type])
    if (!contents.length) throw new Error('empty')
    quiz.value = { ...data, contents }
    index.value = 0
    phase.value = 'answering'
    result.value = null
    solved.value = 0
    mistakes.value = 0
    scoreSent.value = false
    name.value = ''
    className.value = ''
    Object.keys(firstTry).forEach((key) => delete firstTry[key])
    for (const type of new Set(contents.map((question) => question.type))) {
      if (!components[type]) components[type] = (await QUESTION_TYPES[type]()).default
    }
    status.value = 'playing'
  } catch {
    errorMessage.value = `Không tìm thấy bài tập #${exerciseId.value}.`
    status.value = 'error'
  }
}

function check() {
  if (phase.value !== 'answering' || !canCheck.value) return
  const correct = !!questionRef.value?.check()
  const questionId = current.value.questionId ?? index.value
  if (!(questionId in firstTry)) firstTry[questionId] = correct
  result.value = correct
  phase.value = 'checked'
  if (correct) solved.value++
  else mistakes.value++
}

function next() {
  if (phase.value !== 'checked') return
  if (index.value === questions.value.length - 1) status.value = 'finished'
  else {
    index.value++
    phase.value = 'answering'
    result.value = null
    canCheck.value = false
  }
}

async function submitScore() {
  if (!canSubmitScore.value || submitting.value) return
  submitting.value = true
  scoreError.value = ''
  try {
    const response = await fetch(`${API_BASE_URL}/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        class: className.value.trim(),
        exercise_id: Number(exerciseId.value),
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || data.error || 'Không thể gửi kết quả')
    scoreSent.value = true
  } catch (error) {
    scoreError.value = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
  } finally {
    submitting.value = false
  }
}

watch(exerciseId, load)
onMounted(load)
</script>

<template>
  <main class="course-grid min-h-screen">
    <div class="mx-auto max-w-2xl px-5 py-8">
      <section v-if="status === 'loading'" class="course-card p-8 text-center text-sm text-muted-foreground">Đang tải bài tập...</section>
      <section v-else-if="status === 'error'" class="course-card p-8 text-center">
        <p class="text-3xl">😢</p><p class="mt-2 font-semibold text-muted-foreground">{{ errorMessage }}</p>
        <a :href="HOME_URL" class="mt-5 inline-block rounded-xl border border-border px-4 py-2 text-sm font-semibold">Về trang chủ</a>
      </section>

      <template v-else-if="status === 'playing'">
        <header class="mb-8 flex items-center gap-4">
          <a :href="HOME_URL" aria-label="Thoát" class="text-2xl font-bold text-muted-foreground">✕</a>
          <div class="h-4 flex-1 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary-600 transition-all" :style="{ width: `${progress}%` }" /></div>
          <span class="text-xs font-bold text-muted-foreground">{{ solved }}/{{ questions.length }}</span>
        </header>
        <div v-if="current" :key="current.questionId || index">
          <p class="mb-2 text-xs font-bold uppercase tracking-wider text-primary-600">{{ currentType ? current.type : '' }}</p>
          <div v-if="current.header?.questionHTML" class="mb-6 text-2xl font-black" v-html="current.header.questionHTML" />
          <h1 v-else class="mb-6 text-2xl font-black sm:text-3xl">{{ current.header?.question }}</h1>
          <img v-if="current.header?.img" :src="current.header.img" alt="" class="mb-6 max-h-64 rounded-xl object-contain" />
          <component :is="currentType" ref="questionRef" :question="current" :locked="phase === 'checked'" :result="result" @ready="canCheck = $event" />
        </div>
        <div class="mt-8 flex items-center justify-between rounded-xl border p-4" :class="result === true ? 'border-green-300 bg-green-50' : result === false ? 'border-red-300 bg-red-50' : 'border-border'">
          <span class="text-sm font-semibold">{{ phase === 'checked' ? (result ? 'Chính xác!' : 'Chưa đúng rồi!') : '' }}</span>
          <button type="button" @click="phase === 'answering' ? check() : next()" :disabled="phase === 'answering' && !canCheck" class="rounded-xl px-6 py-3 text-sm font-bold text-white" :class="phase === 'answering' && !canCheck ? 'cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary-600 hover:bg-primary-700'">{{ phase === 'answering' ? 'Kiểm tra' : 'Tiếp tục' }}</button>
        </div>
      </template>

      <section v-else class="space-y-5">
        <div class="course-card p-8 text-center"><div class="text-5xl">🎉</div><h1 class="mt-3 text-2xl font-black">Hoàn thành bài tập!</h1><p class="mt-2 text-sm text-muted-foreground">{{ quiz.name }}</p><div class="mt-6 grid grid-cols-3 gap-3"><div><b class="text-2xl">{{ questions.length }}</b><p class="text-xs text-muted-foreground">câu hỏi</p></div><div><b class="text-2xl text-primary-600">{{ firstTryCorrect }}</b><p class="text-xs text-muted-foreground">đúng lần đầu</p></div><div><b class="text-2xl">{{ mistakes }}</b><p class="text-xs text-muted-foreground">lần sai</p></div></div></div>
        <form v-if="!scoreSent" @submit.prevent="submitScore" class="course-card space-y-4 p-5"><p class="text-sm text-muted-foreground">Nhập họ tên và lớp để ghi nhận kết quả.</p><input v-model="name" required placeholder="Họ và tên" class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm" /><input v-model="className" required placeholder="Lớp" class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm" /><p v-if="scoreError" class="text-sm text-red-600">{{ scoreError }}</p><button :disabled="!canSubmitScore || submitting" class="w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-muted">{{ submitting ? 'Đang gửi...' : 'Nhận điểm' }}</button></form>
        <div v-else class="course-card p-8 text-center"><div class="text-4xl">✅</div><h2 class="mt-2 text-xl font-bold">Đã ghi nhận, {{ name }}!</h2><a :href="HOME_URL" class="mt-5 inline-block rounded-xl border border-border px-4 py-2 text-sm font-semibold">Về trang chủ</a></div>
      </section>
      <footer class="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">Và chúng mình là... NQD Robotics Club🤖</footer>
    </div>
  </main>
</template>

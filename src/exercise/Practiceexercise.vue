<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import QuestionMultichoice from './components/QuestionMultichoice.vue'
import QuestionTrueFalse from './components/QuestionTrueFalse.vue'
import QuestionGapText from './components/QuestionGapText.vue'
import QuestionGapDnd from './components/QuestionGapDnd.vue'
import QuestionSorting from './components/QuestionSorting.vue'
import QuestionNestedDnd from './components/QuestionNestedDnd.vue'

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const API_BASE_URL = 'https://robotics-backend-ktby.onrender.com'
const COMPLETE_URL = `${API_BASE_URL}/exercise/complete` // <- match this to your backend
const EXERCISE_BASE = '/12-tuan-training/exercises' // -> /12-tuan-training/exercises/<id>.json
const HOME_URL = '/12-tuan-training/'

const QUESTION_TYPES = {
  multichoice: { component: QuestionMultichoice, label: 'Trắc nghiệm' },
  true_false: { component: QuestionTrueFalse, label: 'Đúng hay sai' },
  gap_text: { component: QuestionGapText, label: 'Điền vào chỗ trống' },
  gap_dnd: { component: QuestionGapDnd, label: 'Chọn từ điền vào chỗ trống' },
  sorting: { component: QuestionSorting, label: 'Sắp xếp thứ tự' },
  nested_dnd_sort: { component: QuestionNestedDnd, label: 'Ghép cấu trúc' },
}

const PRAISES = ['Chính xác!', 'Đỉnh quá!', 'Giỏi lắm!', 'Quá đã!', 'Tuyệt vời!']

/* ------------------------------------------------------------------ */
/* Route: works with vue-router (props: true) or a plain #/ hash       */
/* ------------------------------------------------------------------ */

const props = defineProps({
  id: { type: [String, Number], default: null },
})

const readHashId = () => window.location.hash.match(/^#\/practice\/exercise\/(\d+)/)?.[1] ?? null
const hashId = ref(readHashId())
const onHashChange = () => (hashId.value = readHashId())
const exerciseId = computed(() => props.id ?? hashId.value)

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const status = ref('loading') // loading | error | playing | finished
const errorMessage = ref('')
const quiz = ref(null)

// The queue starts as every question in order. A wrong answer appends
// the same question again at the END of the queue.
const queue = ref([]) // [{ uid, qi, retry }]
const cursor = ref(0)
const phase = ref('answering') // answering | checked
const result = ref(null) // null | true | false
const canCheck = ref(false)
const solvedCount = ref(0)
const mistakes = ref(0)
const firstTry = reactive({}) // qi -> true/false
const showExit = ref(false)
const questionRef = ref(null)

let uidSeq = 0
let loadToken = 0

const questions = computed(() => quiz.value?.contents ?? [])
const total = computed(() => questions.value.length)
const current = computed(() => queue.value[cursor.value])
const currentQuestion = computed(() => (current.value ? questions.value[current.value.qi] : null))
const currentType = computed(() => QUESTION_TYPES[currentQuestion.value?.type])
const firstTryCorrect = computed(() => Object.values(firstTry).filter(Boolean).length)

const progress = computed(() => {
  if (status.value === 'finished') return 100
  return total.value ? Math.round((solvedCount.value / total.value) * 100) : 0
})

const praise = computed(() => PRAISES[(current.value?.uid ?? 0) % PRAISES.length])

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

async function load() {
  const token = ++loadToken
  status.value = 'loading'
  quiz.value = null

  const id = exerciseId.value
  if (id === null || !/^\d+$/.test(String(id))) {
    errorMessage.value = 'Đường dẫn bài tập không hợp lệ.'
    status.value = 'error'
    return
  }

  try {
    const res = await fetch(`${EXERCISE_BASE}/${id}.json`)
    if (!res.ok) throw new Error('missing')
    const data = await res.json()
    if (token !== loadToken) return

    const usable = (data.contents ?? []).filter((q) => {
      const ok = q && QUESTION_TYPES[q.type]
      if (!ok) console.warn('Skipping unsupported question:', q?.questionId, q?.type)
      return ok
    })
    if (!usable.length) throw new Error('empty')

    quiz.value = { ...data, contents: usable }
    start()
  } catch (e) {
    if (token !== loadToken) return
    errorMessage.value = `Không tìm thấy bài tập #${id}.`
    status.value = 'error'
  }
}

function start() {
  queue.value = questions.value.map((_, qi) => ({ uid: ++uidSeq, qi, retry: false }))
  cursor.value = 0
  phase.value = 'answering'
  result.value = null
  canCheck.value = false
  solvedCount.value = 0
  mistakes.value = 0
  for (const k of Object.keys(firstTry)) delete firstTry[k]
  showExit.value = false
  name.value = ''
  className.value = ''
  scoreSent.value = false
  scoreError.value = ''
  status.value = 'playing'
}

/* ------------------------------------------------------------------ */
/* Playing                                                             */
/* ------------------------------------------------------------------ */

function check() {
  if (status.value !== 'playing' || phase.value !== 'answering' || !canCheck.value) return

  const ok = !!questionRef.value?.check()
  const { qi } = current.value

  result.value = ok
  phase.value = 'checked'
  if (!(qi in firstTry)) firstTry[qi] = ok

  if (ok) {
    solvedCount.value++
  } else {
    mistakes.value++
    queue.value.push({ uid: ++uidSeq, qi, retry: true }) // redo at the end
  }
}

function next() {
  if (status.value !== 'playing' || phase.value !== 'checked') return

  if (cursor.value + 1 >= queue.value.length) {
    status.value = 'finished'
    return
  }
  cursor.value++
  phase.value = 'answering'
  result.value = null
  canCheck.value = false
}

function onKeydown(e) {
  if (status.value !== 'playing' || showExit.value) return
  if (e.key !== 'Enter' || e.isComposing || e.target?.tagName === 'BUTTON') return
  e.preventDefault()
  if (phase.value === 'answering') check()
  else next()
}

// Warn before a refresh / tab close wipes the progress.
function onBeforeUnload(e) {
  if (status.value === 'playing') {
    e.preventDefault()
    e.returnValue = ''
  }
}

/* ------------------------------------------------------------------ */
/* Finished: send name + class so the points can be added              */
/* ------------------------------------------------------------------ */

const name = ref('')
const className = ref('')
const submitting = ref(false)
const scoreSent = ref(false)
const scoreError = ref('')

const canSubmitScore = computed(() => name.value.trim() && className.value.trim())

async function submitScore() {
  if (!canSubmitScore.value || submitting.value) return

  submitting.value = true
  scoreError.value = ''

  try {
    const res = await fetch(COMPLETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        class: className.value.trim(),
        exercise: Number(exerciseId.value),
        total: total.value,
        firstTryCorrect: firstTryCorrect.value,
        mistakes: mistakes.value,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || data.error || 'Không thể gửi điểm')

    scoreSent.value = true
  } catch (err) {
    console.error('Submit score failed:', err)
    scoreError.value =
      err instanceof Error && err.message ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.'
  } finally {
    submitting.value = false
  }
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

watch(exerciseId, load)

onMounted(() => {
  window.addEventListener('hashchange', onHashChange)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
  load()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHashChange)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

/* ------------------------------------------------------------------ */
/* Bottom bar styling                                                  */
/* ------------------------------------------------------------------ */

const barClass = computed(() => {
  if (phase.value === 'checked') {
    return result.value
      ? 'border-green-300 bg-green-100 text-green-800'
      : 'border-red-300 bg-red-100 text-red-800'
  }
  return 'border-border bg-background'
})

const actionClass = computed(() => {
  if (phase.value === 'checked') {
    return result.value ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
  }
  return canCheck.value
    ? 'bg-primary-600 hover:bg-primary-700 text-white'
    : 'cursor-not-allowed bg-muted text-muted-foreground'
})
</script>

<template>
  <main class="course-grid min-h-screen" :class="status === 'playing' ? 'pb-[96px]' : ''">
    <div class="mx-auto flex max-w-2xl flex-col px-5 py-6" :class="status === 'playing' ? 'pb-32' : ''">

      <!-- Loading -->
      <section v-if="status === 'loading'" class="course-card my-auto p-8 text-center text-sm text-muted-foreground">
        Đang tải bài tập...
      </section>

      <!-- Error -->
      <section v-else-if="status === 'error'" class="course-card my-auto p-8 text-center">
        <p class="text-2xl">😢</p>
        <p class="mt-2 text-sm font-semibold text-muted-foreground">{{ errorMessage }}</p>
        <a :href="HOME_URL"
          class="mt-5 inline-block rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-300 hover:text-primary-600">
          Về trang chủ
        </a>
      </section>

      <!-- Playing -->
      <template v-else-if="status === 'playing'">
        <!-- Top bar: exit + progress -->
        <header class="mb-8 flex items-center gap-4">
          <button type="button" aria-label="Thoát" @click="showExit = true"
            class="shrink-0 text-2xl font-bold leading-none text-muted-foreground transition-colors hover:text-foreground">
            ✕
          </button>

          <div class="h-4 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" :aria-valuenow="progress"
            aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-full bg-primary-600 transition-all duration-500"
              :style="{ width: progress + '%' }" />
          </div>

          <span class="shrink-0 text-xs font-bold text-muted-foreground">{{ solvedCount }}/{{ total }}</span>
        </header>

        <!-- Question -->
        <Transition name="q" mode="out-in">
          <div :key="current.uid">
            <p class="mb-2 text-xs font-bold uppercase tracking-wider text-primary-600">
              <span v-if="current.retry">🔁 Làm lại · </span>{{ currentType.label }}
            </p>

            <div v-if="currentQuestion.header.questionHTML"
              class="mb-6 text-2xl font-black tracking-tight text-foreground"
              v-html="currentQuestion.header.questionHTML" />
            <h1 v-else class="mb-6 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {{ currentQuestion.header.question }}
            </h1>

            <img v-if="currentQuestion.header.img" :src="currentQuestion.header.img" alt=""
              class="mb-6 max-h-64 rounded-xl border border-border object-contain" />

            <component :is="currentType.component" ref="questionRef" :question="currentQuestion"
              :locked="phase === 'checked'" :result="result" @ready="canCheck = $event" />
          </div>
        </Transition>
      </template>

      <!-- Finished -->
      <section v-else class="my-auto space-y-5">
        <div class="course-card p-8 text-center">
          <div class="mb-3 text-5xl">🎉</div>
          <h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Hoàn thành bài tập!</h1>
          <p class="mt-2 text-sm text-muted-foreground">{{ quiz.name }}</p>

          <div class="mt-6 grid grid-cols-3 gap-3">
            <div class="rounded-xl border border-border p-3">
              <p class="text-2xl font-black text-foreground">{{ total }}</p>
              <p class="text-xs text-muted-foreground">câu hỏi</p>
            </div>
            <div class="rounded-xl border border-border p-3">
              <p class="text-2xl font-black text-primary-600">{{ firstTryCorrect }}</p>
              <p class="text-xs text-muted-foreground">đúng ngay lần đầu</p>
            </div>
            <div class="rounded-xl border border-border p-3">
              <p class="text-2xl font-black text-foreground">{{ mistakes }}</p>
              <p class="text-xs text-muted-foreground">lần làm sai</p>
            </div>
          </div>
        </div>

        <form v-if="!scoreSent" @submit.prevent="submitScore" class="space-y-4">
          <div class="course-note -rotate-1 rounded-2xl p-5 shadow-sm">
            <p class="text-xs font-bold text-primary-700">✨ cuối cùng</p>
            <p class="mt-2 text-sm leading-6">Cho mình xin họ tên và lớp để cộng điểm cho bạn nheeee</p>
          </div>

          <div class="course-card grid gap-4 p-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">Họ và tên</span>
              <input v-model="name" type="text" placeholder="VD: Nguyễn Thanh Huy"
                class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary-400" />
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">Lớp</span>
              <input v-model="className" type="text" placeholder="VD: 11TH"
                class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary-400" />
            </label>
          </div>

          <div v-if="scoreError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ scoreError }}
          </div>

          <button type="submit" :disabled="!canSubmitScore || submitting"
            class="w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors duration-200"
            :class="canSubmitScore && !submitting
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'cursor-not-allowed bg-muted text-muted-foreground'">
            {{ submitting ? 'Đang gửi...' : 'Nhận điểm' }}
          </button>
        </form>

        <div v-else class="course-card p-8 text-center">
          <div class="mb-3 text-4xl">✅</div>
          <h2 class="text-xl font-bold text-foreground">Đã ghi nhận, {{ name }}!</h2>
          <p class="mt-2 text-sm text-muted-foreground">Điểm của bạn đã được cộng.</p>
          <a :href="HOME_URL"
            class="mt-6 inline-block rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-300 hover:text-primary-600">
            Về trang chủ
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer v-if="status !== 'playing'"
        class="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
        Và chúng mình là... NQD Robotics Club🤖
      </footer>
    </div>

    <!-- Feedback / action bar (Duolingo style) -->
    <div v-if="status === 'playing'" class="fixed inset-x-0 bottom-0 z-20 border-t-2 transition-colors duration-200"
      :class="barClass" style="padding-bottom: env(safe-area-inset-bottom)">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-4">
        <div class="min-w-0">
          <template v-if="phase === 'checked'">
            <p class="text-lg font-black">{{ result ? praise : 'Chưa đúng rồi!' }}</p>
            <p v-if="!result" class="text-sm">Xem đáp án ở trên nha. Câu này sẽ quay lại ở cuối bài.</p>
          </template>
        </div>

        <button v-if="phase === 'answering'" type="button" :disabled="!canCheck" @click="check"
          class="shrink-0 rounded-xl px-8 py-3 text-sm font-bold shadow-sm transition-colors duration-200"
          :class="actionClass">
          Kiểm tra
        </button>
        <button v-else type="button" @click="next"
          class="shrink-0 rounded-xl px-8 py-3 text-sm font-bold shadow-sm transition-colors duration-200"
          :class="actionClass">
          Tiếp tục
        </button>
      </div>
    </div>

    <!-- Exit confirmation -->
    <div v-if="showExit" class="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div class="w-full max-w-sm rounded-2xl border border-border bg-background p-6 text-center shadow-lg">
        <p class="text-3xl">🥺</p>
        <h2 class="mt-2 text-lg font-bold text-foreground">Thoát thật hả?</h2>
        <p class="mt-1 text-sm text-muted-foreground">Tiến độ của bài này sẽ bị mất đó.</p>

        <div class="mt-5 space-y-2">
          <button type="button" @click="showExit = false"
            class="w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700">
            Ở lại làm tiếp
          </button>
          <a :href="HOME_URL"
            class="block w-full rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            Thoát
          </a>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.q-enter-active,
.q-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.q-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.q-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>

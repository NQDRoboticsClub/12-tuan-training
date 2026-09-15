<script setup>
import { ref } from "vue"

const name = ref('')
const session = ref('')
const assignment = ref('')
const className = ref('')
const link = ref('')
const files = ref([])
const isDragging = ref(false)
const fileInput = ref(null)
const submitted = ref(false)

const addFiles = (fileList) => {
  for (const file of fileList) {
    files.value.push(file)
  }
}

const onDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
}

const onPick = (e) => {
  if (e.target.files?.length) addFiles(e.target.files)
  e.target.value = ''
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const canSubmit = () => {
  return (
    name.value.trim() &&
    session.value &&
    assignment.value.trim() &&
    className.value &&
    (files.value.length || link.value.trim())
  )
}

const handleSubmit = () => {
  if (!canSubmit()) return

  // TODO: hook this up to actual upload endpoint
  submitted.value = true
}

const resetForm = () => {
  name.value = ''
  session.value = ''
  assignment.value = ''
  className.value = ''
  link.value = ''
  files.value = []
  submitted.value = false
}
</script>

<template>
  <main class="course-grid min-h-screen">
    <div class="mx-auto max-w-2xl px-5 py-10">

      <!-- Header -->
      <header class="mb-10">
        <a href="/12-tuan-training/" class="mb-5 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl shadow-sm">
            <img src="/logo.jpg" alt="Web & Web App logo" class="h-full w-full object-cover" />
          </div>

          <div>
            <p class="font-bold text-primary-700">Web & Web App</p>
          </div>
        </a>

        <h1 class="max-w-xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Nộp bài của bạn.
        </h1>
      </header>

      <!-- Success state -->
      <div v-if="submitted" class="course-card p-8 text-center">
        <div class="mb-4 text-4xl">🎉</div>

        <h2 class="text-xl font-bold text-foreground">
          Nhận bài rồi nè, {{ name }}!
        </h2>

        <p class="mt-2 text-sm text-muted-foreground">
          Lớp {{ className }} · Buổi {{ session }} · {{ assignment }}
          · {{ files.length }} file{{ link ? ' · kèm link' : '' }}
        </p>

        <button @click="resetForm"
          class="mt-6 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-300 hover:text-primary-600">
          Nộp bài khác
        </button>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">

        <!-- Cute note -->
        <div class="course-note -rotate-1 rounded-2xl p-5 shadow-sm">
          <p class="text-xs font-bold text-primary-700">
            ✨ trước tiên
          </p>

          <p class="mt-2 text-sm leading-6">
            Cho mình xin họ tên, lớp, buổi và bài nheeee
          </p>
        </div>

        <!-- Name & class -->
        <div class="course-card grid gap-4 p-5 sm:grid-cols-2">

          <!-- Name -->
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Họ và tên
            </span>

            <input v-model="name" type="text" placeholder="VD: Nguyễn Thanh Huy"
              class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary-400" />
          </label>

          <!-- Class (đã đổi thành input) -->
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Lớp
            </span>

            <input v-model="className" type="text" placeholder="VD: 11TH"
              class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary-400" />
          </label>

          <!-- Session -->
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Buổi
            </span>

            <select v-model="session"
              class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary-400">
              <option value="" disabled>
                Chọn buổi
              </option>

              <option v-for="i in 12" :key="i" :value="i">
                Buổi {{ i }}
              </option>
            </select>
          </label>

          <!-- Assignment -->
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Bài
            </span>

            <input v-model="assignment" type="text" placeholder="VD: Bài tập web"
              class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary-400" />
          </label>

        </div>

        <!-- Upload area -->
        <div class="course-card p-5">

          <p class="mb-3 text-xs font-semibold text-muted-foreground">
            File bài tập / project
          </p>

          <div @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop="onDrop"
            @click="fileInput.click()"
            class="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200"
            :class="isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-border hover:border-primary-300'
              ">
            <input ref="fileInput" type="file" multiple class="hidden" @change="onPick" />

            <div class="course-icon mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg">
              📤
            </div>

            <p class="text-sm font-semibold text-foreground">
              Kéo file vào đây
            </p>

            <p class="mt-1 text-xs text-muted-foreground">
              hoặc bấm vào để chọn file từ máy
            </p>
          </div>

          <!-- Selected files -->
          <ul v-if="files.length" class="mt-4 space-y-2">
            <li v-for="(file, i) in files" :key="i"
              class="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div class="flex min-w-0 items-center gap-2">
                <span class="course-topic shrink-0 rounded-md px-2 py-1 text-xs">
                  📄
                </span>

                <span class="truncate text-sm text-foreground">
                  {{ file.name }}
                </span>

                <span class="shrink-0 text-xs text-muted-foreground">
                  {{ formatSize(file.size) }}
                </span>
              </div>

              <button type="button" @click.stop="removeFile(i)"
                class="shrink-0 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary-600">
                Xoá
              </button>
            </li>
          </ul>

          <!-- Divider -->
          <div class="my-4 flex items-center gap-3">
            <div class="h-px flex-1 bg-border" />

            <span class="text-xs text-muted-foreground">
              hoặc
            </span>

            <div class="h-px flex-1 bg-border" />
          </div>

          <!-- Link -->
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Dán link (GitHub, Drive, Vercel...)
            </span>

            <input v-model="link" type="url" placeholder="https://..."
              class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary-400" />
          </label>

        </div>

        <!-- Submit -->
        <button type="submit" :disabled="!canSubmit()"
          class="w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors duration-200"
          :class="canSubmit()
            ? 'bg-primary-600 hover:bg-primary-700'
            : 'cursor-not-allowed bg-muted text-muted-foreground'
            ">
          Nộp bài
        </button>

      </form>

      <!-- Footer -->
      <footer class="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
        Và chúng mình là... NQD Robotics Club🤖
      </footer>

    </div>
  </main>
</template>

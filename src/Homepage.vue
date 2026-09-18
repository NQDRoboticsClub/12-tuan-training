<script setup>
import { currentWeek } from "@/global.js"
const resources = [
  {
    title: 'Tài liệu',
    description: 'Xem lại nội dung của từng buổi',
    icon: '📚',
    href: './#/documents'
  },
  {
    title: 'Luyện tập',
    description: 'Tự luyện để năng cao nâng lực:D',
    icon: '✏️',
    href: './#/practice'
  },
  {
    title: 'Nộp bài',
    description: 'Nộp bài / project của mình',
    icon: '📤',
    href: './#/upload'
  }
]

const roadmap = [
  {
    week: 1,
    title: 'Intro Webdev',
    topics: ['Browser', 'Server', 'HTTP', 'HTML / CSS / JS'],
    project: 'ko có btvn',
    expected: '18/09/2026'
  },
  {
    week: 2,
    title: 'HTML cơ bản',
    topics: ['Semantic HTML', 'Forms', 'Images', 'Tables'],
    project: 'Trang profile cơ bản',
    expected: '21/09/2026'
  },
  {
    week: 3,
    title: 'CSS cơ bản',
    topics: ['Box model', 'Flexbox', 'Grid', 'Position'],
    project: 'Trang trí profile',
    expected: '25/09/2026'
  },
  {
    week: 4,
    title: 'JavaScript',
    topics: ['Variables', 'Functions', 'Arrays', 'Objects'],
    project: 'Bài tập code',
    expected: '28/09/2026'

  },
  {
    week: 5,
    title: 'Async & APIs',
    topics: ['Promise', 'async / await', 'fetch', 'JSON'],
    project: 'Gọi một API mở',
    expected: '02/10/2026'

  },
  {
    week: 6,
    title: 'DOM',
    topics: ['querySelector', 'Elements', 'classList'],
    project: 'Chỉnh trang web với JS',
    expected: '05/10/2026'

  },
  {
    week: 7,
    title: 'Events & Forms',
    topics: ['Events', 'Forms', 'Validation'],
    project: 'Tạo một form đăng ký',
    expected: '09/10/2026'

  },
  {
    week: 8,
    title: 'HTML / CSS / JS Project',
    topics: ['Timer', 'GitHub', 'Deploy'],
    project: 'Làm một đồng hồ bấm giờ và deploy lên github page',
    expected: '14/10/2026'

  },
  {
    week: 9,
    title: 'Vue cơ bản',
    topics: ['Components', 'Template', 'ref()', 'Reactive data'],
    project: 'Làm một nút đếm',
    expected: '16/10/2026'

  },
  {
    week: 10,
    title: 'Vue tiếp tục',
    topics: ['Props', 'Events', 'v-if', 'v-for'],
    project: 'Tiếp tục website trước',
    expected: '21/10/2026'

  },
  {
    week: 11,
    title: 'Vue Project',
    topics: ['Components', 'State', 'GitHub', 'Vercel'],
    project: 'Làm một todo list và deploy lên vercel',
    expected: '23/10/2026'

  },
  {
    week: 12,
    title: 'Electron',
    topics: ['Chromium', 'Node.js', 'Windows', 'OS integration'],
    project: 'Biến một website thành app',
    expected: '28/10/2026'
  }
]

const getWeekStatus = (week) => {
  if (week === currentWeek) return 'active'
  if (week < currentWeek) return 'past'
  return 'upcoming'
}
</script>

<template>
  <main class="course-grid min-h-screen">
    <div class="mx-auto max-w-5xl px-5 py-10"> <!-- Header -->
      <header class="mb-10">
        <a href="/12-tuan-training/" class="mb-5 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center
    overflow-hidden rounded-xl shadow-sm">
            <img src="/logo.jpg" alt="Web & Web App logo" class="h-full w-full object-cover" />
          </div>
          <div>
            <p class="font-bold text-primary-700"> Web & Web App </p>
          </div>
        </a>
        <div class="grid items-center gap-8 md:grid-cols-[1fr_240px]">
          <div>
            <p class="mb-2 text-sm font-medium text-primary-600"> 👋 hello! </p>
            <h1 class="max-w-2xl text-4xl font-black tracking-tight text-foreground sm:text-5xl"> Học web để chuẩn bị
              cho project của mình. </h1>
            <p class="mt-4 max-w-xl text-base leading-7 text-muted-foreground"> 12 buổi, 2 buổi mỗi
              tuần</p>
          </div> <!-- Cute note -->
          <div class="course-note rotate-2 rounded-2xl p-5 shadow-sm">
            <p class="text-xs font-bold text-primary-700"> ✨ mục tiêu tối thiểu </p>
            <p class="mt-2 text-sm leading-6"> Build được một website và deploy được nó :3 </p>
          </div>
        </div>
      </header> <!-- Resources -->
      <section class="mb-14">
        <div class="mb-4">
          <h2 class="text-lg font-bold text-foreground"> Bắt đầu từ đây </h2>
          <p class="text-sm text-muted-foreground"> Những thứ sẽ dùng trong suốt training. </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-4"> <a v-for="item in resources" :key="item.title"
            :href="item.href" class="course-card group p-5">
            <div class="course-icon mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg"> {{ item.icon }}
            </div>
            <h3 class="font-bold text-foreground transition-colors group-hover:text-primary-600"> {{ item.title }} </h3>
            <p class="mt-1 text-sm leading-5 text-muted-foreground"> {{ item.description }} </p>
            <div class="mt-4 text-xs font-semibold text-primary-600"> Mở → </div>
          </a> </div>
      </section> <!-- Roadmap -->
      <section>
        <div class="mb-6 flex items-end justify-between">
          <div>
            <p class="mb-1 text-xs font-bold uppercase tracking-wider text-primary-600"> roadmap </p>
            <h2 class="text-2xl font-black text-foreground"> 12 tuần training </h2>
          </div> <span
            class="hidden rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 sm:block"> 2 buổi
            / tuần · ≤ 60 phút </span>
        </div> <!-- Timeline -->
        <div class="relative"> <!-- veuiz-presenterrtical line -->
          <div class="course-timeline absolute bottom-0 left-[23px] top-0 w-px" />
          <div class="space-y-4">
            <article v-for="week in roadmap" :key="week.week" class="relative pl-14">
              <div
                class="absolute left-0 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 text-sm font-black shadow-sm transition-colors duration-300"
                :class="getWeekStatus(week.week) === 'active'
                  ? 'course-week border-primary-100 bg-primary-600 text-white'
                  : 'border-muted bg-muted text-muted-foreground'">
                {{ String(week.week).padStart(2, '0') }}
              </div>
              <div class="course-card p-5 transition-all duration-300" :class="getWeekStatus(week.week) !== 'upcoming'
                ? 'opacity-100'
                : 'opacity-50 grayscale'">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="font-bold text-foreground"> {{ week.title }} </h3> <span v-if="week.week === 1" class="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold
                        text-primary-700"> BẮT ĐẦU
                      </span>
                      <span class="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                        DỰ KIẾN: {{ String(week.expected) }}
                      </span>
                      <span v-if="getWeekStatus(week.week) === 'active'"
                        class="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                        ĐANG Ở ĐÂY
                      </span>
                      <span v-if="getWeekStatus(week.week) === 'upcoming'"
                        class="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                        CHƯA TỚI
                      </span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2"> <span v-for="topic in week.topics" :key="topic"
                        class="course-topic rounded-md px-2 py-1 text-xs"> {{ topic }} </span> </div>
                  </div> <!-- Project -->
                  <div class="course-project shrink-0 rounded-xl px-4 py-3 sm:min-w-[180px]">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-primary-600"> ✨
                      cuối buổi </p>
                    <p class="mt-1 text-sm font-semibold text-primary-900 dark:text-primary-900"> {{ week.project }}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section> <!-- Footer -->
      <footer class="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
        Và chúng mình là... NQD Robotics Club🤖 </footer>
    </div>
  </main>
</template>

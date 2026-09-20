import { createRouter, createWebHashHistory } from "vue-router";
import Upload from "../Upload.vue";
import Homepage from "../Homepage.vue";
import Documents from "../Documents.vue";
import PracticeSel from "../PracticeSel.vue";
import PracticeExercise from "../exercise/Practiceexercise.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      name: "Homepage",
      component: Homepage,
    },
    {
      path: "/upload",
      name: "Upload",
      component: Upload,
    },
    {
      path: "/documents",
      name: "Documents",
      component: Documents,
    },
    {
      path: "/practice",
      name: "Practice",
      component: PracticeSel,
    },
    {
      path: "/practice/exercise/:id(\\d+)",
      name: "PracticeExercise",
      component: PracticeExercise,
      props: true,
    },
  ],
});

export default router;

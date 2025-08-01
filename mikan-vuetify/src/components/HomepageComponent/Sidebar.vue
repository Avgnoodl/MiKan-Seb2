<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    rail-width="90"
    @click="rail = false"
  > <!-- vuetify elements have a tiny rounded to it, so rounded-0 removes all of it. (makes it sharp) --->
    <v-card class="pa-3 fill-height rounded-0 unified-background">
      <v-card class="fill-height d-flex flex-column rounded-v1 sidebar page-background border-1 " flat>
        <div class="sidebar-content align-center">
          <v-list density="compact" nav>
            <v-list-item
              value="toggle"
              class="cursor-pointer rounded-xl sidebar-button"
              @click.stop="rail = !rail"
              :active="false"
            >
              <template #prepend>
                <v-icon size="24" class="icon-left-padding icon-grey">
                  {{ rail ? "mdi-menu" : "mdi-menu-open" }}
                </v-icon>
              </template>
              <v-list-item-title class="text-h6 font-weight-bold text-grey">
                MIKAN.AI
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider class=" divider-1" />

          <v-list density="compact" nav>
            <v-list-item
              class="rounded-xl sidebar-button"
              :to="{ path: '/AudioInput' }"
              exact
              :active="false"
            
            >
              <template #prepend>
                <v-icon size="24" class="icon-left-padding icon-grey"
                  >mdi-plus-circle-outline</v-icon
                >
              </template>
              <v-list-item-title class="text-grey">New Meeting</v-list-item-title>
            </v-list-item>

            <v-list-item
              class="rounded-xl sidebar-button"
              :to="{ path: '/ManagerReview' }"
              exact
              :active="false"
            >
              <template #prepend>
                <v-icon size="24" class="icon-left-padding icon-grey"
                  >mdi-file-sign</v-icon
                >
              </template>
              <v-list-item-title class="text-grey">Manager Review</v-list-item-title>
            </v-list-item>

            <v-list-item
              class="rounded-xl sidebar-button"
              :to="{ path: '/Kanban-2' }"
              exact
              :active="false"
            >
              <template #prepend>
                <v-icon size="24" class="icon-left-padding icon-grey "
                  >mdi-format-list-checkbox</v-icon
                >
              </template>
              <v-list-item-title class="text-grey">My Tasks</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider class="mx-2 divider-1" />

          <v-list density="compact" nav>
            <!-- Projects Header -->
            <v-list-item
              class="cursor-pointer rounded-xl sidebar-button"
              style="align-items: center; min-height: 48px"
              @click="isOpen = !isOpen"
            >
              <template #prepend>
                <v-icon size="24" class="icon-left-padding icon-grey"
                  >mdi-folder-outline</v-icon
                >
              </template>

              <v-list-item-title
                style="font-weight: bold; font-size: 1.125rem; line-height: 1.6"
                class="text-grey"
              >
                Projects
              </v-list-item-title>

              <template #append>
                <v-btn
                  icon="mdi-plus"
                  class="icon-grey"
                  variant="text"
                  density="compact"
                  @click.stop="createNewProject"
                />
              </template>
            </v-list-item>
            <!-- Project Items List (no transition) -->
            <div v-if="isOpen" class="px-0">
              <v-list-item
                v-for="proj in projectItems"
                :key="proj"
                class="rounded-xl sidebar-button"
                @click="handleClick(proj)"
                density="compact"
              >
                <div class="d-flex align-center" style="gap: 20px">
                  <v-icon  size="20" class="pl-5 icon-grey"
                    >mdi-circle-medium</v-icon
                  >
                  <v-list-item-title class="text-grey" v-if="!rail">{{ proj }}</v-list-item-title>
                </div>
              </v-list-item>
            </div>
          </v-list>
        </div>

        <div class="sidebar-footer ">
          <v-divider class="divider-1"/>
          <v-list>
            <v-list-item class="rounded-xl">
              <template #prepend>
                <v-icon size="24" class="icon-footer-padding icon-grey"
                  >mdi-account</v-icon
                >
              </template>

              <v-list-item-title class="text-grey">John Leider</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-card>
  </v-navigation-drawer>
  <CreateNewProjectDialog v-model="createNewProjectDialogFlag" @close-create-project-dialog="createNewProjectDialogFlag = false;" @project-created="handleNewProject"/>
</template>

<!-------------------------------------------SCRIPT---------------------------------------->

<script setup lang="ts">
import { ref, computed, defineEmits, watch } from "vue";
import { useRouter } from "vue-router";
import { boards } from "@/stores/boards";
import CreateNewProjectDialog from "@/components/HomepageComponent/CreateNewProjectDialog.vue";

const drawer = ref(true);
const rail = ref(true);
const isOpen = ref(false);
const emit = defineEmits<{
  (e: "select-project", name: string): void;
}>();
const projectItems = computed(() => boards.value.map((b) => b.title));
const router = useRouter();
const createNewProjectDialogFlag = ref(false);

function handleClick(name: string) {
  router.push({
    path: "/Kanban-3",
    query: { board: name },
  });
}

watch(rail, (newVal) => {
  if (newVal) {
    // Sidebar collapsed
    isOpen.value = false;
  } else {
    // Sidebar expanded
    isOpen.value = true;
  }
});

function createNewProject() {
  createNewProjectDialogFlag.value = true;
  console.log("Trigger create new project dialog/modal");
}

function handleNewProject(project: { id: number; title: string }) {
  boards.value.push({
    id: project.id,
    title: project.title,
    stages: [],
  });
}
</script>

<!-------------------------------------------STYLE---------------------------------------->

<style scoped>
.fill-height {
  height: 100%;
}




.sidebar-content {
  flex: 1;
}

.sidebar-footer {
  margin-top: auto;
  /* background-color: rgb(255, 255, 255);  //or whatever background you want */ 
}

.icon-left-padding {
  padding-left: 8px;
}

.icon-bullet-padding {
  padding-left: 8px;
}

.icon-footer-padding {
  padding-left: 8px;
}

.mikan-title {
  font-weight: bold;
  font-size: 1.125rem; /* ~18px, adjust as needed */
}

.project-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}


</style>

<template style="background:#fcfcfc;">
    <Sidebar></Sidebar>
<v-app class="grey lighten-4">
    <!--DEVELOPER MODE -->
        <v-app-bar v-if="showDevBar"  app fixed color="white" elevation="2">
        <v-toolbar-title>Developer Mode!!!</v-toolbar-title>

        <!-- Board filter -->
        <v-select
          v-model="selectedBoard"
          :items="boardOptions"
          label="Board"

          clearable
          dense
          hide-details
          style="max-width:200px"
          
        />

        <!-- Assignee filter -->
        <v-select
          v-model="selectedAssignee"
          :items="assigneeOptions"
          label="Assignee"
          clearable
          dense
          hide-details
          style="max-width:200px"
        />

        <v-spacer />

        <v-btn text @click="logData">Log Data</v-btn>
        <v-btn text @click="visitorMode = !visitorMode">
          {{ visitorMode ? 'Exit Visitor Mode' : 'Visitor Mode' }}
        </v-btn>
        <v-btn text @click="allowBoardReordering = !allowBoardReordering">
          {{ allowBoardReordering ? 'Lock Boards' : 'Reorder Boards' }}
        </v-btn>
        <v-btn text @click="allowStageCrossBoard = !allowStageCrossBoard">
          {{ allowStageCrossBoard ? 'Lock Stages' : 'Cross-Board Stages' }}
        </v-btn>
        <v-btn color="primary" @click="addBoard" :disabled="visitorMode">
          <v-icon left>mdi-plus</v-icon> Add Board
        </v-btn>
      </v-app-bar>
      
      <v-main  class="pa-0 unified-background">
      <!-- Top pill bar -->
  <div
    class="pa-3 rounded-v1 border-1 page-background d-flex align-center ma-3" 
  >
    <span class="text-h5 pl-1 me-4 text-grey">My Tasks</span>
    <v-spacer></v-spacer>
        <!-- Assignee filter (auto-selected on load) -->
        <v-select
      v-model="selectedAssignee"
      :items="assigneeOptions"
      label="Assignee"
      clearable
      variant="outlined"
      class="me-4 border-2 rounded-xl filter-button"
      density="compact"
      single-line
      hide-details
      style=" max-width:180px"
      :menu-props="{
          contentClass: 'rounded-v1 text-body-2',
          }"
    />

    <!-- Priority filter -->
    <v-select
      v-model="selectedPriority"
      :items="priorityOptions"
      label="Priority"
      clearable
      variant="outlined"
      density="compact"
      single-line
      hide-details
      class="me-4 border-2 rounded-xl filter-button"
      style=" max-width:180px"
      :menu-props="{
          contentClass: 'rounded-v1 text-body-2',
          }"
    />

    <!-- Due date filter -->
    <v-menu
      v-model="dueDateMenu"
      :close-on-content-click="false"
      dense hide-details

    >
      <template #activator="{ props }">
        <v-text-field
          v-model="formattedDate"
          label="Due Before"
          variant="outlined"
          class="me-4 border-2 rounded-xl filter-button"
          density="compact"
          single-line
          clearable hide-details
          v-bind="props"
          style="max-width:200px"
        />
      </template>
      <v-date-picker
        class="rounded-v1 text-body-2"
        v-model="selectedDueDate"
        @input="dueDateMenu = false"
        :min="tomorrowDate"
      />
    </v-menu>


  </div>


   <!-- SUGGESTION: Replace the fixed container+row with Vuetify App Bar -->


      <v-container fluid class="pa-0 pr-6">
        <!-- No boards at all -->
        <div v-if="boards.length === 0" class="text-center grey--text pa-4">
          No boards defined
        </div>

        <!-- Boards exist but filters removed everything -->
        <!-- <div v-else-if="filteredBoards.length === 0" class="text-center grey--text pa-4">
          No stages/tasks match your filters
        </div> -->

        <!-- 3) Show filtered boards -->
        <!-- SUGGESTION: Bind draggable to real `boards` and filter inside Board2.vue -->
        <draggable
          v-model="boards"
          item-key="id"
          :animation="150"
          
          class="d-flex flex-column"
          
          :disabled="visitorMode || !allowBoardReordering"
        >
          <template #item="{ element: board, index: bIndex }">

            <Board
              v-show="!selectedBoard || board.title === selectedBoard"
              :board="
                (selectedAssignee || selectedPriority || selectedDueDate)
                  ? {
                      ...board,
                      stages: board.stages
                        .map(sg => ({
                          ...sg,
                          tasks: sg.tasks.filter(t =>
                            // Assignee filter
                            (!selectedAssignee   || t.assignee === selectedAssignee) &&
                            // Priority filter
                            (!selectedPriority   || t.priority === selectedPriority) &&
                            // Due-before filter
                            (!selectedDueDate    || new Date(t.dueDate) <= new Date(selectedDueDate))
                          )
                        }))
                        .filter(sg => sg.tasks.length > 0)
                    }
                  : board
              "
              :boardIndex="bIndex"
              :visitorMode="visitorMode"
              :selectedAssignee="selectedAssignee"
              :allowStageCrossBoard="allowStageCrossBoard"
              @delete-board="deleteBoard"
              @rename-board="renameBoard"
              @add-stage="addStage"
              @add-task="addTask"
              @delete-task="deleteTask"
              @rename-stage="renameStage"
              @delete-stage="deleteStage"
              @open-task-dialog="openTaskDialog"
            />

          </template>
        </draggable>
        
      </v-container>

      <!-- TASK MODAL REPLACEMENT -->
      <TaskDetail
        v-model="isTaskDialogOpen"
        :task="selectedTask"
        :visitorMode="visitorMode"
        @save-task="handleTaskSave"
        @delete-task="confirmDeleteTask"
      />

    <!-- DELETE CONFIRMATION -->
    <v-dialog v-model="isDeleteConfirmOpen" max-width="500px">
      <v-card class="rounded-xl pa-4">
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>Are you sure you want to delete this task?</v-card-text>
        <v-card-actions>
          <v-btn text class="stage-button-cancel rounded-xl" @click="isDeleteConfirmOpen = false">Cancel</v-btn>
          <v-btn class="ml-3 stage-button-delete-dialog rounded-xl" @click="deleteTaskConfirmed">Yes, Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <Chatbot />
    </v-main>
  </v-app>
</template>
<script setup lang="ts">
import { ref,computed, watch } from 'vue'
import { boards } from '@/stores/boards'
import draggable from 'vuedraggable'
import Board from '@/components/MyTasksComponent/Board2-3.vue'
import TaskDetail from '@/components/MyTasksComponent/TaskDetail.vue'
import { useChatbotStore } from '@/stores/chatbotStore'; // 1. Import the chatbot store 
const chatbotStore = useChatbotStore(); // 2. Create an instance of the chatbot store

// Toggle this in-file to show/hide the dev toolbar
const showDevBar = false

// ID generator for new items
let nextId = 2000
function genId() { return nextId++ }


// ─── 2. Filter state ────────────────────────────────────────────────
const selectedBoard    = ref<string|null>(null)
const selectedAssignee = ref<string|null>(null)
const selectedPriority = ref<string|null>(null)
const selectedDueDate  = ref<string|null>(null)
const dueDateMenu      = ref(false)

// ─── 3. Dropdown options ──────────────────────────────────────────
// Board titles for the first dropdown
const boardOptions = computed(() => boards.value.map(b => b.title))

const formattedDate = computed<string>({
  get() {
    return selectedDueDate.value
      ? new Date(selectedDueDate.value).toLocaleDateString(undefined, {
          day:   'numeric', month: 'short', year:  'numeric'
        })
      : ''
  },
  set(v: string) {
    selectedDueDate.value = v
      ? new Date(v).toISOString().split('T')[0]
      : null
  }
})

// Unique assignees across all tasks
const assigneeOptions = computed(() => {
  const s = new Set<string>()
  boards.value.forEach(b =>
    b.stages.forEach(sg =>
      sg.tasks.forEach(t => t.assignee && s.add(t.assignee))
    )
  )
  return Array.from(s)
})

// Auto-select first assignee on load
watch(assigneeOptions, opts => {
  if (!selectedAssignee.value && opts.length) {
    selectedAssignee.value = opts[0]
  }
}, { immediate: true })


const priorityOptions = computed(() => {
  const set = new Set<string>()
  boards.value.forEach(b =>
    b.stages.forEach(sg =>
      sg.tasks.forEach(t => t.priority && set.add(t.priority))
    )
  )
  return Array.from(set)
})

// ——— 4) COMPUTE FILTERED BOARDS ———
/**
 * We flatten all boards from all (or the selected) projects,
 * then within each board we only keep tasks matching the
 * selectedAssignee (if any).
 */
 const filteredBoards = computed(() => {
  return boards.value
    // 1. keep only boards matching the board‐title filter
    .filter(b => !selectedBoard.value || b.title === selectedBoard.value)
    // 2. for each kept board, rebuild it with only the stages that still have visible tasks
    .map(b => ({
      ...b,
      stages: b.stages
        .map(sg => ({
          ...sg,
          tasks: sg.tasks.filter(t =>
            // assignee check
            (!selectedAssignee.value   || t.assignee === selectedAssignee.value) &&
            // priority check
            (!selectedPriority.value   || t.priority === selectedPriority.value) &&
            // dueDate check (tasks due *on or before* the selected date)
            (!selectedDueDate.value    || new Date(t.dueDate) <= new Date(selectedDueDate.value))
          )
        }))
        // drop empty stages
        .filter(sg => sg.tasks.length > 0)
    }))
    // 3. drop any board that now has zero stages
    .filter(b => b.stages.length > 0)
})
// MOCK DATA ENDS HERE

const visitorMode = ref(true)
const allowBoardReordering = ref(false)
const allowStageCrossBoard = ref(false)

// Task dialog state
const isTaskDialogOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const editingInfo = ref<{
  boardIndex: number|null,
  stageIndex: number|null,
  taskIndex: number|null
}>({ boardIndex: null, stageIndex: null, taskIndex: null })
const editedTaskTitle = ref('')

const selectedTask = computed(() => {
  const { boardIndex, stageIndex, taskIndex } = editingInfo.value
  if (boardIndex!==null && stageIndex!==null && taskIndex!==null) {
    return boards.value[boardIndex].stages[stageIndex].tasks[taskIndex]
  }
  return null
})

function handleTaskSave(updatedTask) {
  const { boardIndex, stageIndex, taskIndex } = editingInfo.value
  if (boardIndex!==null && stageIndex!==null && taskIndex!==null) {
    boards.value[boardIndex].stages[stageIndex].tasks[taskIndex] = updatedTask
  }
}

// watch(selectedAssignee, assignee => {
//   // whenever you pick someone, lock down the UI
//   visitorMode.value = assignee !== null
// })

function addBoard() {
  boards.value.push({ id: genId(), title: `New Board ${boards.value.length+1}`, stages: [] })
}
function deleteBoard(boardIndex: number) {
  boards.value.splice(boardIndex, 1)
}
function renameBoard(boardIndex: number, newTitle: string) {
  boards.value[boardIndex].title = newTitle
}
// NEW: renameStage handler
function renameStage(boardIndex: number, stageIndex: number, newTitle: string) {
  boards.value[boardIndex].stages[stageIndex].title = newTitle
}

function addStage(boardIndex: number) {
  boards.value[boardIndex].stages.push({ id: genId(), title: `Stage ${boards.value[boardIndex].stages.length+1}`, tasks: [] })
}
function deleteStage(boardIndex: number, stageIndex: number) {
  boards.value[boardIndex].stages.splice(stageIndex, 1)
}
function addTask(boardIndex: number, stageIndex: number) {
  boards.value[boardIndex].stages[stageIndex].tasks.push({ id: genId(), title: `Task ${boards.value[boardIndex].stages[stageIndex].tasks.length+1}` })
}
function deleteTask(boardIndex: number, stageIndex: number, taskIndex: number) {
  boards.value[boardIndex].stages[stageIndex].tasks.splice(taskIndex, 1)
}
function openTaskDialog(boardIndex: number, stageIndex: number, taskId: number) {
  const tasks    = boards.value[boardIndex].stages[stageIndex].tasks
  const realIdx  = tasks.findIndex(t => t.id === taskId)
  if (realIdx !== -1) {
    editingInfo.value = { boardIndex, stageIndex, taskIndex: realIdx }
    isTaskDialogOpen.value = true
  }
}
function closeTaskDialog() {
  isTaskDialogOpen.value = false
  editedTaskTitle.value = ''
}

function confirmDeleteTask() {
  isTaskDialogOpen.value = false
  isDeleteConfirmOpen.value = true
}
function deleteTaskConfirmed() {
  const { boardIndex, stageIndex, taskIndex } = editingInfo.value
  if (boardIndex!==null && stageIndex!==null && taskIndex!==null) {
    deleteTask(boardIndex, stageIndex, taskIndex)
  }
  isDeleteConfirmOpen.value = false
}
function logData() {
  console.log(JSON.stringify(boards.value, null, 2))
}

// Only show boards that match filters
function boardVisible(b: typeof boards.value[0]) {
  const byBoard    = !selectedBoard.value || b.title === selectedBoard.value
  const byAssignee = !selectedAssignee.value
    || b.stages.some(sg => sg.tasks.some(t => t.assignee === selectedAssignee.value))
  return byBoard && byAssignee
}

// ------------------------------------------- CHATBOT -------------------------------------------
// 2. Define a reusable function to set the context based on the Kanban view
const updateChatContext = () => {
    // The most relevant context is what the user is currently seeing.
    // We use the `filteredBoards` computed property for this.
    const currentViewData = filteredBoards.value;

    // Check if there is data to provide as context
    if (currentViewData && currentViewData.length > 0) {
        chatbotStore.setPageContext(currentViewData, ' My Tasks Page');
        console.log("Chatbot context SET for My Tasks page.");
    } else {
        // If filters result in no boards being displayed, clear the context
        // to prevent the chatbot from answering based on old or hidden data.
        chatbotStore.clearPageContext();
        console.log("No filtered boards available; chatbot context cleared.");
    }
};

// 3. Watch for changes in the filtered data
// This will automatically fire whenever the user changes a filter,
// ensuring the chatbot's context is always up-to-date.
watch(filteredBoards, () => {
    updateChatContext();
}, {
  deep: true // Necessary for watching changes within the array of boards and tasks
});

// 4. Use onMounted to set the initial context when the component loads
onMounted(() => {
    updateChatContext();
});

// 5. Use onUnmounted to clean up and clear the context when leaving the page
onUnmounted(() => {
  chatbotStore.clearPageContext();
  console.log("Chatbot context CLEARED from Kanban page.");
});

// Computed property for tomorrow's date
const tomorrowDate = computed(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate()); // Set to tomorrow

    // Format to YYYY-MM-DD
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});
</script>

<style scoped>
/* ============ NEUMORPHIC STYLES ============ */
.neu {
  background: #e0e0e0;
  border-radius: 16px;
  box-shadow:
    8px 8px 16px #bebebe,
   -8px -8px 16px #ffffff;
  transition: all 0.3s ease;
}

.neu-inset {
  box-shadow:
    inset 8px 8px 16px #bebebe,
    inset -8px -8px 16px #ffffff;
}

.neu-btn {
  background: #e0e0e0;
  border-radius: 12px;
  box-shadow:
    5px 5px 10px #bebebe,
   -5px -5px 10px #ffffff;
  transition: 0.2s ease;
}

.neu-btn:active {
  box-shadow:
    inset 5px 5px 10px #bebebe,
    inset -5px -5px 10px #ffffff;
}

.fill-height {
    height: 100%;
    /* Make sure it fills the full screen */
}

.card-1 {
    border: thin solid lightgray;
    box-shadow: none;
}

::v-deep .v-field__outline,
::v-deep .v-field__bottom {
  display: none !important;
}
</style>

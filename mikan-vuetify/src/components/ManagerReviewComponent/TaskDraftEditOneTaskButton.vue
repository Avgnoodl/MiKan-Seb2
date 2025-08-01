<template>
    <div>
        <v-dialog v-model="dialog" max-width="500px" persistent>
            <v-card class="rounded-xl pa-2">
                <v-card-title class="ml-3">Edit Draft</v-card-title>

                <v-card-text>
                    <v-form ref="taskForm" @submit.prevent="save" lazy-validation >
                        <v-text-field clearable label="Task Title" variant="outlined" density="compact"
                            v-model="taskTitle" rounded="xl" class="mb-1"
                            :rules="[(v) => !!v || 'Task title is required']"></v-text-field>

                        <v-text-field clearable label="Due Date" variant="outlined" density="compact" v-model="dueDate"
                        rounded="xl" type="date" class="mb-1" :rules="[(v) => !!v || 'Due date is required']"
                            :min="tomorrowDate"></v-text-field>

                        <v-select v-model="assignee" :items="assigneeOptions" item-title="name" item-value="id" label="Assignee" 
                            clearable variant="outlined" density="compact" rounded="xl" class="mb-1" 
                            :rules="[(v) => !!v || 'Assignee is required']" />

                        <v-select v-model="project" :items="projectOptions" item-title="title" item-value="id" label="Project" 
                            clearable variant="outlined" density="compact" rounded="xl" class="mb-1" 
                            :rules="[(v) => !!v || 'Project is required']" />

                        <v-textarea clearable label="Task Description" variant="outlined" density="compact"
                            v-model="taskDescription" rounded="xl" rows="3" class="mb-0 "
                            :rules="[(v) => !!v || 'Task description is required']"></v-textarea>
                    </v-form>
                </v-card-text>

                <v-card-actions class="justify-end mb-2">
                    <v-btn variant="outlined" class="text-body-2 mr-2 stage-button-cancel" rounded="xl"
                        @click="cancel">Cancel</v-btn>

                    <v-btn variant="flat" class="text-body-2 mr-4 button-save" rounded="xl"
                        @click="save">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// load drafts data
import { useDraftStore } from '@/stores/drafts';
const draftStore = useDraftStore()
// onMounted(async () => {
//   await draftStore.getDraftById();
// });
    
// display assignee names on dropdown
import { useUserStore } from '@/stores/users'
const userStore = useUserStore()
onMounted(() => {
        userStore.fetchUsers()
})
const assignee = ref(null)
const assigneeOptions = computed(() => userStore.users)

// display project titles on dropdown
import { useProjectStore } from '@/stores/projects'
const projectStore = useProjectStore()
onMounted(() => {
    projectStore.fetchProjects()
})
const project = ref(null)
const projectOptions = computed(() => projectStore.projects)


const taskIndex = inject("taskIndex");
let retrievedDraft = draftStore.getDraftById(taskIndex)

const taskTitle = ref("");
const dueDate = ref("");
// const assignee = ref("");
// const project = ref("");
const taskDescription = ref("");

const dialog = ref(false);
const openDialog = () => {
    dialog.value = true;

    retrievedDraft = draftStore.getDraftById(taskIndex);

    taskTitle.value = retrievedDraft.title;
    dueDate.value = retrievedDraft.dueDate;
    assignee.value = retrievedDraft.assignee?.id ?? null;  // <--- here
    project.value = retrievedDraft.project?.id ?? null;    // <--- here
    taskDescription.value = retrievedDraft.description;
}
defineExpose({ openDialog })

const emit = defineEmits(["task-edited"]);

// Reference to the v-form component
const taskForm = ref(null);
// Computed property for tomorrow's date
const tomorrowDate = computed(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow

    // Format to YYYY-MM-DD
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});

function cancel() {
    dialog.value = false;
}

async function save() {
    const { valid } = await taskForm.value.validate();

    if (valid) {
        dialog.value = false;

        const editedDraft = {
            title: taskTitle.value,
            dueDate: dueDate.value,
            assignee: assignee.value,
            project: project.value,
            description: taskDescription.value,
        };
        draftStore.editDraft(taskIndex, editedDraft);
        emit("task-edited", editedDraft);  // emit with payload

        if (taskForm.value) {
            taskForm.value.resetValidation();
        }
    }
}

</script>

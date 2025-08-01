import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import axios from "axios";
import { useProjectStore } from "@/stores/projects";

interface LLMTranscriptLine {
  timestamp: string;
  speaker: string;
  text: string;
}

interface LLMTranscriptDate {
  title: string;
  purpose: string;
  attendees: string;
  transcript_lines: LLMTranscriptLine[];
}

interface ResponseFormatter {
  transcript: LLMTranscriptDate;
}

export type TranscriptLine = {
  transcript: string;
};

export const useTranscriptStore = defineStore("transcript", () => {
  const isEditMode = ref(false);
  const activeEditorKey = ref<string | null>(null);

  const header = reactive({
    title: "",
    location: "",
    createdBy: "",
    date: "",
    project: "",
    purpose: "",
    attendees: "",
  });

  type HeaderField = keyof typeof header;

  const body = reactive({
    transcriptLines: [] as TranscriptLine[],
  });

  const transcriptHeaderData = computed(() => header);
  const transcriptBodyData = computed(() => body);

  const fullTranscriptText = computed(() =>
    body.transcriptLines.map((line) => line.transcript).join("\n")
  );

  function toggleEditMode() {
    isEditMode.value = !isEditMode.value;
    if (!isEditMode.value) {
      activeEditorKey.value = null;
    }
  }

  function setActiveEditor(key: string | null) {
    activeEditorKey.value = key;
  }

  function updateHeaderField(payload: { field: HeaderField; value: string }) {
    if (payload.field in header) {
      header[payload.field] = payload.value;
    }
  }

  function updateTranscript(newText: string) {
    const newLines = newText.split("\n").map((line) => ({ transcript: line }));
    body.transcriptLines = newLines;
  }

	function formatTimestamp(ts: string): string {
		const parts = ts.split(':'); // ["00", "01", "680"]
		if (parts.length !== 3) return ts; // fallback if unexpected format

		const ms = parts[2].slice(0, 2); // get first two digits only
		return `${parts[0]}:${parts[1]}:${ms}`;
	}

  function getTodayInTimezone(timeZone = 'Asia/Kuala_Lumpur') {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // Format to YYYY-MM-DD by default using 'en-CA' locale
    return formatter.format(now);
  }
  
  // Kang's code to bring in transcript data from llm's result (JSON)
  async function loadFromLLMJSON(llm_json: ResponseFormatter) {
    try {
      header.title = llm_json.transcript.title;
      header.createdBy = "You";
      header.date = getTodayInTimezone();
      header.purpose = llm_json.transcript.purpose;
      header.attendees = llm_json.transcript.attendees;

      if (
        llm_json.transcript.transcript_lines &&
        Array.isArray(llm_json.transcript.transcript_lines)
      ) {
        body.transcriptLines = llm_json.transcript.transcript_lines.map(
          (line) => ({
            transcript: `[${formatTimestamp(line.timestamp)}] ${
              line.speaker
            }: ${line.text}`,
          })
        );
      } else {
        console.warn("transcript_lines is missing or not an array");
        body.transcriptLines = [];
      }
    } catch (error) {
      console.error("Failed to load JSON from transcription json:", error);
    }
  }

  const projectStore = useProjectStore();
  async function loadConfig(location: string, projectID: number) {
    header.location = location;

    const retrievedProject = await projectStore.fetchProjectByID(projectID);
    header.project = retrievedProject?.title as string;
  }

  // ✅ Save transcript to FastAPI backend
  async function saveTranscriptToDB() {
    try {
      const payload = {
        title: header.title,
        location: header.location,
        created_by: header.createdBy,
        date: header.date,
        project: header.project,
        purpose: header.purpose,
        attendees: header.attendees,
        transcript_lines: body.transcriptLines.map((line) => ({
          transcript: line.transcript,
        })),
      };

      const response = await axios.post(
        "http://localhost:8000/transcripts",
        payload
      );

      const savedTranscript = response.data;
      console.log("Transcript saved to DB:", savedTranscript);

      // 🔐 Store the transcript ID for later use (e.g., in localStorage or global store)
      localStorage.setItem("latestTranscriptId", savedTranscript.id);

      return savedTranscript;
    } catch (error) {
      console.error("Error saving transcript:", error);
      throw error;
    }
  }

  async function generateMinutesFromTranscript() {
    try {
      const payload = {
        title: header.title,
        location: header.location,
        created_by: header.createdBy,
        date: header.date,
        project: header.project,
        purpose: header.purpose,
        attendees: header.attendees,
        transcript_lines: body.transcriptLines.map((line) => ({
          transcript: line.transcript,
        })),
      };

      const response = await axios.post(
        "http://localhost:8000/minutes/generate",
        payload
      );
      console.log("Generated minutes:", response.data);

      return response.data;
    } catch (error) {
      console.error("Failed to generate minutes:", error);
      throw error;
    }
  }

  // ✨ ADDED: State for the highlighted transcript line
  const highlightedLine = ref<string | null>(null);

  // ✨ ADDED: Action to set or clear the highlight
  function setHighlightedLine(line: string | null) {
    highlightedLine.value = line;
    if (line) {
      console.log(`Highlighting line: ${line}`);
    } else {
      console.log("Clearing highlight.");
    }
  }

  return {
    isEditMode,
    activeEditorKey,
    header,
    body,
    transcriptHeaderData,
    transcriptBodyData,
    fullTranscriptText,
    highlightedLine,
    setHighlightedLine,
    toggleEditMode,
    setActiveEditor,
    updateHeaderField,
    updateTranscript,
    generateMinutesFromTranscript, // ✅ ADD THIS LINE!
    loadFromLLMJSON,
    saveTranscriptToDB, // ✅ expose this to use in TranscriptDisplay.vue
    loadConfig,
  };
});

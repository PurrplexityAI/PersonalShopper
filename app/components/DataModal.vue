<script setup lang="ts">
import { ref } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";

const store = usePantryStore();

const message = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

async function handleExport() {
  try {
    loading.value = true;
    error.value = null;
    await store.exportData();
    message.value = "Pantry inventory exported successfully!";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Export failed";
  } finally {
    loading.value = false;
  }
}

async function handleImportFile(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    loading.value = true;
    error.value = null;
    const text = await file.text();
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) {
      throw new Error("Invalid JSON format: Expected array of items.");
    }
    const msg = await store.importData(items);
    message.value = msg;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Import failed. Check file format.";
  } finally {
    loading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = "";
  }
}

async function handleResetSample() {
  try {
    loading.value = true;
    error.value = null;
    await store.resetSampleData();
    message.value = "Reset to sample pantry items successfully.";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to reset data";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="store.isDataModalOpen"
    title="Data, Sync & Mobile Access"
    description="Manage your backups, samples, and local mobile connectivity"
  >
    <template #body>
      <div class="space-y-4">
        <div v-if="message" class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
          <UIcon name="i-lucide-check" class="w-4 h-4 shrink-0" />
          <span>{{ message }}</span>
        </div>

        <div v-if="error" class="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <!-- Mobile Access Guide -->
        <div class="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
          <div class="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
            <UIcon name="i-lucide-smartphone" class="w-4 h-4 text-emerald-600" />
            <span>Mobile Phone Access (Local Wi-Fi)</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            To use Personal Shopper on your phone, connect to the same Wi-Fi network and open your computer's IP address:
          </p>
          <div class="bg-white px-3 py-2 rounded-lg border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center justify-between">
            <span>http://&lt;your-pc-ip&gt;:3000</span>
            <span class="text-[10px] text-slate-400 font-sans font-normal">Check terminal on start</span>
          </div>
          <p class="text-[11px] text-slate-500">
            Tip: On iOS Safari or Android Chrome, tap <strong>"Share" &gt; "Add to Home Screen"</strong> for a native app feel!
          </p>
        </div>

        <!-- Backup & Restore -->
        <div class="space-y-2 pt-1">
          <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Backup & Restore Data
          </h3>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              :disabled="loading"
              class="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50"
              @click="handleExport"
            >
              <UIcon name="i-lucide-download" class="w-4 h-4 text-emerald-600" />
              <span>Export Backup (JSON)</span>
            </button>

            <button
              type="button"
              :disabled="loading"
              class="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50"
              @click="fileInputRef?.click()"
            >
              <UIcon name="i-lucide-upload" class="w-4 h-4 text-emerald-600" />
              <span>Import Backup</span>
            </button>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleImportFile"
          >
        </div>

        <!-- Reset to Samples -->
        <div class="pt-2 border-t border-slate-100">
          <button
            type="button"
            :disabled="loading"
            class="w-full flex items-center justify-center space-x-2 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold border border-rose-200 transition-colors disabled:opacity-50"
            @click="handleResetSample"
          >
            <UIcon name="i-lucide-rotate-ccw" class="w-3.5 h-3.5" />
            <span>Reset to Sample Groceries</span>
          </button>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          color="neutral"
          variant="outline"
          @click="store.closeDataModal()"
        >
          Done
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import AppHeader from "~~/app/components/AppHeader.vue";
import AppNavbar from "~~/app/components/AppNavbar.vue";
import ShoppingListView from "~~/app/components/ShoppingListView.vue";
import PantryView from "~~/app/components/PantryView.vue";
import SuggestionsView from "~~/app/components/SuggestionsView.vue";
import ItemModal from "~~/app/components/ItemModal.vue";
import DataModal from "~~/app/components/DataModal.vue";

const store = usePantryStore();

onMounted(() => {
  store.loadData();
});
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <!-- Top Header -->
      <AppHeader />

      <!-- Main Navigation (Desktop Top & Mobile Bottom) -->
      <AppNavbar />

      <!-- Main Content Area -->
      <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6">
        <div v-if="store.isLoading" class="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
          <div class="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p class="text-xs font-medium">Loading your pantry & shopping list...</p>
        </div>

        <template v-else>
          <ShoppingListView v-if="store.activeTab === 'shopping'" />
          <PantryView v-else-if="store.activeTab === 'pantry'" />
          <SuggestionsView v-else-if="store.activeTab === 'suggestions'" />
        </template>
      </main>

      <!-- Add / Edit Item Modal -->
      <ItemModal />

      <!-- Data / Backup / Mobile Guide Modal -->
      <DataModal />
    </div>
  </UApp>
</template>

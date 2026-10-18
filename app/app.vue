<script setup lang="ts">
import { onMounted } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import AppNavbar from "~~/app/components/AppNavbar.vue";
import ShoppingListView from "~~/app/components/ShoppingListView.vue";
import PantryView from "~~/app/components/PantryView.vue";
import ItemModal from "~~/app/components/ItemModal.vue";
import AnomalyModal from "~~/app/components/AnomalyModal.vue";

const store = usePantryStore();

onMounted(() => {
  store.loadData();
});
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-muted flex flex-col font-sans">
      <!-- Main Navigation (Desktop Top & Mobile Bottom) -->
      <AppNavbar />

      <!-- Main Content Area -->
      <main class="flex-1 max-w-5xl w-full mx-auto px-4 pt-2 sm:pt-16 pb-4 sm:pb-6">
        <div v-if="store.isLoading" class="flex flex-col items-center justify-center py-20 space-y-3 text-muted">
          <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p class="font-medium">Loading your pantry & shopping list...</p>
        </div>

        <div v-else-if="store.loadError && !store.items.length" class="max-w-md mx-auto py-16 px-4 text-center space-y-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            title="Failed to load pantry data"
            :description="store.loadError"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="store.isRefreshing"
            @click="store.loadData()"
          >
            Retry Connection
          </UButton>
        </div>

        <template v-else>
          <ShoppingListView v-if="store.activeTab === 'shopping'" />
          <PantryView v-else-if="store.activeTab === 'pantry'" />
        </template>
      </main>

      <!-- Add / Edit Item Drawer (Desktop Right Drawer / Mobile Full Screen) -->
      <ItemModal />

      <!-- Smart Frequency Tracking Anomaly Modal for Pantry tab -->
      <AnomalyModal
        v-if="store.activeTab === 'pantry'"
        v-model:open="store.isAnomalyOpen"
        :item="store.anomalyItem"
        :anomaly-type="store.anomalyType"
        :expected-days="store.anomalyExpectedDays"
        :lasted-days="store.anomalyLastedDays"
        @select="store.confirmAnomaly"
      />
    </div>
  </UApp>
</template>

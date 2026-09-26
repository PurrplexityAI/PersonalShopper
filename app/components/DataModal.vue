<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";

const store = usePantryStore();
</script>

<template>
  <UModal
    v-model:open="store.isDataModalOpen"
    title="Mobile Access"
    description="Connect from your phone on local Wi-Fi"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Mobile Access Guide -->
        <div class="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2">
          <div class="flex items-center space-x-2 text-highlighted font-bold">
            <UIcon name="i-lucide-smartphone" class="w-4 h-4 text-primary" />
            <span>Mobile Phone Access (Local Wi-Fi)</span>
          </div>
          <p class="text-toned leading-relaxed">
            To use Personal Shopper on your phone, connect to the same Wi-Fi network and open your computer's IP address:
          </p>
          <div class="bg-default px-3 py-2 rounded-lg border border-primary/30 font-mono text-primary flex items-center justify-between">
            <span>http://&lt;your-pc-ip&gt;:3000</span>
            <span class="text-muted font-sans font-normal">Check terminal on start</span>
          </div>
          <p class="text-muted">
            Tip: On iOS Safari or Android Chrome, tap <strong>"Share" &gt; "Add to Home Screen"</strong> for a native app feel!
          </p>
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

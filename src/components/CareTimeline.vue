<!-- src/components/CareTimeline.vue -->
<script setup lang="ts">
import type { CareRecord } from '@/db'
import { careTypeLabels } from '@/db'

defineProps<{
  records: CareRecord[]
  counts: Record<string, number>
}>()

const emit = defineEmits<{
  add: [type: string]
  remove: [id: number]
}>()
</script>

<template>
  <div class="care-section">
    <div class="care-header">
      <h3>养护记录</h3>
      <div class="care-stats">
        <span v-for="(count, type) in counts" :key="type" class="stat-badge">
          {{ careTypeLabels[type as keyof typeof careTypeLabels] }} {{ count }}次
        </span>
      </div>
    </div>

    <van-divider />

    <div v-if="records.length === 0" class="empty-hint">暂无养护记录</div>

    <van-steps v-else direction="vertical" :active="records.length - 1">
      <van-step v-for="record in records" :key="record.id">
        <template #inactive-icon>
          <span class="step-icon">
            {{ record.type === 'watering' ? '💧' : record.type === 'fertilizing' ? '🧪' : record.type === 'repotting' ? '🪴' : record.type === 'pruning' ? '✂️' : '📝' }}
          </span>
        </template>
        <template #active-icon>
          <span class="step-icon">
            {{ record.type === 'watering' ? '💧' : record.type === 'fertilizing' ? '🧪' : record.type === 'repotting' ? '🪴' : record.type === 'pruning' ? '✂️' : '📝' }}
          </span>
        </template>
        <div class="step-content">
          <p class="step-title">{{ careTypeLabels[record.type] }}</p>
          <p class="step-date">{{ record.date.slice(0, 10) }}</p>
          <p v-if="record.note" class="step-note">{{ record.note }}</p>
          <van-icon
            name="delete-o"
            class="step-delete"
            @click="emit('remove', record.id!)"
          />
        </div>
      </van-step>
    </van-steps>

    <div class="care-actions">
      <van-button
        v-for="(label, type) in careTypeLabels"
        :key="type"
        size="small"
        :type="type === 'watering' ? 'primary' : 'default'"
        @click="emit('add', type)"
      >
        {{ label }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.care-section { margin-top: 16px; }
.care-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.care-header h3 { margin: 0; font-size: 16px; }
.care-stats { display: flex; gap: 6px; flex-wrap: wrap; }
.stat-badge {
  font-size: 11px; background: #e8f5e9; color: #2e7d32;
  padding: 2px 8px; border-radius: 10px;
}
.step-icon { font-size: 18px; }
.step-content { min-width: 0; }
.step-title { font-weight: 600; margin: 0; font-size: 14px; }
.step-date { color: #999; font-size: 12px; margin: 2px 0; }
.step-note { font-size: 13px; color: #666; margin: 2px 0; }
.step-delete { color: #ff5252; cursor: pointer; margin-top: 4px; }
.empty-hint { text-align: center; color: #999; padding: 20px; }
.care-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-top: 16px; padding-top: 12px; border-top: 1px solid #ebedf0;
}
</style>

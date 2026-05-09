<!-- src/components/PhotoGrid.vue -->
<script setup lang="ts">
defineProps<{
  urls: string[]
}>()

const emit = defineEmits<{
  remove: [index: number]
  add: []
}>()
</script>

<template>
  <div class="photo-section">
    <h3>照片墙</h3>
    <div class="photo-grid">
      <div
        v-for="(url, index) in urls"
        :key="index"
        class="photo-item"
        :style="{ backgroundImage: `url(${url})` }"
        @click="emit('remove', index)"
      >
        <van-icon name="close" class="photo-remove" />
      </div>
      <div class="photo-item photo-add" @click="emit('add')">
        <van-icon name="photograph" size="28" color="#999" />
        <span class="add-text">拍照</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-section { margin-top: 16px; }
.photo-section h3 { font-size: 16px; margin: 0 0 12px; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.photo-item {
  aspect-ratio: 1; border-radius: 8px;
  background-size: cover; background-position: center;
  position: relative; overflow: hidden;
}
.photo-add {
  background: #f5f5f5; display: flex;
  flex-direction: column; align-items: center;
  justify-content: center; cursor: pointer;
}
.add-text { font-size: 12px; color: #999; margin-top: 4px; }
.photo-remove {
  position: absolute; top: 4px; right: 4px;
  color: #fff; background: rgba(0,0,0,0.5);
  border-radius: 50%; padding: 2px;
}
</style>

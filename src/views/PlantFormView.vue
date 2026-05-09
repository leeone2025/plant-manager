<template>
  <div class="page">
    <van-nav-bar :title="pageTitle" left-arrow @click-left="$router.back()" />
    <div class="placeholder">
      <p>{{ pageTitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => {
  return route.name === 'PlantNew' ? '添加植物' : '编辑植物'
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
}
.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 16px;
}
</style>

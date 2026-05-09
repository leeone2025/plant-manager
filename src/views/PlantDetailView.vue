<template>
  <div class="page">
    <van-nav-bar title="植物详情" left-arrow @click-left="$router.back()" />
    <div class="placeholder">
      <p>植物详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
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

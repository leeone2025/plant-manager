<template>
  <div class="page">
    <van-nav-bar title="我的植物" />
    <div class="placeholder">
      <p>我的植物列表</p>
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

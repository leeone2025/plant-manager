<template>
  <router-view />
  <van-tabbar v-model="active" active-color="#4CAF50" fixed placeholder>
    <van-tabbar-item icon="flower-o" to="/">我的植物</van-tabbar-item>
    <van-tabbar-item icon="search" to="/ai">AI 搜索</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const active = ref(0)

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/ai')) {
      active.value = 1
    } else {
      active.value = 0
    }
  },
  { immediate: true }
)
</script>

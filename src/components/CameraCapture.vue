<!-- src/components/CameraCapture.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  capture: [base64: string]
}>()

function openCamera() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const { default: imageCompression } = await import('browser-image-compression')
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    })

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      emit('capture', base64)
    }
    reader.readAsDataURL(compressed)
  }
  input.click()
}
</script>

<template>
  <div class="camera-area" @click="openCamera">
    <div class="camera-placeholder">
      <van-icon name="photograph" size="40" color="#4CAF50" />
      <p>点击拍照识别植物</p>
      <p class="sub">自动调用相机，也可从相册选择</p>
    </div>
  </div>
</template>

<style scoped>
.camera-area {
  width: 100%; height: 200px; background: #f0faf0;
  border-radius: 12px; border: 2px dashed #a5d6a7;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; margin-top: 16px;
}
.camera-placeholder { text-align: center; color: #4CAF50; }
.camera-placeholder p { margin: 8px 0 0; font-size: 15px; }
.sub { font-size: 12px !important; color: #81c784 !important; }
</style>

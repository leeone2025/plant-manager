<!-- src/views/PlantFormView.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { plantService } from '@/services/plantService'
import { photoService } from '@/services/photoService'

const route = useRoute()
const router = useRouter()
const isEdit = route.name === 'PlantEdit'
const plantId = route.params.id ? Number(route.params.id) : null

const name = ref('')
const species = ref('')
const sowDate = ref('')
const location = ref('')
const notes = ref('')
const saving = ref(false)
const deleting = ref(false)

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

onMounted(async () => {
  if (isEdit && plantId) {
    const plant = await plantService.get(plantId)
    if (plant) {
      name.value = plant.name
      species.value = plant.species ?? ''
      sowDate.value = plant.sowDate ?? ''
      location.value = plant.location ?? ''
      notes.value = plant.notes ?? ''
    }
  }
})

onBeforeUnmount(() => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})

function triggerPhoto() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = handleFileChange
  input.click()
}

function triggerCamera() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = handleFileChange
  input.click()
}

const showPhotoAction = ref(false)
const photoActions = [
  { name: '拍照', callback: triggerCamera },
  { name: '从图库选择', callback: triggerPhoto }
]

function onPhotoActionSelect(action: { name: string; callback: () => void }) {
  showPhotoAction.value = false
  action.callback()
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

function removePhoto() {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = null
  photoPreview.value = null
}

async function handleSave() {
  if (!name.value.trim()) return

  saving.value = true
  try {
    const baseData = {
      name: name.value.trim(),
      species: species.value.trim() || undefined,
      sowDate: sowDate.value || undefined,
      location: location.value.trim() || undefined,
      notes: notes.value.trim() || undefined
    }

    let targetId = plantId

    if (isEdit && plantId) {
      await plantService.update(plantId, baseData)
    } else {
      targetId = await plantService.create(baseData)
    }

    if (photoFile.value && targetId) {
      await photoService.save(targetId, photoFile.value)
    }

    router.back()
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!plantId) return
  deleting.value = true
  try {
    await plantService.remove(plantId)
    router.replace('/')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <van-nav-bar
      :title="isEdit ? '编辑植物' : '添加植物'"
      left-arrow fixed placeholder
      @click-left="$router.back()"
    />

    <div class="content">
      <van-form @submit="handleSave">
        <!-- Photo section -->
        <div class="photo-section">
          <div v-if="photoPreview" class="photo-preview" @click="showPhotoAction = true">
            <img :src="photoPreview" alt="preview" />
            <van-icon name="close" class="photo-remove" @click.stop="removePhoto" />
          </div>
          <div v-else class="photo-placeholder" @click="showPhotoAction = true">
            <van-icon name="photograph" size="32" color="#4CAF50" />
            <p>点击拍照或从图库选择</p>
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPhotoAction"
          :actions="photoActions"
          cancel-text="取消"
          @select="onPhotoActionSelect"
        />

        <van-cell-group inset>
          <van-field
            v-model="name"
            label="名称"
            placeholder="如：阳台月季"
            :rules="[{ required: true, message: '请输入名称' }]"
          />
          <van-field
            v-model="species"
            label="品种"
            placeholder="AI 识别或手动填写"
          />
          <van-field
            v-model="sowDate"
            label="播种日期"
            type="date"
            placeholder="选择日期"
          />
          <van-field
            v-model="location"
            label="位置"
            placeholder="如：阳台、客厅"
          />
          <van-field
            v-model="notes"
            label="备注"
            type="textarea"
            rows="3"
            placeholder="额外说明..."
          />
        </van-cell-group>

        <div style="margin: 24px 16px">
          <van-button
            round block type="primary"
            native-type="submit"
            :loading="saving"
            color="#4CAF50"
          >
            {{ isEdit ? '保存修改' : '添加植物' }}
          </van-button>
        </div>

        <div v-if="isEdit" style="margin: 24px 16px">
          <van-button
            round block type="danger"
            :loading="deleting"
            @click="handleDelete"
          >
            删除植物
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 50px; }
.content { padding: 16px 0; }

.photo-section { padding: 0 16px; margin-bottom: 16px; }
.photo-preview {
  width: 100%; height: 200px; border-radius: 12px; overflow: hidden;
  position: relative; cursor: pointer;
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.photo-remove {
  position: absolute; top: 8px; right: 8px;
  color: #fff; background: rgba(0,0,0,0.5);
  border-radius: 50%; padding: 6px; font-size: 14px;
}
.photo-placeholder {
  width: 100%; height: 120px; background: #f5f5f5;
  border-radius: 12px; border: 2px dashed #ddd;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; cursor: pointer;
}
.photo-placeholder p { font-size: 13px; color: #666; margin: 0; }
</style>

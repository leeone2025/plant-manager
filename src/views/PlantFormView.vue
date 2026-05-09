<!-- src/views/PlantFormView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { plantService } from '@/services/plantService'

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

    if (isEdit && plantId) {
      await plantService.update(plantId, baseData)
    } else {
      await plantService.create(baseData)
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
</style>

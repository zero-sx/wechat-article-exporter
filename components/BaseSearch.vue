<template>
  <UForm
    :state="state"
    class="flex justify-between space-x-2"
    @submit.prevent="search"
  >
    <UInput
      class="flex-1"
      v-model="query"
      :placeholder="placeholder"
      :ui="{ icon: { trailing: { pointer: '' } } }"
    >
      <template #trailing>
        <UButton
          v-show="query !== ''"
          color="gray"
          variant="link"
          icon="i-heroicons-x-mark-20-solid"
          :padded="false"
          @click="query = ''"
        />
      </template>
    </UInput>
    <UButton color="blue" type="submit"> 搜索 </UButton>
  </UForm>
</template>

<script setup lang="ts">
interface Props {
  placeholder?: string
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: "请输入...",
  required: false,
})

const query = defineModel<string>()
const emit = defineEmits(["search"])
const state = reactive({
  query: "",
})

function search() {
  emit("search", query.value)
}
</script>

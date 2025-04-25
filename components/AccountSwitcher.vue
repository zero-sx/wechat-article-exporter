<template>
  <USlideover v-model="isOpen" side="left" appear :ui="{overlay: {background: 'bg-zinc-400/75'}}">
    <div
        class="rounded-lg divide-y divide-gray-100 dark:divide-gray-800 shadow bg-white dark:bg-gray-900 flex flex-col flex-1 overflow-y-scroll">
      <div class="sticky top-0 bg-white py-4 px-2 shadow">
        <BaseSearch v-model="accountQuery" @search="searchAccount" placeholder="搜索公众号名称或biz号码"/>
      </div>
      <div class="flex-1">
        <ul class="divide-y antialiased">
          <li v-for="account in accountList"
              :key="account.fakeid"
              class="flex items-center px-2 py-4 hover:bg-slate-50 hover:cursor-pointer"
              :class="{active: account.fakeid === activeAccount?.fakeid}"
              @click="selectAccount(account)"
          >
            <img class="size-20 mr-2" :src="account.round_head_img" alt="">
            <div class="flex-1">
              <div class="flex justify-between">
                <p class="font-semibold">{{ account.nickname }}</p>
                <p class="text-sky-500 font-medium">{{ ACCOUNT_TYPE[account.service_type] }}</p>
              </div>
              <p class="text-gray-500 text-sm">微信号: {{ account.alias || '未设置' }}</p>
              <p class="text-sm mt-2">{{ account.signature }}</p>
            </div>
          </li>
        </ul>

        <p v-if="loading" class="flex justify-center items-center my-2 py-2">
          <Loader :size="28" class="animate-spin text-slate-500"/>
        </p>
        <p v-else-if="noMoreData" class="text-center mt-2 py-2 text-slate-400">已全部加载完毕</p>
        <button
            v-else-if="accountList.length > 0"
            @click="loadData"
            class="block mx-auto my-2 h-10 px-6 font-semibold rounded-md border border-slate-200 text-slate-900 hover:border-slate-400"
            type="button"
        >
          下一页
        </button>
      </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import {ACCOUNT_LIST_PAGE_SIZE, ACCOUNT_TYPE} from "~/config";
import {Loader} from "lucide-vue-next";
import type {AccountInfo, AuthorInfo} from "~/types/types";
import {getAccountList} from "~/apis";
import {authorInfo} from "~/apis";
import { getAllInfo, type Info } from "~/store/info"

const loginAccount = useLoginAccount()
const activeAccount = useActiveAccount()

const emit = defineEmits(['select:account'])

defineExpose({
  openSwitcher: openSwitcher,
})

const isOpen = ref(false)

function openSwitcher() {
  isOpen.value = true
  accountQuery.value = activeAccount.value?.nickname!
}

const accountQuery = ref('')
const accountList = reactive<(AccountInfo)[]>([])
let begin = 0


/**
 * 搜索公众号
 */
async function searchAccount() {
  begin = 0
  accountList.length = 0
  noMoreData.value = false

  await loadData()
}

const loading = ref(false)
const noMoreData = ref(false)


// 已缓存的公众号信息
let cachedAccountInfos = await getAllInfo()
// 为了避免类型不匹配问题，这里先不指定 ComputedRef 的泛型类型，让类型推导自动处理
const sortedAccountInfos = computed(() => {
  cachedAccountInfos.sort((a, b) => {
    return a.articles > b.articles ? -1 : 1
  })
  return cachedAccountInfos.map((row) => {
    return {
      type: 'account',
      alias: row.alias,
      fakeid: row.fakeid,
      nickname: row.nickname,
      round_head_img: row.round_head_img,
      service_type: row.service_type,
      signature: row.signature,
    }
  })
})

/**
 * 加载公众号数据
 */
async function loadData() {
  loading.value = true

  try {
    let finalAccounts: AccountInfo[] = []
    let finalCompleted = false
    if (!accountQuery.value) {
      cachedAccountInfos = await getAllInfo()
      // 由于类型不匹配，进行类型断言以解决类型错误
      finalAccounts = sortedAccountInfos.value as AccountInfo[];
      finalCompleted = true
    } else {
      let [accounts, completed] = await getAccountList(loginAccount.value.token, begin, accountQuery.value)
      finalAccounts = accounts
      finalCompleted = completed
    }
    accountList.push(...finalAccounts)
    begin += ACCOUNT_LIST_PAGE_SIZE
    noMoreData.value = finalCompleted
  } catch (e: any) {
    alert(e.message)
    console.error(e)
    if (e.message === 'session expired') {
      navigateTo('/login')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 选择公众号
 * @param account
 */
function selectAccount(account: AccountInfo) {
  isOpen.value = false
  activeAccount.value = account
  
  nextTick(() => {
    emit('select:account', account)
  })
}

</script>

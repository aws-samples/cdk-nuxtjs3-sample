<script lang="ts" setup>
const config = useRuntimeConfig()

const { data: boyakis, execute: listBoyakis } = useFetch('/api/boyakis', {
  baseURL: config.public.apiEndpoint,
  transform: (data) =>
    data?.boyakis?.sort((a, b) => b.timestamp - a.timestamp) ?? [],
})

let text = $ref('')
const userId = $ref('')
const createBoyaki = async () => {
  await $fetch('/api/boyakis', {
    baseURL: config.public.apiEndpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      text,
      userId,
    },
  })
  text = ''
  listBoyakis()
}
</script>

<template>
  <v-app>
    <v-app-bar color="blue">
      <v-toolbar-title>Boyaki</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <v-container style="max-width: 600px">
        <v-text-field
          v-model="userId"
          prefix="@"
          variant="underlined"
          label="UserID"
        ></v-text-field>
        <v-form
          class="d-flex"
          :disabled="!userId"
          @submit.prevent="createBoyaki()"
        >
          <v-text-field
            v-model="text"
            variant="plain"
            label="いまどうしてる？"
          ></v-text-field>
          <v-btn
            :disabled="!userId"
            color="blue"
            rounded
            class="text-end"
            type="submit"
            >ぼやく</v-btn
          >
        </v-form>
        <v-list>
          <v-list-item
            v-for="(boyaki, index) in boyakis"
            :key="boyaki.timestamp"
          >
            <template #prepend>
              <v-avatar color="grey">{{
                boyaki.userId[0].toUpperCase()
              }}</v-avatar>
            </template>
            <v-divider v-if="index" />
            <v-card>
              <v-card-subtitle class="pt-2"
                >@{{ boyaki.userId }}</v-card-subtitle
              >
              <v-card-text class="py-1">
                {{ boyaki.text }}
                <div class="text-end text-disabled">
                  {{ new Date(boyaki.timestamp).toLocaleString() }}
                </div>
              </v-card-text>
            </v-card>
          </v-list-item>
        </v-list>
      </v-container>
    </v-main>
  </v-app>
</template>

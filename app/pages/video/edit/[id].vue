<template>
  <div class="min-h-screen bg-[#fcfcfc]">
    <div v-if="loading" class="p-[60px] text-center text-(--neon-purple)">
      <h2>Chargement de l'éditeur vidéo...</h2>
    </div>

    <div v-else-if="errorMsg" class="p-[60px] text-center">
      <h2 class="text-(--neon-pink)">{{ errorMsg }}</h2>
      <NuxtLink to="/dashboard/videos" class="mt-[15px] inline-flex items-center justify-center rounded-md border border-(--neon-purple) px-4 py-2 text-(--neon-purple) no-underline shadow-[0_0_4px_rgba(138,43,226,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-(--neon-purple) hover:text-white hover:shadow-[0_4px_12px_rgba(138,43,226,0.3)]">Retour au gestionnaire</NuxtLink>
    </div>

    <!-- Layout 2 Colonnes : Formulaire d'Édition & Showcase Live -->
    <div v-else class="mx-auto my-[30px] max-w-[1280px] px-5">
      
      <div class="mb-[25px] flex items-center justify-between">
        <div>
          <h1 class="mb-[6px] text-[26px] text-(--neon-purple)">Éditeur de Vidéo</h1>
          <p class="m-0 text-sm text-(--text-muted)">Modifiez les métadonnées ou remplacez le média. Visualisez le rendu en temps réel à droite.</p>
        </div>
        <NuxtLink to="/dashboard/videos" class="text-sm text-(--text-muted) no-underline">&larr; Retour au gestionnaire</NuxtLink>
      </div>

      <!-- Post-Save Success Banner avec Bouton direct "Voir la vidéo publiée" -->
      <div v-if="saveSuccess" class="mb-[25px] flex items-center justify-between gap-[15px] rounded-xl border border-[#10b981] bg-[#ecfdf5] px-6 py-[18px]">
        <div class="flex items-center gap-3">
          <span class="text-2xl">✅</span>
          <div>
            <h4 class="m-0 text-base text-[#065f46]">Modifications enregistrées avec succès !</h4>
            <span class="text-[13px] text-[#047857]">Vos modifications ont été publiées. Vous pouvez maintenant consulter le rendu final.</span>
          </div>
        </div>

        <NuxtLink :to="`/video/${videoId}`" class="inline-flex items-center justify-center rounded-md border border-[#10b981] bg-[#10b981] px-5 py-2.5 font-bold text-white no-underline shadow-[0_0_4px_rgba(16,185,129,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-[#10b981] hover:text-white hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
          👁 Voir la vidéo publiée
        </NuxtLink>
      </div>

      <div class="grid items-start gap-[30px] min-[993px]:grid-cols-[1.1fr_0.9fr]">
        
        <!-- COLONNE GAUCHE : FORMULAIRE D'ÉDITION -->
        <div class="rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          
          <form @submit.prevent="saveVideo" class="flex flex-col gap-[18px]">
            
            <div>
              <label class="mb-[6px] block text-sm font-semibold text-[#333]">Titre de la vidéo *</label>
              <input type="text" v-model="form.title" required class="w-full" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-[6px] block text-[13px] font-semibold text-[#333]">Catégorie *</label>
                <select v-model="form.category" required class="w-full">
                  <option value="Divertissement">Divertissement</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Musique">Musique</option>
                  <option value="Tutoriel">Tutoriel</option>
                  <option value="Sport">Sport</option>
                  <option value="Vlog">Vlog</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label class="mb-[6px] block text-[13px] font-semibold text-[#333]">Visibilité *</label>
                <select v-model="form.visibility" required class="w-full">
                  <option value="PUBLIC">🌐 Publique</option>
                  <option value="UNLISTED">🔗 Non répertoriée</option>
                  <option value="PRIVATE">🔒 Privée</option>
                </select>
              </div>
            </div>

            <!-- Option Contenu +18 (Restreint) -->
            <div class="flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fff5f5] px-3.5 py-2.5">
              <input type="checkbox" id="editIs18PlusInput" v-model="form.is18Plus" class="size-[18px] cursor-pointer" />
              <label for="editIs18PlusInput" class="cursor-pointer text-[13px] font-semibold text-[#dc2626]">
                🔞 Contenu réservé au public averti (+18)
              </label>
            </div>

            <!-- Option de remplacement du Fichier Vidéo -->
            <div class="rounded-[10px] border border-[#e2e8f0] bg-[#f8f9fa] p-3.5">
              <label class="mb-1 block text-[13px] font-semibold text-[#333]">
                📹 Remplacer le fichier vidéo (Facultatif)
              </label>
              <span class="mb-2 block text-[11px] text-[#666]">
                Fichier actuel: {{ form.filename }}
              </span>
              <input type="file" @change="handleNewVideoFile" accept="video/*" class="w-full" />
            </div>

            <!-- Option de remplacement de la Miniature -->
            <div class="rounded-[10px] border border-[#e2e8f0] bg-[#f8f9fa] p-3.5">
              <label class="mb-1 block text-[13px] font-semibold text-[#333]">
                🖼 Remplacer la miniature / Thumbnail (Facultatif)
              </label>
              <input type="file" @change="handleNewThumbFile" accept="image/*" class="w-full" />
            </div>

            <div>
              <label class="mb-[6px] block text-sm font-semibold text-[#333]">Description</label>
              <textarea v-model="form.description" rows="4" class="w-full resize-y"></textarea>
            </div>

            <!-- Progression de sauvegarde -->
            <div v-if="saving" class="mt-[5px]">
              <div class="mb-[6px] flex justify-between text-[13px] font-bold text-(--neon-purple)">
                <span>Enregistrement des modifications...</span>
                <span>{{ progress }}%</span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-[5px] bg-[#e2e8f0]">
                <div :style="{ width: `${progress}%` }" class="h-full bg-linear-to-r from-(--neon-purple) to-(--neon-pink) transition-[width] duration-200 ease-out"></div>
              </div>
            </div>

            <div class="mt-2.5 flex gap-3">
              <button type="submit" class="inline-flex flex-1 items-center justify-center rounded-md border border-(--neon-pink) p-3 text-[15px] text-(--neon-pink) shadow-[0_0_4px_rgba(255,20,147,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-(--neon-pink) hover:text-white hover:shadow-[0_4px_12px_rgba(255,20,147,0.3)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55" :disabled="saving">
                {{ saving ? `Sauvegarde (${progress}%)...` : 'Enregistrer les modifications' }}
              </button>
              
              <NuxtLink v-if="saveSuccess" :to="`/video/${videoId}`" class="inline-flex items-center justify-center rounded-md border border-(--neon-purple) px-[18px] py-3 text-sm font-bold text-(--neon-purple) no-underline shadow-[0_0_4px_rgba(138,43,226,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-(--neon-purple) hover:text-white hover:shadow-[0_4px_12px_rgba(138,43,226,0.3)]">
                👁 Voir la vidéo
              </NuxtLink>
            </div>

          </form>

        </div>

        <!-- COLONNE DROITE : SHOWCASE / APERÇU TEMPS RÉEL -->
        <div>
          <div class="sticky top-[90px] rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            
            <div class="mb-[15px] flex items-center justify-between">
              <h3 class="m-0 flex items-center gap-[6px] text-base text-[#111]">
                <span>✨</span> Rendu Final (Aperçu)
              </h3>
              <span class="rounded-[10px] bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#d97706]">
                Live Preview
              </span>
            </div>

            <!-- Live Video Player Showcase -->
            <div class="mb-[15px] flex min-h-[200px] items-center justify-center overflow-hidden rounded-[10px] bg-black">
              <video 
                :key="liveVideoUrl || form.filename"
                :src="liveVideoUrl || `/uploads/videos/${form.filename}`" 
                controls
                preload="none"
                class="block max-h-[280px] w-full"
              ></video>
            </div>

            <!-- Live Meta Showcase -->
            <div>
              <h3 class="mb-2 text-lg leading-[1.3] break-words text-[#111]">
                {{ form.title || 'Titre de la vidéo' }}
              </h3>

              <div class="mb-3 flex flex-wrap items-center gap-2.5 text-xs">
                <span class="rounded bg-[rgba(138,43,226,0.1)] px-2.5 py-1 text-[11px] font-semibold text-(--neon-purple)">{{ form.category }}</span>
                <span class="rounded bg-[#f1f5f9] px-2 py-0.5 font-semibold text-[#475569]">
                  {{ form.visibility === 'PRIVATE' ? '🔒 Privée' : form.visibility === 'UNLISTED' ? '🔗 Non répertoriée' : '🌐 Publique' }}
                </span>
                <span class="text-[#777]">👁 {{ viewsCount }} vues</span>
              </div>

              <!-- Thumbnail Showcase -->
              <div v-if="liveThumbUrl || form.thumbnail" class="mt-2.5">
                <span class="mb-1 block text-[11px] font-bold text-[#555]">Miniature d'illustration :</span>
                <img 
                  :src="liveThumbUrl || `/uploads/thumbnails/${form.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  class="h-[120px] w-full rounded-lg border border-(--neon-purple) object-cover"
                />
              </div>

              <div class="mt-3 max-h-[100px] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white p-4 text-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <p class="m-0 text-[#444]">{{ form.description || 'Aucune description rédigée.' }}</p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { VideoDetails } from '#shared/types/models'

const route = useRoute()
const router = useRouter()
const { token, user } = useAuth()

const videoId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')

const loading = ref(true)
const errorMsg = ref('')
const saving = ref(false)
const progress = ref(0)
const saveSuccess = ref(false)

const viewsCount = ref(0)

const form = ref({
  title: '',
  description: '',
  category: 'Divertissement',
  visibility: 'PUBLIC',
  is18Plus: false,
  filename: '',
  thumbnail: ''
})

const newVideoFile = ref<File | null>(null)
const newThumbFile = ref<File | null>(null)

const liveVideoUrl = ref('')
const liveThumbUrl = ref('')

const fetchVideoData = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<VideoDetails>(`/api/videos/${videoId.value}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    if (user.value && data.userId !== user.value.id) {
      errorMsg.value = "Vous n'êtes pas le propriétaire de cette vidéo."
      return
    }

    form.value = {
      title: data.title,
      description: data.description || '',
      category: data.category || 'Divertissement',
      visibility: data.visibility || 'PUBLIC',
      is18Plus: data.is18Plus || false,
      filename: data.filename,
      thumbnail: data.thumbnail || ''
    }
    viewsCount.value = data.views || 0
  } catch (error: unknown) {
    errorMsg.value = error instanceof Error ? error.message : 'Erreur lors du chargement de la vidéo.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVideoData()
})

onUnmounted(() => {
  // Revoke temporary blob Object URLs to prevent memory leaks (GC)
  if (liveVideoUrl.value && liveVideoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(liveVideoUrl.value)
  }
  if (liveThumbUrl.value && liveThumbUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(liveThumbUrl.value)
  }
})

const handleNewVideoFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // Revoke previous blob URL before creating a new one
    if (liveVideoUrl.value && liveVideoUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(liveVideoUrl.value)
    }
    newVideoFile.value = file
    liveVideoUrl.value = URL.createObjectURL(file)
  }
}

const handleNewThumbFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // Revoke previous blob URL before creating a new one
    if (liveThumbUrl.value && liveThumbUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(liveThumbUrl.value)
    }
    newThumbFile.value = file
    liveThumbUrl.value = URL.createObjectURL(file)
  }
}

const saveVideo = async () => {
  saving.value = true
  progress.value = 0
  saveSuccess.value = false

  const formData = new FormData()
  formData.append('title', form.value.title)
  formData.append('description', form.value.description)
  formData.append('category', form.value.category)
  formData.append('visibility', form.value.visibility)
  formData.append('is18Plus', String(form.value.is18Plus))

  if (newVideoFile.value) {
    formData.append('video', newVideoFile.value)
  }
  if (newThumbFile.value) {
    formData.append('thumbnail', newThumbFile.value)
  }

  const xhr = new XMLHttpRequest()

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      progress.value = Math.round((e.loaded * 100) / e.total)
    }
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const res = JSON.parse(xhr.responseText)
      form.value.title = res.video.title
      form.value.description = res.video.description
      form.value.category = res.video.category
      form.value.visibility = res.video.visibility
      if (res.video.filename) form.value.filename = res.video.filename
      if (res.video.thumbnail) form.value.thumbnail = res.video.thumbnail

      saveSuccess.value = true
    } else {
      alert("Erreur lors de la sauvegarde.")
    }
    saving.value = false
  }

  xhr.onerror = () => {
    alert("Erreur réseau lors de la sauvegarde.")
    saving.value = false
  }

  xhr.open('PUT', `/api/videos/${videoId.value}`, true)
  xhr.setRequestHeader('Authorization', `Bearer ${token.value}`)
  xhr.send(formData)
}
</script>

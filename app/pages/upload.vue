<template>
  <div class="mx-auto my-[30px] max-w-[1280px] px-5">
    
    <div class="mb-[25px]">
      <h1 class="mb-[6px] text-[26px] text-(--neon-purple)">Téléverser une vidéo</h1>
      <p class="m-0 text-sm text-(--text-muted)">Remplissez les informations de votre vidéo et visualisez l'aperçu en direct à droite.</p>
    </div>

    <!-- Layout 2 Colonnes -->
    <div class="grid items-start gap-[30px] min-[993px]:grid-cols-[1.1fr_0.9fr]">
      
      <!-- COLONNE GAUCHE : FORMULAIRE D'UPLOAD & PROGRESSION -->
      <div class="rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        
        <form @submit.prevent="uploadVideo" class="flex flex-col gap-[18px]">
          
          <div>
            <label class="mb-[6px] block text-sm font-semibold text-[#333]">Titre de la vidéo *</label>
            <input type="text" v-model="form.title" placeholder="Ex: Mon superbe voyage..." required class="w-full" />
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
            <input type="checkbox" id="is18PlusInput" v-model="form.is18Plus" class="size-[18px] cursor-pointer" />
            <label for="is18PlusInput" class="cursor-pointer text-[13px] font-semibold text-[#dc2626]">
              🔞 Contenu réservé au public averti (+18)
            </label>
          </div>

          <!-- Sélection du Fichier Vidéo Principal -->
          <div>
            <label class="mb-[6px] block text-sm font-semibold text-[#333]">Fichier vidéo MP4 / WEBM *</label>
            <input type="file" @change="handleVideoFileSelect" accept="video/*" required class="w-full" />
          </div>

          <!-- Option de Miniature Personnalisée -->
          <div>
            <label class="mb-[6px] block text-sm font-semibold text-[#333]">
              Miniature / Thumbnail (Facultatif)
            </label>
            <input type="file" @change="handleThumbFileSelect" accept="image/*" class="w-full" />
            <span class="mt-1 block text-[11px] text-[#777]">
              Si aucune image n'est fournie, une miniature sera générée automatiquement à partir de la vidéo.
            </span>
          </div>

          <div>
            <label class="mb-[6px] block text-sm font-semibold text-[#333]">Description</label>
            <textarea v-model="form.description" placeholder="Description de la vidéo..." rows="4" class="w-full resize-y"></textarea>
          </div>

          <!-- Barre de progression en temps réel (XHR Progress) -->
          <div v-if="uploading" class="mt-2.5">
            <div class="mb-[6px] flex justify-between text-[13px] font-bold text-(--neon-purple)">
              <span>Téléversement en cours...</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-[5px] bg-[#e2e8f0]">
              <div :style="{ width: `${progress}%` }" class="h-full bg-linear-to-r from-brand to-accent transition-[width] duration-200 ease-out"></div>
            </div>
          </div>

          <button type="submit" class="mt-2.5 inline-flex items-center justify-center rounded-md border border-(--neon-pink) p-3 text-[15px] text-(--neon-pink) shadow-[0_0_4px_rgba(255,20,147,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-(--neon-pink) hover:text-white hover:shadow-[0_4px_12px_rgba(255,20,147,0.3)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55" :disabled="uploading">
            {{ uploading ? `Téléversement (${progress}%)...` : 'Publier la vidéo' }}
          </button>
        </form>

      </div>

      <!-- COLONNE DROITE : APERÇU TEMPS RÉEL (SHOWCASE) -->
      <div>
        <div class="sticky top-[90px] rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          
          <div class="mb-[15px] flex items-center justify-between">
            <h3 class="m-0 flex items-center gap-[6px] text-base text-[#111]">
              <span>✨</span> Rendu Final (Aperçu)
            </h3>
            <span class="rounded-[10px] bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#d97706]">
              Showcase Live
            </span>
          </div>

          <!-- Lecteur Vidéo Showcase Temps Réel -->
          <div class="mb-[15px] flex min-h-[200px] items-center justify-center overflow-hidden rounded-[10px] bg-black">
            <video 
              v-if="liveVideoUrl" 
              :src="liveVideoUrl" 
              controls
              preload="none"
              class="block max-h-[280px] w-full"
            ></video>
            <div v-else class="p-10 text-center text-[13px] text-[#666]">
              <span class="mb-2 block text-[32px]">🎬</span>
              Sélectionnez un fichier vidéo pour afficher le lecteur en direct.
            </div>
          </div>

          <!-- Métadonnées Showcase Temps Réel -->
          <div>
            <h3 class="mb-2 text-lg leading-[1.3] break-words text-[#111]">
              {{ form.title || 'Titre de la vidéo' }}
            </h3>

            <div class="mb-3 flex flex-wrap items-center gap-2.5 text-xs">
              <span class="rounded bg-[rgba(138,43,226,0.1)] px-2.5 py-1 text-[11px] font-semibold text-(--neon-purple)">{{ form.category }}</span>
              <span class="rounded bg-[#f1f5f9] px-2 py-0.5 font-semibold text-[#475569]">
                {{ form.visibility === 'PRIVATE' ? '🔒 Privée' : form.visibility === 'UNLISTED' ? '🔗 Non répertoriée' : '🌐 Publique' }}
              </span>
              <span class="text-[#777]">👁 0 vue</span>
            </div>

            <!-- Aperçu de la Miniature -->
            <div v-if="liveThumbUrl" class="mt-2.5">
              <span class="mb-1 block text-[11px] font-bold text-[#555]">Miniature d'illustration :</span>
              <img :src="liveThumbUrl" loading="lazy" decoding="async" class="h-[120px] w-full rounded-lg border border-(--neon-purple) object-cover" />
            </div>

            <div class="mt-3 max-h-[100px] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white p-4 text-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p class="m-0 text-[#444]">{{ form.description || 'Aucune description rédigée.' }}</p>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- Hidden Canvas & Video for Automatic Thumbnail Extraction -->
    <video ref="hiddenVideoRef" class="hidden"></video>
    <canvas ref="hiddenCanvasRef" class="hidden"></canvas>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const form = ref({
  title: '',
  category: 'Divertissement',
  visibility: 'PUBLIC',
  is18Plus: false,
  description: ''
})

const videoFile = ref<File | null>(null)
const thumbFile = ref<File | null>(null)

const liveVideoUrl = ref('')
const liveThumbUrl = ref('')

const uploading = ref(false)
const progress = ref(0)

const hiddenVideoRef = ref<HTMLVideoElement | null>(null)
const hiddenCanvasRef = ref<HTMLCanvasElement | null>(null)

onUnmounted(() => {
  // Revoke all temporary Object URLs to free memory (GC-friendly)
  if (liveVideoUrl.value && liveVideoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(liveVideoUrl.value)
  }
  if (liveThumbUrl.value && liveThumbUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(liveThumbUrl.value)
  }
  // Clean up hidden video element
  if (hiddenVideoRef.value) {
    hiddenVideoRef.value.src = ''
  }
})

const handleVideoFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // Revoke previous URL before creating a new one
    if (liveVideoUrl.value && liveVideoUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(liveVideoUrl.value)
    }
    videoFile.value = file
    liveVideoUrl.value = URL.createObjectURL(file)

    if (!form.value.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      form.value.title = nameWithoutExt
    }

    if (!thumbFile.value) {
      extractAutomaticThumbnail(file)
    }
  }
}

const handleThumbFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // Revoke previous thumbnail URL before creating a new one
    if (liveThumbUrl.value && liveThumbUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(liveThumbUrl.value)
    }
    thumbFile.value = file
    liveThumbUrl.value = URL.createObjectURL(file)
  }
}

const extractAutomaticThumbnail = (file: File) => {
  const tempUrl = URL.createObjectURL(file)
  const vid = hiddenVideoRef.value
  if (!vid) return
  vid.src = tempUrl
  vid.currentTime = 1.0

  vid.onseeked = () => {
    const canvas = hiddenCanvasRef.value
    if (!canvas) return
    canvas.width = vid.videoWidth || 640
    canvas.height = vid.videoHeight || 360
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const autoFile = new File([blob], 'auto_thumb.jpg', { type: 'image/jpeg' })
        thumbFile.value = autoFile
        liveThumbUrl.value = URL.createObjectURL(autoFile)
      }
    }, 'image/jpeg', 0.85)
  }
}

const uploadVideo = () => {
  if (!videoFile.value) {
    alert("Veuillez sélectionner un fichier vidéo.")
    return
  }

  const formData = new FormData()
  formData.append('title', form.value.title)
  formData.append('description', form.value.description)
  formData.append('category', form.value.category)
  formData.append('visibility', form.value.visibility)
  formData.append('is18Plus', String(form.value.is18Plus))
  formData.append('video', videoFile.value)

  if (thumbFile.value) {
    formData.append('thumbnail', thumbFile.value)
  }

  const xhr = new XMLHttpRequest()

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      progress.value = Math.round((e.loaded * 100) / e.total)
    }
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      router.push('/')
    } else {
      const errRes = JSON.parse(xhr.responseText || '{}')
      alert(errRes.error || "Erreur lors de l'upload.")
      uploading.value = false
    }
  }

  xhr.onerror = () => {
    alert("Erreur réseau lors de l'upload.")
    uploading.value = false
  }

  xhr.open('POST', '/api/videos/upload', true)
  xhr.send(formData)
}
</script>

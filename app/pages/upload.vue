<template>
  <div style="max-width: 1280px; margin: 30px auto; padding: 0 20px;">
    
    <div style="margin-bottom: 25px;">
      <h1 style="color: var(--neon-purple); margin: 0 0 6px 0; font-size: 26px;">Téléverser une vidéo</h1>
      <p style="margin: 0; color: var(--text-muted); font-size: 14px;">Remplissez les informations de votre vidéo et visualisez l'aperçu en direct à droite.</p>
    </div>

    <!-- Layout 2 Colonnes -->
    <div class="upload-grid-layout">
      
      <!-- COLONNE GAUCHE : FORMULAIRE D'UPLOAD & PROGRESSION -->
      <div style="background: #ffffff; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        
        <form @submit.prevent="uploadVideo" style="display: flex; flex-direction: column; gap: 18px;">
          
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Titre de la vidéo *</label>
            <input type="text" v-model="form.title" placeholder="Ex: Mon superbe voyage..." required style="width: 100%;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #333;">Catégorie *</label>
              <select v-model="form.category" required style="width: 100%;">
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
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #333;">Visibilité *</label>
              <select v-model="form.visibility" required style="width: 100%;">
                <option value="PUBLIC">🌐 Publique</option>
                <option value="UNLISTED">🔗 Non répertoriée</option>
                <option value="PRIVATE">🔒 Privée</option>
              </select>
            </div>
          </div>

          <!-- Option Contenu +18 (Restreint) -->
          <div style="display: flex; align-items: center; gap: 8px; background: #fff5f5; padding: 10px 14px; border-radius: 8px; border: 1px solid #fecaca;">
            <input type="checkbox" id="is18PlusInput" v-model="form.is18Plus" style="width: 18px; height: 18px; cursor: pointer;" />
            <label for="is18PlusInput" style="font-size: 13px; font-weight: 600; color: #dc2626; cursor: pointer;">
              🔞 Contenu réservé au public averti (+18)
            </label>
          </div>

          <!-- Sélection du Fichier Vidéo Principal -->
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Fichier vidéo MP4 / WEBM *</label>
            <input type="file" @change="handleVideoFileSelect" accept="video/*" required style="width: 100%;" />
          </div>

          <!-- Option de Miniature Personnalisée -->
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">
              Miniature / Thumbnail (Facultatif)
            </label>
            <input type="file" @change="handleThumbFileSelect" accept="image/*" style="width: 100%;" />
            <span style="font-size: 11px; color: #777; margin-top: 4px; display: block;">
              Si aucune image n'est fournie, une miniature sera générée automatiquement à partir de la vidéo.
            </span>
          </div>

          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Description</label>
            <textarea v-model="form.description" placeholder="Description de la vidéo..." rows="4" style="width: 100%; resize: vertical;"></textarea>
          </div>

          <!-- Barre de progression en temps réel (XHR Progress) -->
          <div v-if="uploading" style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: var(--neon-purple);">
              <span>Téléversement en cours...</span>
              <span>{{ progress }}%</span>
            </div>
            <div style="height: 10px; width: 100%; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
              <div :style="{ width: `${progress}%` }" style="height: 100%; background: linear-gradient(90deg, var(--neon-purple) 0%, var(--neon-pink) 100%); transition: width 0.2s ease-out;"></div>
            </div>
          </div>

          <button type="submit" class="neon-btn neon-btn-pink" :disabled="uploading" style="margin-top: 10px; padding: 12px; font-size: 15px;">
            {{ uploading ? `Téléversement (${progress}%)...` : 'Publier la vidéo' }}
          </button>
        </form>

      </div>

      <!-- COLONNE DROITE : APERÇU TEMPS RÉEL (SHOWCASE) -->
      <div>
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); position: sticky; top: 90px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 16px; color: #111; display: flex; align-items: center; gap: 6px;">
              <span>✨</span> Rendu Final (Aperçu)
            </h3>
            <span style="font-size: 11px; background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px; font-weight: bold;">
              Showcase Live
            </span>
          </div>

          <!-- Lecteur Vidéo Showcase Temps Réel -->
          <div style="margin-bottom: 15px; background: #000; border-radius: 10px; overflow: hidden; min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <video 
              v-if="liveVideoUrl" 
              :src="liveVideoUrl" 
              controls
              preload="none"
              style="width: 100%; max-height: 280px; display: block;"
            ></video>
            <div v-else style="color: #666; font-size: 13px; text-align: center; padding: 40px;">
              <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎬</span>
              Sélectionnez un fichier vidéo pour afficher le lecteur en direct.
            </div>
          </div>

          <!-- Métadonnées Showcase Temps Réel -->
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111; line-height: 1.3; word-break: break-word;">
              {{ form.title || 'Titre de la vidéo' }}
            </h3>

            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; font-size: 12px;">
              <span class="category-badge">{{ form.category }}</span>
              <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                {{ form.visibility === 'PRIVATE' ? '🔒 Privée' : form.visibility === 'UNLISTED' ? '🔗 Non répertoriée' : '🌐 Publique' }}
              </span>
              <span style="color: #777;">👁 0 vue</span>
            </div>

            <!-- Aperçu de la Miniature -->
            <div v-if="liveThumbUrl" style="margin-top: 10px;">
              <span style="font-size: 11px; font-weight: bold; color: #555; display: block; margin-bottom: 4px;">Miniature d'illustration :</span>
              <img :src="liveThumbUrl" loading="lazy" decoding="async" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid var(--neon-purple);" />
            </div>

            <div class="description-box" style="margin-top: 12px; font-size: 13px; max-height: 100px; overflow-y: auto;">
              <p style="margin: 0; color: #444;">{{ form.description || 'Aucune description rédigée.' }}</p>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- Hidden Canvas & Video for Automatic Thumbnail Extraction -->
    <video ref="hiddenVideoRef" style="display: none;"></video>
    <canvas ref="hiddenCanvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const { token } = useAuth()
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
  xhr.setRequestHeader('Authorization', `Bearer ${token.value}`)
  xhr.send(formData)
}
</script>

<style scoped>
.upload-grid-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 30px;
  align-items: start;
}

@media (max-width: 992px) {
  .upload-grid-layout {
    grid-template-columns: 1fr;
  }
}
</style>

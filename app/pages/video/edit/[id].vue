<template>
  <div style="min-height: 100vh; background: #fcfcfc;">
    <div v-if="loading" style="text-align: center; color: var(--neon-purple); padding: 60px;">
      <h2>Chargement de l'éditeur vidéo...</h2>
    </div>

    <div v-else-if="errorMsg" style="text-align: center; padding: 60px;">
      <h2 style="color: var(--neon-pink);">{{ errorMsg }}</h2>
      <NuxtLink to="/dashboard/videos" class="neon-btn" style="margin-top: 15px; display: inline-block;">Retour au gestionnaire</NuxtLink>
    </div>

    <!-- Layout 2 Colonnes : Formulaire d'Édition & Showcase Live -->
    <div v-else style="max-width: 1280px; margin: 30px auto; padding: 0 20px;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div>
          <h1 style="color: var(--neon-purple); margin: 0 0 6px 0; font-size: 26px;">Éditeur de Vidéo</h1>
          <p style="margin: 0; color: var(--text-muted); font-size: 14px;">Modifiez les métadonnées ou remplacez le média. Visualisez le rendu en temps réel à droite.</p>
        </div>
        <NuxtLink to="/dashboard/videos" style="color: var(--text-muted); text-decoration: none; font-size: 14px;">&larr; Retour au gestionnaire</NuxtLink>
      </div>

      <!-- Post-Save Success Banner avec Bouton direct "Voir la vidéo publiée" -->
      <div v-if="saveSuccess" style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 18px 24px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; gap: 15px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">✅</span>
          <div>
            <h4 style="margin: 0; color: #065f46; font-size: 16px;">Modifications enregistrées avec succès !</h4>
            <span style="font-size: 13px; color: #047857;">Vos modifications ont été publiées. Vous pouvez maintenant consulter le rendu final.</span>
          </div>
        </div>

        <NuxtLink :to="`/video/${videoId}`" class="neon-btn" style="background: #10b981; color: white; border-color: #10b981; font-weight: bold; text-decoration: none; padding: 10px 20px;">
          👁 Voir la vidéo publiée
        </NuxtLink>
      </div>

      <div class="edit-grid-layout">
        
        <!-- COLONNE GAUCHE : FORMULAIRE D'ÉDITION -->
        <div style="background: #ffffff; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          
          <form @submit.prevent="saveVideo" style="display: flex; flex-direction: column; gap: 18px;">
            
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Titre de la vidéo *</label>
              <input type="text" v-model="form.title" required style="width: 100%;" />
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
              <input type="checkbox" id="editIs18PlusInput" v-model="form.is18Plus" style="width: 18px; height: 18px; cursor: pointer;" />
              <label for="editIs18PlusInput" style="font-size: 13px; font-weight: 600; color: #dc2626; cursor: pointer;">
                🔞 Contenu réservé au public averti (+18)
              </label>
            </div>

            <!-- Option de remplacement du Fichier Vidéo -->
            <div style="background: #f8f9fa; border-radius: 10px; padding: 14px; border: 1px solid #e2e8f0;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px; color: #333;">
                📹 Remplacer le fichier vidéo (Facultatif)
              </label>
              <span style="display: block; font-size: 11px; color: #666; margin-bottom: 8px;">
                Fichier actuel: {{ form.filename }}
              </span>
              <input type="file" @change="handleNewVideoFile" accept="video/*" style="width: 100%;" />
            </div>

            <!-- Option de remplacement de la Miniature -->
            <div style="background: #f8f9fa; border-radius: 10px; padding: 14px; border: 1px solid #e2e8f0;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px; color: #333;">
                🖼 Remplacer la miniature / Thumbnail (Facultatif)
              </label>
              <input type="file" @change="handleNewThumbFile" accept="image/*" style="width: 100%;" />
            </div>

            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Description</label>
              <textarea v-model="form.description" rows="4" style="width: 100%; resize: vertical;"></textarea>
            </div>

            <!-- Progression de sauvegarde -->
            <div v-if="saving" style="margin-top: 5px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: var(--neon-purple);">
                <span>Enregistrement des modifications...</span>
                <span>{{ progress }}%</span>
              </div>
              <div style="height: 10px; width: 100%; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                <div :style="{ width: `${progress}%` }" style="height: 100%; background: linear-gradient(90deg, var(--neon-purple) 0%, var(--neon-pink) 100%); transition: width 0.2s ease-out;"></div>
              </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 10px;">
              <button type="submit" class="neon-btn neon-btn-pink" :disabled="saving" style="flex: 1; padding: 12px; font-size: 15px;">
                {{ saving ? `Sauvegarde (${progress}%)...` : 'Enregistrer les modifications' }}
              </button>
              
              <NuxtLink v-if="saveSuccess" :to="`/video/${videoId}`" class="neon-btn" style="text-decoration: none; padding: 12px 18px; font-size: 14px; font-weight: bold;">
                👁 Voir la vidéo
              </NuxtLink>
            </div>

          </form>

        </div>

        <!-- COLONNE DROITE : SHOWCASE / APERÇU TEMPS RÉEL -->
        <div>
          <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); position: sticky; top: 90px;">
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
              <h3 style="margin: 0; font-size: 16px; color: #111; display: flex; align-items: center; gap: 6px;">
                <span>✨</span> Rendu Final (Aperçu)
              </h3>
              <span style="font-size: 11px; background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px; font-weight: bold;">
                Live Preview
              </span>
            </div>

            <!-- Live Video Player Showcase -->
            <div style="margin-bottom: 15px; background: #000; border-radius: 10px; overflow: hidden; min-height: 200px; display: flex; align-items: center; justify-content: center;">
              <video 
                :key="liveVideoUrl || form.filename"
                :src="liveVideoUrl || `/uploads/videos/${form.filename}`" 
                controls
                preload="none"
                style="width: 100%; max-height: 280px; display: block;"
              ></video>
            </div>

            <!-- Live Meta Showcase -->
            <div>
              <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111; line-height: 1.3; word-break: break-word;">
                {{ form.title || 'Titre de la vidéo' }}
              </h3>

              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; font-size: 12px;">
                <span class="category-badge">{{ form.category }}</span>
                <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                  {{ form.visibility === 'PRIVATE' ? '🔒 Privée' : form.visibility === 'UNLISTED' ? '🔗 Non répertoriée' : '🌐 Publique' }}
                </span>
                <span style="color: #777;">👁 {{ viewsCount }} vues</span>
              </div>

              <!-- Thumbnail Showcase -->
              <div v-if="liveThumbUrl || form.thumbnail" style="margin-top: 10px;">
                <span style="font-size: 11px; font-weight: bold; color: #555; display: block; margin-bottom: 4px;">Miniature d'illustration :</span>
                <img 
                  :src="liveThumbUrl || `/uploads/thumbnails/${form.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid var(--neon-purple);" 
                />
              </div>

              <div class="description-box" style="margin-top: 12px; font-size: 13px; max-height: 100px; overflow-y: auto;">
                <p style="margin: 0; color: #444;">{{ form.description || 'Aucune description rédigée.' }}</p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { token, user, isAuthenticated } = useAuth()

const videoId = computed(() => route.params.id)

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

const newVideoFile = ref(null)
const newThumbFile = ref(null)

const liveVideoUrl = ref('')
const liveThumbUrl = ref('')

const fetchVideoData = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch(`/api/videos/${videoId.value}`, {
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
  } catch (err) {
    errorMsg.value = err.data?.error || 'Erreur lors du chargement de la vidéo.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
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

const handleNewVideoFile = (e) => {
  const file = e.target.files[0]
  if (file) {
    // Revoke previous blob URL before creating a new one
    if (liveVideoUrl.value && liveVideoUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(liveVideoUrl.value)
    }
    newVideoFile.value = file
    liveVideoUrl.value = URL.createObjectURL(file)
  }
}

const handleNewThumbFile = (e) => {
  const file = e.target.files[0]
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
  formData.append('is18Plus', form.value.is18Plus)

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

<style scoped>
.edit-grid-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 30px;
  align-items: start;
}

@media (max-width: 992px) {
  .edit-grid-layout {
    grid-template-columns: 1fr;
  }
}
</style>

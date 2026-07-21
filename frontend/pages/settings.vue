<template>
  <div class="settings-wrapper">
    <div class="settings-header">
      <div>
        <h1 class="settings-title">Modifier le Profil</h1>
        <p class="settings-subtitle">Mettez à jour vos informations personnelles et votre avatar.</p>
      </div>
      <NuxtLink to="/channel" class="back-link">&larr; Retour à mon profil</NuxtLink>
    </div>

    <div v-if="loading" class="loading-state">
      Chargement de vos paramètres...
    </div>

    <div v-else class="settings-card">
      
      <!-- AVATAR SELECTION MODULE & PREVIEW BEFORE CONFIRMATION -->
      <div class="avatar-section">
        <label class="form-label">Photo de profil (Avatar)</label>
        
        <div class="avatar-row">
          <div class="avatar-preview-box">
            <img 
              :src="avatarUrl" 
              loading="lazy"
              decoding="async"
              class="profile-avatar-preview" 
            />
            
            <label 
              for="avatar-file-input" 
              class="avatar-overlay-label"
            >
              📷 Changer
            </label>
            <input id="avatar-file-input" type="file" accept="image/*" class="hidden-input" @change="handleLocalAvatarUpload" />
          </div>

          <div class="avatar-controls">
            <div class="avatar-option">
              <span class="option-title">Option 1: Importer depuis votre ordinateur</span>
              <input type="file" accept="image/*" @change="handleLocalAvatarUpload" class="file-input-sm" />
            </div>

            <div class="avatar-option">
              <span class="option-title">Option 2: URL de l'image</span>
              <input type="text" v-model="form.avatar" placeholder="https://..." class="full-input-sm" />
            </div>
            
            <span v-if="avatarPreviewTemp" class="preview-warning">
              ⚠️ Prévisualisation (Modifications non enregistrées)
            </span>
          </div>
        </div>
      </div>

      <!-- FORMULAIRE DES INFORMATIONS -->
      <form @submit.prevent="updateProfile" class="profile-form">
        
        <div>
          <label class="form-label">Nom d'utilisateur</label>
          <input type="text" v-model="form.username" required class="full-input" />
        </div>

        <div>
          <label class="form-label">Adresse Email (Non modifiable)</label>
          <input type="email" :value="form.email" disabled class="full-input disabled-input" />
        </div>

        <div>
          <label class="form-label">Biographie / Description de la chaîne</label>
          <textarea v-model="form.bio" rows="4" placeholder="Présentez-vous à votre audience..." class="full-textarea"></textarea>
        </div>

        <div>
          <label class="form-label">Date de naissance (Strictement privée 🔒)</label>
          <input type="date" v-model="form.birthdate" class="full-input" />
          <span class="privacy-note">
            Votre âge est utilisé uniquement pour débloquer l'accès au catalogue mature (+18). Cette information n'est jamais publiée sur votre profil.
          </span>
        </div>

        <div class="form-actions">
          <NuxtLink to="/channel" class="neon-btn cancel-btn">Annuler</NuxtLink>
          <button type="submit" class="neon-btn neon-btn-pink submit-btn" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Confirmer / Enregistrer les modifications' }}
          </button>
        </div>

      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const { token, isAuthenticated, setUser } = useAuth()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const avatarPreviewTemp = ref(false)
// Track blob URL for cleanup when leaving the page
let tempBlobUrl = null

const form = ref({
  username: '',
  email: '',
  bio: '',
  avatar: '',
  birthdate: ''
})

const avatarUrl = computed(() => {
  if (form.value.avatar) return form.value.avatar
  const seed = form.value.username ? encodeURIComponent(form.value.username) : 'default'
  return 'https://api.dicebear.com/7.x/bottts/svg?seed=' + seed
})

const fetchProfile = async () => {
  try {
    const data = await $fetch('http://localhost:4000/api/users/me', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    form.value = {
      username: data.username,
      email: data.email,
      bio: data.bio || '',
      avatar: data.avatar || '',
      birthdate: data.birthdate || ''
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  fetchProfile()
})

onUnmounted(() => {
  // Revoke any temporary blob URLs to free memory (GC)
  if (tempBlobUrl) {
    URL.revokeObjectURL(tempBlobUrl)
    tempBlobUrl = null
  }
})

const handleLocalAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    // Revoke previous temp blob URL to prevent memory leak
    if (tempBlobUrl) {
      URL.revokeObjectURL(tempBlobUrl)
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      form.value.avatar = event.target.result
      avatarPreviewTemp.value = true
    }
    reader.readAsDataURL(file)
  }
}

const updateProfile = async () => {
  saving.value = true
  try {
    const res = await $fetch('http://localhost:4000/api/users/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token.value}` },
      body: {
        username: form.value.username,
        bio: form.value.bio,
        avatar: form.value.avatar,
        birthdate: form.value.birthdate
      }
    })

    if (res.user) {
      setUser(res.user)
    }

    avatarPreviewTemp.value = false
    alert('Profil mis à jour avec succès !')
    router.push('/channel')
  } catch (err) {
    alert(err.data?.error || 'Erreur lors de la mise à jour du profil.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-wrapper {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.settings-title {
  margin: 0;
  font-size: 26px;
  color: #111111;
}

.settings-subtitle {
  margin: 5px 0 0 0;
  color: var(--text-muted);
  font-size: 14px;
}

.back-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
}

.loading-state {
  text-align: center;
  color: var(--neon-purple);
  padding: 40px;
}

.settings-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.avatar-section {
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid #e2e8f0;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333333;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 25px;
  flex-wrap: wrap;
}

.avatar-preview-box {
  position: relative;
}

.avatar-controls {
  flex: 1;
  min-width: 250px;
}

.avatar-option {
  margin-bottom: 12px;
}

.option-title {
  font-size: 13px;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 4px;
}

.file-input-sm {
  font-size: 12px;
}

.full-input-sm {
  width: 100%;
  font-size: 13px;
}

.preview-warning {
  font-size: 11px;
  color: #d97706;
  font-weight: bold;
  margin-top: 8px;
  display: block;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.full-input {
  width: 100%;
}

.disabled-input {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.full-textarea {
  width: 100%;
  resize: vertical;
}

.privacy-note {
  font-size: 11px;
  color: #666666;
  margin-top: 4px;
  display: block;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

.cancel-btn {
  text-decoration: none;
  padding: 10px 18px;
  font-size: 14px;
}

.submit-btn {
  padding: 10px 24px;
  font-size: 14px;
}

.profile-avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid var(--neon-purple);
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-overlay-label {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.avatar-overlay-label:hover {
  opacity: 1;
}

.hidden-input {
  display: none;
}
</style>

<template>
  <div style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <div>
        <h1 style="margin: 0; font-size: 26px; color: #111;">Modifier le Profil</h1>
        <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 14px;">Mettez à jour vos informations personnelles et votre avatar.</p>
      </div>
      <NuxtLink to="/channel" style="color: var(--text-muted); text-decoration: none; font-size: 14px;">&larr; Retour à mon profil</NuxtLink>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--neon-purple); padding: 40px;">
      Chargement de vos paramètres...
    </div>

    <div v-else style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
      
      <!-- AVATAR SELECTION MODULE & PREVIEW BEFORE CONFIRMATION -->
      <div style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #e2e8f0;">
        <label style="display: block; font-weight: 600; margin-bottom: 15px; font-size: 15px; color: #111;">
          Photo de profil (Avatar)
        </label>
        
        <div style="display: flex; align-items: center; gap: 25px; flex-wrap: wrap;">
          <div style="position: relative; group">
            <img 
              :src="form.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${form.username}`" 
              loading="lazy"
              decoding="async"
              style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--neon-purple); object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" 
            />
            
            <label 
              for="avatar-file-input" 
              style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; opacity: 0; cursor: pointer; transition: opacity 0.2s;"
              onmouseover="this.style.opacity='1'"
              onmouseout="this.style.opacity='0'"
            >
              📷 Changer
            </label>
            <input 
              id="avatar-file-input" 
              type="file" 
              accept="image/*" 
              @change="handleLocalAvatarUpload" 
              style="display: none;" 
            />
          </div>

          <div style="flex: 1; min-width: 250px;">
            <div style="margin-bottom: 12px;">
              <span style="font-size: 13px; font-weight: 600; color: #333; display: block; margin-bottom: 4px;">Option 1: Importer depuis votre ordinateur</span>
              <input type="file" accept="image/*" @change="handleLocalAvatarUpload" style="font-size: 12px;" />
            </div>

            <div>
              <span style="font-size: 13px; font-weight: 600; color: #333; display: block; margin-bottom: 4px;">Option 2: URL de l'image</span>
              <input type="text" v-model="form.avatar" placeholder="https://..." style="width: 100%; font-size: 13px;" />
            </div>
            
            <span v-if="avatarPreviewTemp" style="font-size: 11px; color: #d97706; font-weight: bold; margin-top: 8px; display: block;">
              ⚠️ Prévisualisation (Modifications non enregistrées)
            </span>
          </div>
        </div>
      </div>

      <!-- FORMULAIRE DES INFORMATIONS -->
      <form @submit.prevent="updateProfile" style="display: flex; flex-direction: column; gap: 20px;">
        
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Nom d'utilisateur</label>
          <input type="text" v-model="form.username" required style="width: 100%;" />
        </div>

        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Adresse Email (Non modifiable)</label>
          <input type="email" :value="form.email" disabled style="width: 100%; background: #f1f5f9; color: #64748b; cursor: not-allowed;" />
        </div>

        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">Biographie / Description de la chaîne</label>
          <textarea v-model="form.bio" rows="4" placeholder="Présentez-vous à votre audience..." style="width: 100%; resize: vertical;"></textarea>
        </div>

        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333;">
            Date de naissance (Strictement privée 🔒)
          </label>
          <input type="date" v-model="form.birthdate" style="width: 100%;" />
          <span style="font-size: 11px; color: #666; margin-top: 4px; display: block;">
            Votre âge est utilisé uniquement pour débloquer l'accès au catalogue mature (+18). Cette information n'est jamais publiée sur votre profil.
          </span>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
          <NuxtLink to="/channel" class="neon-btn" style="text-decoration: none; padding: 10px 18px; font-size: 14px;">Annuler</NuxtLink>
          <button type="submit" class="neon-btn neon-btn-pink" :disabled="saving" style="padding: 10px 24px; font-size: 14px;">
            {{ saving ? 'Enregistrement...' : 'Confirmer / Enregistrer les modifications' }}
          </button>
        </div>

      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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

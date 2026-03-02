import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store before mounting
// This restores the session from persisted storage
const authStore = useAuthStore()
authStore.initAuth()

// Handle OAuth callback on app load
authStore.handleOAuthCallback()

app.mount('#app')

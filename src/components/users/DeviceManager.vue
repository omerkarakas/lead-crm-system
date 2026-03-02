<template>
  <div class="device-manager">
    <!-- Header Actions -->
    <div class="header-actions">
      <button
        v-if="sessions.length > 1"
        @click="confirmRevokeAll"
        class="btn btn-secondary btn-sm"
        :disabled="loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
          <line x1="12" y1="2" x2="12" y2="12"></line>
        </svg>
        Revoke all other sessions
      </button>
      <button @click="refreshSessions" class="btn btn-secondary btn-sm" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && sessions.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading sessions...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
      <h3>No active sessions</h3>
      <p>You don't have any active sessions on other devices.</p>
    </div>

    <!-- Sessions List -->
    <div v-else class="sessions-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="['session-card', { 'current-session': session.id === currentSessionId }]"
      >
        <div class="session-icon">
          <svg v-if="session.deviceType === 'desktop'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <svg v-else-if="session.deviceType === 'mobile'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>

        <div class="session-info">
          <div class="session-header">
            <h3 class="session-name">{{ session.deviceName }}</h3>
            <span v-if="session.id === currentSessionId" class="current-badge">Current session</span>
          </div>
          <div class="session-details">
            <span class="session-time">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Last active {{ formatRelativeTime(session.updated) }}
            </span>
            <span v-if="session.ipAddress" class="session-ip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
              {{ session.ipAddress }}
            </span>
          </div>
        </div>

        <div v-if="session.id !== currentSessionId" class="session-actions">
          <button
            @click="confirmRevoke(session)"
            class="btn btn-danger btn-sm"
            :disabled="revoking === session.id ? true : undefined"
          >
            {{ revoking === session.id ? 'Revoking...' : 'Revoke' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Revoke Confirmation Modal -->
    <div v-if="showRevokeConfirm" class="modal-overlay" @click.self="cancelRevoke">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Confirm Revoke</h2>
          <button @click="cancelRevoke" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p v-if="sessionToRevoke">
            Are you sure you want to revoke the session for <strong>{{ sessionToRevoke.deviceName }}</strong>?
          </p>
          <p v-else>
            Are you sure you want to revoke all other sessions? This will sign you out of all devices except your current one.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="cancelRevoke" class="btn btn-secondary">Cancel</button>
          <button @click="executeRevoke" class="btn btn-danger" :disabled="!!revoking">
            {{ revoking ? 'Revoking...' : 'Revoke' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { SessionRecord } from '@/types/sessions';

const authStore = useAuthStore();

const sessions = computed(() => authStore.sessions);
const currentSessionId = computed(() => authStore.currentSessionId);
const loading = ref(false);
const revoking = ref<string | 'all' | null>(null);
const showRevokeConfirm = ref(false);
const sessionToRevoke = ref<SessionRecord | null>(null);

let refreshInterval: number | null = null;

const isEmpty = computed(() => sessions.value.length === 0 && !loading.value);

onMounted(() => {
  loadSessions();
  // Auto-refresh every 30 seconds
  refreshInterval = window.setInterval(() => {
    loadSessions();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval);
  }
});

async function loadSessions() {
  loading.value = true;
  try {
    await authStore.fetchActiveSessions();
  } finally {
    loading.value = false;
  }
}

function refreshSessions() {
  loadSessions();
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function confirmRevoke(session: SessionRecord) {
  sessionToRevoke.value = session;
  showRevokeConfirm.value = true;
}

function confirmRevokeAll() {
  sessionToRevoke.value = null;
  showRevokeConfirm.value = true;
}

function cancelRevoke() {
  showRevokeConfirm.value = false;
  sessionToRevoke.value = null;
}

async function executeRevoke() {
  try {
    if (sessionToRevoke.value) {
      revoking.value = sessionToRevoke.value.id;
      await authStore.revokeSession(sessionToRevoke.value.id);
    } else {
      revoking.value = 'all';
      await authStore.revokeAllOtherSessions();
    }
    showRevokeConfirm.value = false;
    sessionToRevoke.value = null;
  } catch (error) {
    console.error('Failed to revoke session:', error);
  } finally {
    revoking.value = null;
  }
}
</script>

<style scoped>
.device-manager {
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-secondary {
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.session-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.session-card.current-session {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.session-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  color: #6b7280;
}

.current-session .session-icon {
  background-color: #dbeafe;
  color: #2563eb;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.session-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.current-badge {
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  background-color: #dbeafe;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.session-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.session-time,
.session-ip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.session-actions {
  flex-shrink: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sm {
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #4b5563;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  color: #374151;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}
</style>

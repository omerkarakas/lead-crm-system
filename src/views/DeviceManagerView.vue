<template>
  <div class="device-manager-view">
    <div class="page-header">
      <div class="breadcrumb">
        <router-link to="/dashboard">Dashboard</router-link>
        <span class="separator">/</span>
        <span class="current">Active Sessions</span>
      </div>
      <h1>Active Sessions</h1>
      <p class="description">
        Manage your active sessions across devices. You can revoke sessions you no longer recognize.
      </p>
    </div>

    <div class="content">
      <DeviceManager />
    </div>
  </div>
</template>

<script setup lang="ts">
import DeviceManager from '@/components/users/DeviceManager.vue';
</script>

<style scoped>
.device-manager-view {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.breadcrumb a {
  color: #6b7280;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: #3b82f6;
}

.breadcrumb .separator {
  color: #d1d5db;
}

.breadcrumb .current {
  color: #1f2937;
  font-weight: 500;
}

h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.description {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.content {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 2rem;
}
</style>

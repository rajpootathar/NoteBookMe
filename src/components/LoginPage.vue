<script setup>
import { ref } from 'vue';
import { authService } from '../services/authService';

const emit = defineEmits(['loginSuccess']);

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const showPassword = ref(false);

async function handleLogin() {
  error.value = '';
  isLoading.value = true;
  
  try {
    await authService.login(username.value, password.value);
    emit('loginSuccess');
  } catch (err) {
    error.value = err.message || 'Invalid credentials';
  } finally {
    isLoading.value = false;
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}
</script>

<template>
  <div class="login-page">
    <!-- Animated background -->
    <div class="bg-gradient"></div>
    <div class="bg-pattern"></div>
    
    <div class="login-container">
      <!-- Branding -->
      <div class="login-brand">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <span class="logo-emoji">📝</span>
          </div>
          <div class="logo-glow"></div>
        </div>
        <h1 class="app-name">NotebookME</h1>
        <p class="app-tagline">Your ideas, beautifully organized</p>
      </div>
      
      <!-- Login Card -->
      <div class="login-card">
        <div class="card-header">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your notes</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label for="username">
              <span class="label-icon">👤</span>
              Username
            </label>
            <div class="input-wrapper">
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="Enter your username"
                autocomplete="username"
                required
                :disabled="isLoading"
              />
            </div>
          </div>
          
          <div class="input-group">
            <label for="password">
              <span class="label-icon">🔒</span>
              Password
            </label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                :disabled="isLoading"
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="togglePasswordVisibility"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          
          <div v-if="error" class="error-alert">
            <span class="error-icon">⚠️</span>
            {{ error }}
          </div>
          
          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="btn-loader"></span>
            <span v-else class="btn-content">
              <span>Sign In</span>
              <span class="btn-arrow">→</span>
            </span>
          </button>
        </form>
        
        <div class="card-footer">
          <div class="security-badge">
            <span>🔐</span>
            <span>Secure login</span>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <p class="login-footer">
        Press <kbd>Enter</kbd> to sign in
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
  z-index: 1000;
}

/* Animated background */
.bg-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 60%);
  animation: gradientPulse 8s ease-in-out infinite;
}

@keyframes gradientPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
  background-size: 40px 40px;
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

/* Branding */
.login-brand {
  text-align: center;
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: var(--space-4);
}

.logo-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
}

.logo-emoji {
  font-size: 40px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.logo-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
  filter: blur(20px);
  z-index: -1;
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.app-name {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-2);
}

.app-tagline {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

/* Login Card */
.login-card {
  width: 100%;
  padding: var(--space-8);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: scaleIn 0.5s ease 0.1s both;
}

.card-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: var(--space-1);
}

.card-header p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-group label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.label-icon {
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: var(--space-4);
  padding-right: var(--space-12);
  font-size: 1rem;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input-wrapper input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.toggle-password {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.toggle-password:hover {
  opacity: 1;
}

/* Error */
.error-alert {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: #fca5a5;
  font-size: 0.875rem;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.error-icon {
  font-size: 1rem;
}

/* Submit button */
.submit-btn {
  width: 100%;
  padding: var(--space-4);
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.submit-btn:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.5);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.btn-arrow {
  transition: transform var(--transition-fast);
}

.submit-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.card-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.login-footer {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
  animation: fadeIn 0.5s ease 0.3s both;
}

.login-footer kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin: 0 2px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive */
@media (max-width: 480px) {
  .login-page {
    padding: var(--space-4);
  }
  
  .login-card {
    padding: var(--space-6);
  }
  
  .app-name {
    font-size: 1.75rem;
  }
  
  .logo-icon {
    width: 64px;
    height: 64px;
  }
  
  .logo-emoji {
    font-size: 32px;
  }
}
</style>

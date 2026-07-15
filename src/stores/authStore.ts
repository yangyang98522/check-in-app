import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!user.value)

  async function init(): Promise<void> {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user || null

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
  }

  async function signUp(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) throw err
      user.value = data.user
      return true
    } catch (err) {
      error.value = (err as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      user.value = data.user
      return true
    } catch (err) {
      error.value = (err as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, loading, error, isLoggedIn, init, signUp, signIn, signOut }
})

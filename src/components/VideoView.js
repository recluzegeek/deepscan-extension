import { ref, h } from '../lib/vue.runtime.esm-browser.js'
import * as api from '../utils/api.js'

export default {
  name: 'VideoView',
  emits: ['logout'],
  setup(props, { emit }) {
    const url = ref('')
    const result = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const handleSubmit = async () => {
      try {
        loading.value = true
        error.value = null
        result.value = await api.analyzeVideo(url.value)
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const handleLogout = async () => {
      try {
        await api.logout()
        emit('logout')
      } catch (err) {
        error.value = err.message
      }
    }

    return () => h('div', { class: 'video-container' }, [
      h('div', { class: 'video-header' }, [
        h('h2', {}, 'Analyze Video'),
        h('button', { 
          class: 'logout-btn',
          onClick: handleLogout
        }, [
          h('i', { class: 'fas fa-sign-out-alt' }),
          'Logout'
        ])
      ]),

      h('form', {
        class: 'video-form',
        onSubmit: (e) => {
          e.preventDefault()
          handleSubmit()
        }
      }, [
        h('div', { class: 'input-group' }, [
          h('i', { class: 'fas fa-link' }),
          h('input', {
            type: 'url',
            placeholder: 'Enter video URL',
            value: url.value,
            onInput: (e) => url.value = e.target.value,
            required: true,
            disabled: loading.value
          })
        ]),
        h('button', {
          type: 'submit',
          class: 'analyze-btn',
          disabled: loading.value
        }, [
          h('span', {
            style: { display: loading.value ? 'none' : 'inline' }
          }, 'Analyze'),
          h('span', {
            class: 'loading-spinner',
            style: { display: loading.value ? 'inline' : 'none' }
          })
        ])
      ]),

      error.value && h('div', { class: 'error-message' }, [
        h('i', { class: 'fas fa-exclamation-circle' }),
        error.value
      ]),

      result.value && h('div', { class: 'result-container' }, [
        h('h3', {}, 'Analysis Result'),
        h('div', { class: 'result-details' }, [
          h('p', {}, [
            'Confidence: ',
            h('span', { class: 'confidence' }, `${result.value.confidence}%`)
          ]),
          h('p', {}, [
            'Verdict: ',
            h('span', { 
              class: result.value.isDeepfake ? 'deepfake' : 'authentic'
            }, result.value.isDeepfake ? 'Deepfake' : 'Authentic')
          ])
        ])
      ])
    ])
  }
} 
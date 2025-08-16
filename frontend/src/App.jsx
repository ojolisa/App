import { useMemo, useRef, useState } from 'react'
import './App.css'

function App() {
  const API_BASE = useMemo(() => {
    // Prefer explicit URL via env; fall back to vite dev proxy path
    return import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '/api'
  }, [])

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function onPickFile(e) {
    const f = e.target.files?.[0]
    setResult(null)
    setError('')
    if (!f) {
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
      return
    }
    setFile(f)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const resp = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: form,
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        const msg = data?.error || data?.details || `Request failed (${resp.status})`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }
      setResult(data)
    } catch (err) {
      setError(err?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setResult(null)
    setError('')
    inputRef.current?.value && (inputRef.current.value = '')
  }

  return (
    <div>
      <h1>Image Classification</h1>
      <p className="read-the-docs">Upload an image to check if it's REAL or FAKE.</p>

      <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gap: 12 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
        />
        {previewUrl && (
          <div>
            <img
              src={previewUrl}
              alt="preview"
              style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8, border: '1px solid #333' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button type="submit" disabled={!file || loading}>
            {loading ? 'Predicting…' : 'Predict'}
          </button>
          <button type="button" onClick={reset} disabled={loading && !file}>
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: '#f66', marginTop: 12 }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <h2>Prediction</h2>
          <p>
            <strong>Label:</strong> {result.prediction}
          </p>
          {'confidence' in result && (
            <p>
              <strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%
            </p>
          )}
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: '#888' }}>
        Backend: {API_BASE}
      </p>
    </div>
  )
}

export default App

import { useMemo, useRef, useState, useCallback } from "react";
import "./App.css";

function App() {
  const API_BASE = useMemo(() => {
    // Prefer explicit URL via env; fall back to vite dev proxy path
    return import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "/api";
  }, []);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((f) => {
    if (!f) return { ok: false, message: "No file selected" };
    if (!f.type.startsWith("image/"))
      return { ok: false, message: "Please select an image file" };
    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (f.size > maxBytes)
      return { ok: false, message: "Image must be 25MB or smaller" };
    return { ok: true };
  }, []);

  function setChosenFile(f) {
    setResult(null);
    setError("");
    if (!f) {
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      return;
    }
    const valid = validateFile(f);
    if (!valid.ok) {
      setError(valid.message);
      return;
    }
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function onPickFile(e) {
    const f = e.target.files?.[0];
    setChosenFile(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg =
          data?.error || data?.details || `Request failed (${resp.status})`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          "Unexpected error" +
            ' Visit <a href="https://model-inference.onrender.com" target="_blank">https://model-inference.onrender.com</a> and wait for the inference server to restart.'
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setResult(null);
    setError("");
    inputRef.current?.value && (inputRef.current.value = "");
  }

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    setChosenFile(f);
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>Image Authenticity Checker</h1>
        <p className="muted">
          Upload or drop an image to classify it as Real or Fake.
        </p>
      </header>

      <form onSubmit={onSubmit} className="panel">
        <label
          className={`dropzone ${dragActive ? "drag" : ""}`}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            style={{ display: "none" }}
          />
          <div>
            <div className="dz-title">Drag & drop image here</div>
            <div className="dz-sub">or click to browse</div>
            {file && <div className="file-name">{file.name}</div>}
          </div>
        </label>

        {previewUrl && (
          <div className="preview">
            <img src={previewUrl} alt="Selected preview" />
          </div>
        )}

        <div className="actions">
          <button type="submit" disabled={!file || loading} className="primary">
            {loading ? "Predicting…" : "Predict"}
          </button>
          <button type="button" onClick={reset} disabled={loading && !file}>
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <section className="panel">
          <h2 className="section-title">Prediction</h2>
          <div className="result">
            <span
              className={`badge ${String(result.prediction).toLowerCase()}`}
            >
              {result.prediction}
            </span>
            {"confidence" in result && (
              <span className="confidence">
                {(result.confidence * 100).toFixed(2)}% confidence
              </span>
            )}
          </div>
        </section>
      )}

      <footer className="footer">
        <span className="muted">Backend: {API_BASE}</span>
      </footer>
    </div>
  );
}

export default App;

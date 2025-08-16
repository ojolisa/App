require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Config
const PORT = process.env.PORT || 4000;
const FLASK_URL = process.env.FLASK_URL || 'http://127.0.0.1:3000';

app.use(morgan('dev'));
app.use(cors());
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'express', flaskUrl: FLASK_URL });
});

// Proxy to Flask inference
app.post('/predict', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, { filename: req.file.originalname || 'image.jpg', contentType: req.file.mimetype || 'application/octet-stream' });

    const flaskResp = await axios.post(`${FLASK_URL}/predict`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 20000
    });

    res.status(flaskResp.status).json(flaskResp.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({ error: 'Flask error', details: err.response.data });
    }
    console.error('Predict proxy error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Optional passthrough to Flask root
app.get('/', async (req, res) => {
  try {
    const r = await axios.get(`${FLASK_URL}/`);
    res.json({ express: { message: 'Express proxy is up' }, flask: r.data });
  } catch (e) {
    res.json({ express: { message: 'Express proxy is up' }, flask: { error: 'unreachable', details: e.message } });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://127.0.0.1:${PORT}`);
});

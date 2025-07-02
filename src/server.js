const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './database/',
  filename: (req, file, cb) => {
    cb(null, 'mysteryforge_db_structure.json');
  }
});
const upload = multer({ storage });

// Serve main page
app.get('/', async (req, res) => {
  try {
    const html = await fs.readFile(path.join(__dirname, 'interface.html'), 'utf8');
    res.send(html);
  } catch (error) {
    res.send('<h1>MysteryForge</h1><p>Interface file not found</p>');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Upload database
app.post('/api/database/upload', upload.single('database'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file' });
    }
    const data = await fs.readFile(req.file.path, 'utf8');
    const parsed = JSON.parse(data);
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MysteryForge running on port ${PORT}`);
});

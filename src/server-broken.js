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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com"],
    },
  },
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
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files allowed'));
    }
  }
});

// Serve main HTML page with full interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MysteryForge Web</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div id="app" class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-blue-600 mb-2">MysteryForge</h1>
                <p class="text-gray-600">5-Minute Mystery Generator</p>
                <div id="status" class="mt-4 text-sm text-gray-500">Loading...</div>
            </div>
            <div id="upload-section" class="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <h3 class="text-lg font-semibold mb-4">Database Setup</h3>
                <input type="file" id="file-input" accept=".json" class="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                <button id="upload-btn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled>Upload Database</button>
                <div id="upload-status" class="mt-2 text-sm"></div>
            </div>

            <div id="api-section" class="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-4">Anthropic API Key</h3>
                <input type="password" id="api-key" placeholder="sk-ant-..." class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mb-2">
                <p class="text-xs text-gray-500">Your API key is stored in browser memory only</p>
            </div>
            <div id="generator-section" class="mb-8">
                <div class="grid md:grid-cols-2 gap-4">
                    <button id="generate-basic" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50" disabled>
                        Generate Basic Story
                    </button>
                    <button id="generate-ai" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50" disabled>
                        Generate AI Story
                    </button>
                </div>
                <div id="generate-status" class="mt-4 text-center text-sm"></div>
            </div>

            <div id="story-output" class="hidden">
                <h3 class="text-xl font-bold mb-4">Generated Mystery</h3>
                <div id="story-content" class="bg-gray-50 p-6 rounded-lg border">
                    <pre id="story-text" class="whitespace-pre-wrap text-sm leading-relaxed"></pre>
                </div>
                <div class="mt-4 text-center">
                    <button id="export-btn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Export Story</button>
                    <button id="generate-another" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2">Generate Another</button>
                </div>
            </div>
            <div id="database-info" class="hidden mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Database Stats</h3>
                <div id="stats-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"></div>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/database/upload', upload.single('database'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
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
  console.log(`MysteryForge server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

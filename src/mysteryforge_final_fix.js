// server.js - Complete working server with embedded interface
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

// Serve main page with complete interface
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MysteryForge</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-blue-600 mb-2">MysteryForge</h1>
                <p class="text-gray-600">5-Minute Mystery Generator</p>
                <div id="status" class="mt-4 text-sm text-green-600">Server Ready</div>
            </div>

            <div class="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <h3 class="text-lg font-semibold mb-4">Database Setup</h3>
                <input type="file" id="fileInput" accept=".json" class="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                <button id="uploadBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled>Upload Database</button>
                <div id="uploadStatus" class="mt-2 text-sm"></div>
            </div>

            <div class="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-4">Anthropic API Key (Optional)</h3>
                <input type="password" id="apiKey" placeholder="sk-ant-..." class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">For AI-enhanced stories</p>
            </div>

            <div class="mb-8">
                <div class="grid md:grid-cols-2 gap-4">
                    <button id="generateBasic" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50" disabled>
                        Generate Basic Story
                    </button>
                    <button id="generateAI" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50" disabled>
                        Generate AI Story
                    </button>
                </div>
                <div id="generateStatus" class="mt-4 text-center text-sm"></div>
            </div>

            <div id="storyOutput" class="hidden">
                <h3 class="text-xl font-bold mb-4">Generated Mystery</h3>
                <div class="bg-gray-50 p-6 rounded-lg border">
                    <pre id="storyText" class="whitespace-pre-wrap text-sm leading-relaxed"></pre>
                </div>
                <div class="mt-4 text-center">
                    <button id="exportBtn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Export Story</button>
                    <button id="newStory" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2">Generate Another</button>
                </div>
            </div>

            <div id="dbStats" class="hidden mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Database Statistics</h3>
                <div id="statsGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"></div>
            </div>
        </div>
    </div>

    <script>
        let database = null;
        let apiKey = '';

        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadStatus = document.getElementById('uploadStatus');
        const apiKeyInput = document.getElementById('apiKey');
        const generateBasic = document.getElementById('generateBasic');
        const generateAI = document.getElementById('generateAI');
        const generateStatus = document.getElementById('generateStatus');
        const storyOutput = document.getElementById('storyOutput');
        const storyText = document.getElementById('storyText');
        const exportBtn = document.getElementById('exportBtn');
        const newStory = document.getElementById('newStory');
        const dbStats = document.getElementById('dbStats');
        const statsGrid = document.getElementById('statsGrid');

        // File input handler
        fileInput.addEventListener('change', () => {
            uploadBtn.disabled = !fileInput.files[0];
        });

        // API key handler
        apiKeyInput.addEventListener('input', (e) => {
            apiKey = e.target.value;
            updateButtons();
        });

        // Upload database
        uploadBtn.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('database', file);

            try {
                uploadStatus.textContent = 'Uploading...';
                uploadStatus.className = 'mt-2 text-sm text-blue-600';

                const response = await axios.post('/api/database/upload', formData);
                
                if (response.data.success) {
                    database = response.data.data;
                    uploadStatus.textContent = 'Database uploaded successfully!';
                    uploadStatus.className = 'mt-2 text-sm text-green-600';
                    showStats();
                    updateButtons();
                } else {
                    throw new Error(response.data.error);
                }
            } catch (error) {
                uploadStatus.textContent = 'Upload failed: ' + error.message;
                uploadStatus.className = 'mt-2 text-sm text-red-600';
            }
        });

        // Generate basic story
        generateBasic.addEventListener('click', () => {
            if (!database) return;
            
            generateStatus.textContent = 'Generating story...';
            generateStatus.className = 'mt-4 text-center text-sm text-blue-600';
            
            try {
                const story = createBasicStory();
                displayStory(story);
                generateStatus.textContent = '';
            } catch (error) {
                generateStatus.textContent = 'Generation failed: ' + error.message;
                generateStatus.className = 'mt-4 text-center text-sm text-red-600';
            }
        });

        // Generate AI story
        generateAI.addEventListener('click', async () => {
            if (!database || !apiKey) return;
            
            generateStatus.textContent = 'Generating AI-enhanced story...';
            generateStatus.className = 'mt-4 text-center text-sm text-blue-600';
            
            try {
                const response = await axios.post('/api/generate-story', {
                    database: database,
                    apiKey: apiKey
                });
                
                if (response.data.success) {
                    displayStory(response.data.story.aiEnhancedStory);
                    generateStatus.textContent = '';
                } else {
                    throw new Error(response.data.error);
                }
            } catch (error) {
                generateStatus.textContent = 'AI generation failed: ' + error.message;
                generateStatus.className = 'mt-4 text-center text-sm text-red-600';
            }
        });

        // New story button
        newStory.addEventListener('click', () => {
            storyOutput.classList.add('hidden');
            generateStatus.textContent = '';
        });

        // Helper functions
        function updateButtons() {
            generateBasic.disabled = !database;
            generateAI.disabled = !database || !apiKey;
        }

        function showStats() {
            if (!database || !database.database_info) return;
            
            const stats = database.database_info.total_entries;
            statsGrid.innerHTML = '';
            
            Object.entries(stats).forEach(([key, value]) => {
                const div = document.createElement('div');
                div.innerHTML = \`
                    <div class="text-2xl font-bold text-blue-600">\${value}</div>
                    <div class="text-sm text-gray-600">\${key.replace('_', ' ')}</div>
                \`;
                statsGrid.appendChild(div);
            });
            
            dbStats.classList.remove('hidden');
        }

        function createBasicStory() {
            const alibiLie = database.alibi_lies[Math.floor(Math.random() * database.alibi_lies.length)];
            
            const matchingScenarios = database.mystery_scenarios.filter(scenario =>
                scenario.setting_tags.some(tag => alibiLie.tags.includes(tag))
            );
            const scenario = matchingScenarios.length > 0 
                ? matchingScenarios[Math.floor(Math.random() * matchingScenarios.length)]
                : database.mystery_scenarios[Math.floor(Math.random() * database.mystery_scenarios.length)];

            const matchingDetectives = database.characters.filter(char =>
                char.catches_alibis.some(specialty => alibiLie.tags.includes(specialty))
            );
            const detective = matchingDetectives.length > 0
                ? matchingDetectives[Math.floor(Math.random() * matchingDetectives.length)]
                : database.characters[Math.floor(Math.random() * database.characters.length)];

            const suspectNames = ["Marcus Sterling", "Elena Rodriguez", "James Whitmore", "Dr. Patricia Vale"];
            const suspectName = suspectNames[Math.floor(Math.random() * suspectNames.length)];

            return formatBasicStory(alibiLie, scenario, detective, suspectName);
        }

        function formatBasicStory(alibiLie, scenario, detective, suspect) {
            return \`THE \${alibiLie.category.toUpperCase()} CONTRADICTION

SETTING: \${scenario.location}
\${scenario.setting_description}

SITUATION: \${scenario.situation_context}
CONFLICT: \${scenario.conflict_source}

THE VICTIM: \${scenario.victim.name}, \${scenario.victim.role}
\${scenario.victim.background}

THE DETECTIVE: \${detective.name}, \${detective.role}
\${detective.background}

THE MYSTERY:
During \${scenario.time_constraints}, \${scenario.victim.name} is found dead in the \${scenario.location.toLowerCase()}. \${scenario.special_constraints}

THE SUSPECT'S ALIBI:
\${suspect} claims: "\${alibiLie.alibi_claim}"

THE CONTRADICTION:
Detective \${detective.name.split(' ')[1]} realizes the fatal flaw: \${alibiLie.contradiction}

THE SOLUTION:
When confronted with the impossibility of their alibi, \${suspect} breaks down and confesses to the crime, revealing their motive was connected to \${scenario.conflict_source.toLowerCase()}.\`;
        }

        function displayStory(story) {
            storyText.textContent = story;
            storyOutput.classList.remove('hidden');
        }

        // Health check on page load
        axios.get('/api/health').then(() => {
            console.log('Server connection verified');
        }).catch((error) => {
            console.error('Server connection failed:', error);
        });
    </script>
</body>
</html>`;
  
  res.send(html);
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

app.post('/api/generate-story', async (req, res) => {
  try {
    const { database, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key required' });
    }

    const alibiLie = database.alibi_lies[Math.floor(Math.random() * database.alibi_lies.length)];
    
    const matchingScenarios = database.mystery_scenarios.filter(scenario =>
      scenario.setting_tags.some(tag => alibiLie.tags.includes(tag))
    );
    const scenario = matchingScenarios.length > 0 
      ? matchingScenarios[Math.floor(Math.random() * matchingScenarios.length)]
      : database.mystery_scenarios[Math.floor(Math.random() * database.mystery_scenarios.length)];

    const matchingDetectives = database.characters.filter(char =>
      char.catches_alibis.some(specialty => alibiLie.tags.includes(specialty))
    );
    const detective = matchingDetectives.length > 0
      ? matchingDetectives[Math.floor(Math.random() * matchingDetectives.length)]
      : database.characters[Math.floor(Math.random() * database.characters.length)];

    const suspectNames = ["Marcus Sterling", "Elena Rodriguez", "James Whitmore", "Dr. Patricia Vale"];
    const suspectName = suspectNames[Math.floor(Math.random() * suspectNames.length)];

    const axios = require('axios');
    const prompt = `Create a compelling 5-minute mystery story using these components:

ALIBI-LIE: ${alibiLie.alibi_claim}
CONTRADICTION: ${alibiLie.contradiction}
SETTING: ${scenario.location} - ${scenario.setting_description}
VICTIM: ${scenario.victim.name}, ${scenario.victim.role}
DETECTIVE: ${detective.name}, ${detective.role}
SUSPECT: ${suspectName}
CONFLICT: ${scenario.conflict_source}

Create a complete mystery story that follows this structure:
1. Scene setup and victim discovery
2. Initial suspect interviews and alibis
3. Detective's expert analysis reveals the contradiction
4. Confrontation and confession
5. Resolution explaining motive and method

Make it engaging, logical, and solvable. Focus on the "aha moment" when the alibi fails.
Format as a complete story, not an outline.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    const story = {
      title: `The ${alibiLie.category} Contradiction`,
      aiEnhancedStory: response.data.content[0].text
    };

    res.json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MysteryForge server running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});
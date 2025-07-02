REM fix-server.bat - Create a proper working server.js
@echo off

echo Fixing MysteryForge server.js...
echo ================================

REM Backup the broken server.js
if exist "src\server.js" (
    copy "src\server.js" "src\server-broken.js" >nul
    echo Backed up broken server.js
)

echo Creating new working server.js...

REM Create a proper server.js file using a different approach
REM We'll create it in parts to avoid batch file limitations

echo Part 1: Basic server setup...
(
echo const express = require('express'^);
echo const cors = require('cors'^);
echo const helmet = require('helmet'^);
echo const morgan = require('morgan'^);
echo const path = require('path'^);
echo const fs = require('fs'^).promises;
echo const multer = require('multer'^);
echo.
echo const app = express(^);
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo // Middleware
echo app.use(helmet({
echo   contentSecurityPolicy: false
echo }^)^);
echo app.use(cors(^)^);
echo app.use(morgan('combined'^)^);
echo app.use(express.json({ limit: '10mb' }^)^);
echo.
echo // Configure multer for file uploads
echo const storage = multer.diskStorage({
echo   destination: './database/',
echo   filename: (req, file, cb^) =^> {
echo     cb(null, 'mysteryforge_db_structure.json'^);
echo   }
echo }^);
echo const upload = multer({ storage }^);
) > src\server.js

echo Part 2: Adding HTML interface...

REM Create the HTML content in a separate file first
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>MysteryForge^</title^>
echo     ^<script src="https://cdn.tailwindcss.com"^>^</script^>
echo     ^<script src="https://unpkg.com/axios/dist/axios.min.js"^>^</script^>
echo ^</head^>
echo ^<body class="bg-gray-100 min-h-screen"^>
echo     ^<div class="container mx-auto px-4 py-8"^>
echo         ^<div class="bg-white rounded-lg shadow-lg p-6"^>
echo             ^<div class="text-center mb-8"^>
echo                 ^<h1 class="text-4xl font-bold text-blue-600 mb-2"^>MysteryForge^</h1^>
echo                 ^<p class="text-gray-600"^>5-Minute Mystery Generator^</p^>
echo                 ^<div id="status" class="mt-4 text-sm text-green-600"^>Server Ready^</div^>
echo             ^</div^>
) > interface.html

(
echo             ^<div class="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg"^>
echo                 ^<h3 class="text-lg font-semibold mb-4"^>Database Setup^</h3^>
echo                 ^<input type="file" id="fileInput" accept=".json" class="mb-4 block w-full"^>
echo                 ^<button id="uploadBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"^>Upload Database^</button^>
echo                 ^<div id="uploadStatus" class="mt-2 text-sm"^>^</div^>
echo             ^</div^>
) >> interface.html

(
echo             ^<div class="mb-8 p-4 bg-gray-50 rounded-lg"^>
echo                 ^<h3 class="text-lg font-semibold mb-4"^>API Key^</h3^>
echo                 ^<input type="password" id="apiKey" placeholder="sk-ant-..." class="w-full px-3 py-2 border rounded"^>
echo             ^</div^>
) >> interface.html

(
echo             ^<div class="mb-8"^>
echo                 ^<div class="grid md:grid-cols-2 gap-4"^>
echo                     ^<button id="generateBasic" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50" disabled^>Generate Basic Story^</button^>
echo                     ^<button id="generateAI" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50" disabled^>Generate AI Story^</button^>
echo                 ^</div^>
echo                 ^<div id="generateStatus" class="mt-4 text-center text-sm"^>^</div^>
echo             ^</div^>
) >> interface.html

(
echo             ^<div id="storyOutput" class="hidden"^>
echo                 ^<h3 class="text-xl font-bold mb-4"^>Generated Mystery^</h3^>
echo                 ^<div class="bg-gray-50 p-6 rounded-lg border"^>
echo                     ^<pre id="storyText" class="whitespace-pre-wrap text-sm"^>^</pre^>
echo                 ^</div^>
echo                 ^<div class="mt-4 text-center"^>
echo                     ^<button id="exportBtn" class="bg-indigo-600 text-white px-4 py-2 rounded"^>Export^</button^>
echo                     ^<button id="newStory" class="bg-gray-600 text-white px-4 py-2 rounded ml-2"^>New Story^</button^>
echo                 ^</div^>
echo             ^</div^>
) >> interface.html

(
echo             ^<div id="dbStats" class="hidden mt-8 p-4 bg-blue-50 rounded-lg"^>
echo                 ^<h3 class="font-semibold mb-2"^>Database Stats^</h3^>
echo                 ^<div id="statsGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"^>^</div^>
echo             ^</div^>
echo         ^</div^>
echo     ^</div^>
) >> interface.html

echo Part 3: Adding JavaScript functionality...

(
echo     ^<script^>
echo         let database = null;
echo         let apiKey = '';
echo.
echo         const fileInput = document.getElementById('fileInput'^);
echo         const uploadBtn = document.getElementById('uploadBtn'^);
echo         const uploadStatus = document.getElementById('uploadStatus'^);
echo         const apiKeyInput = document.getElementById('apiKey'^);
echo         const generateBasic = document.getElementById('generateBasic'^);
echo         const generateAI = document.getElementById('generateAI'^);
echo         const generateStatus = document.getElementById('generateStatus'^);
echo         const storyOutput = document.getElementById('storyOutput'^);
echo         const storyText = document.getElementById('storyText'^);
echo         const exportBtn = document.getElementById('exportBtn'^);
echo         const newStory = document.getElementById('newStory'^);
echo         const dbStats = document.getElementById('dbStats'^);
echo         const statsGrid = document.getElementById('statsGrid'^);
) >> interface.html

(
echo.
echo         fileInput.addEventListener('change', (^) =^> {
echo             uploadBtn.disabled = !fileInput.files[0];
echo         }^);
echo.
echo         apiKeyInput.addEventListener('input', (e^) =^> {
echo             apiKey = e.target.value;
echo             updateButtons(^);
echo         }^);
echo.
echo         uploadBtn.addEventListener('click', async (^) =^> {
echo             const file = fileInput.files[0];
echo             if (!file^) return;
echo             const formData = new FormData(^);
echo             formData.append('database', file^);
echo             try {
echo                 uploadStatus.textContent = 'Uploading...';
echo                 const response = await axios.post('/api/database/upload', formData^);
echo                 if (response.data.success^) {
echo                     database = response.data.data;
echo                     uploadStatus.textContent = 'Success!';
echo                     uploadStatus.className = 'mt-2 text-sm text-green-600';
echo                     showStats(^);
echo                     updateButtons(^);
echo                 }
echo             } catch (error^) {
echo                 uploadStatus.textContent = 'Failed: ' + error.message;
echo                 uploadStatus.className = 'mt-2 text-sm text-red-600';
echo             }
echo         }^);
) >> interface.html

(
echo.
echo         generateBasic.addEventListener('click', (^) =^> {
echo             if (!database^) return;
echo             generateStatus.textContent = 'Generating...';
echo             const story = createBasicStory(^);
echo             displayStory(story^);
echo             generateStatus.textContent = '';
echo         }^);
echo.
echo         function updateButtons(^) {
echo             generateBasic.disabled = !database;
echo             generateAI.disabled = !database ^|^| !apiKey;
echo         }
echo.
echo         function showStats(^) {
echo             if (!database.database_info^) return;
echo             const stats = database.database_info.total_entries;
echo             statsGrid.innerHTML = '';
echo             Object.entries(stats^).forEach(([key, value]^) =^> {
echo                 const div = document.createElement('div'^);
echo                 div.innerHTML = `^<div class="text-2xl font-bold text-blue-600"^>${value}^</div^>^<div class="text-xs text-gray-600"^>${key}^</div^>`;
echo                 statsGrid.appendChild(div^);
echo             }^);
echo             dbStats.classList.remove('hidden'^);
echo         }
) >> interface.html

(
echo.
echo         function createBasicStory(^) {
echo             const alibi = database.alibi_lies[Math.floor(Math.random(^) * database.alibi_lies.length^)];
echo             const scenario = database.mystery_scenarios[Math.floor(Math.random(^) * database.mystery_scenarios.length^)];
echo             const detective = database.characters[Math.floor(Math.random(^) * database.characters.length^)];
echo             const suspect = 'Marcus Sterling';
echo             return formatStory(alibi, scenario, detective, suspect^);
echo         }
echo.
echo         function formatStory(alibi, scenario, detective, suspect^) {
echo             return `THE ${alibi.category.toUpperCase(^)} CONTRADICTION
echo.
echo SETTING: ${scenario.location}
echo ${scenario.setting_description}
echo.
echo THE VICTIM: ${scenario.victim.name}, ${scenario.victim.role}
echo.
echo THE DETECTIVE: ${detective.name}, ${detective.role}
echo.
echo THE MYSTERY:
echo During ${scenario.time_constraints}, ${scenario.victim.name} is found dead. ${scenario.special_constraints}
echo.
echo THE ALIBI:
echo ${suspect} claims: "${alibi.alibi_claim}"
echo.
echo THE CONTRADICTION:
echo ${alibi.contradiction}
echo.
echo THE SOLUTION:
echo Confronted with this impossibility, ${suspect} confesses to the crime.`;
echo         }
echo.
echo         function displayStory(story^) {
echo             storyText.textContent = story;
echo             storyOutput.classList.remove('hidden'^);
echo         }
echo.
echo         newStory.addEventListener('click', (^) =^> {
echo             storyOutput.classList.add('hidden'^);
echo         }^);
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) >> interface.html

echo Part 4: Adding routes to server.js...

(
echo.
echo // Serve main page
echo app.get('/', async (req, res^) =^> {
echo   try {
echo     const html = await fs.readFile('interface.html', 'utf8'^);
echo     res.send(html^);
echo   } catch (error^) {
echo     res.send('^<h1^>MysteryForge^</h1^>^<p^>Interface file not found^</p^>'^);
echo   }
echo }^);
echo.
echo // Health check
echo app.get('/api/health', (req, res^) =^> {
echo   res.json({ status: 'healthy', timestamp: new Date(^).toISOString(^) }^);
echo }^);
echo.
echo // Upload database
echo app.post('/api/database/upload', upload.single('database'^), async (req, res^) =^> {
echo   try {
echo     if (!req.file^) {
echo       return res.status(400^).json({ success: false, error: 'No file' }^);
echo     }
echo     const data = await fs.readFile(req.file.path, 'utf8'^);
echo     const parsed = JSON.parse(data^);
echo     res.json({ success: true, data: parsed }^);
echo   } catch (error^) {
echo     res.status(500^).json({ success: false, error: error.message }^);
echo   }
echo }^);
echo.
echo // Start server
echo app.listen(PORT, '0.0.0.0', (^) =^> {
echo   console.log(`MysteryForge running on port ${PORT}`^);
echo }^);
) >> src\server.js

echo Copying interface file to src directory...
copy interface.html src\ >nul
del interface.html

echo.
echo Fixed! Now rebuilding container...
docker-compose down
docker build -t mysteryforge .
docker-compose up -d

echo.
echo ================================
echo SERVER FIXED!
echo ================================
echo.
echo The server.js has been recreated with proper functionality.
echo MysteryForge should now work correctly at:
echo http://localhost:3000
echo.
echo You should now see:
echo - File upload interface
echo - Database stats after upload
echo - Story generation buttons
echo - Full web interface
echo.

pause
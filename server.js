/**
 * SaveIQ Local Web Application Server
 * Serves the interactive standalone SaveIQ web dashboard, modals, and AI simulator.
 * Includes a lightweight Groq Cloud AI proxy endpoint for live LLM inference.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Read .env if present (without external dependencies)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  // ignore env parse errors
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // API Route: Test Groq API Key
  if (req.method === 'POST' && req.url === '/api/groq/test') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const apiKey = parsed.apiKey || process.env.GROQ_API_KEY;
        if (!apiKey) {
          return sendJson(res, 400, { success: false, error: 'No API key provided' });
        }

        const groqReq = https.request({
          hostname: 'api.groq.com',
          path: '/openai/v1/models',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'SaveIQ-Client/1.0'
          }
        }, groqRes => {
          let groqBody = '';
          groqRes.on('data', d => groqBody += d);
          groqRes.on('end', () => {
            if (groqRes.statusCode >= 200 && groqRes.statusCode < 300) {
              return sendJson(res, 200, { success: true, message: 'Valid Groq API Key!' });
            } else {
              try {
                const errData = JSON.parse(groqBody);
                return sendJson(res, groqRes.statusCode, { success: false, error: errData.error?.message || 'Invalid API Key' });
              } catch (e) {
                return sendJson(res, groqRes.statusCode, { success: false, error: 'Groq API returned status ' + groqRes.statusCode });
              }
            }
          });
        });

        groqReq.on('error', err => {
          sendJson(res, 500, { success: false, error: err.message });
        });
        groqReq.end();
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Malformed JSON payload' });
      }
    });
    return;
  }

  // API Route: Live Chat Completions Proxy
  if (req.method === 'POST' && req.url === '/api/groq/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const apiKey = parsed.apiKey || process.env.GROQ_API_KEY;
        if (!apiKey) {
          return sendJson(res, 400, { success: false, error: 'No API key configured' });
        }

        const payload = JSON.stringify({
          model: parsed.model || 'llama-3.3-70b-versatile',
          messages: parsed.messages || [],
          temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.5,
          max_tokens: typeof parsed.max_tokens === 'number' ? parsed.max_tokens : 300
        });

        const groqReq = https.request({
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'User-Agent': 'SaveIQ-Client/1.0'
          }
        }, groqRes => {
          let groqBody = '';
          groqRes.on('data', d => groqBody += d);
          groqRes.on('end', () => {
            try {
              const parsedRes = JSON.parse(groqBody);
              if (groqRes.statusCode >= 200 && groqRes.statusCode < 300) {
                sendJson(res, 200, {
                  success: true,
                  content: parsedRes.choices?.[0]?.message?.content || '',
                  model: parsedRes.model || parsed.model,
                  usage: parsedRes.usage
                });
              } else {
                sendJson(res, groqRes.statusCode, {
                  success: false,
                  error: parsedRes.error?.message || 'Groq error'
                });
              }
            } catch (e) {
              sendJson(res, 500, { success: false, error: 'Failed to parse Groq response' });
            }
          });
        });

        groqReq.on('error', err => {
          sendJson(res, 500, { success: false, error: err.message });
        });
        groqReq.write(payload);
        groqReq.end();
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Malformed JSON payload' });
      }
    });
    return;
  }

  // API Route: Get Server Env Key Status (without revealing the key)
  if (req.method === 'GET' && req.url === '/api/groq/status') {
    const envKey = process.env.GROQ_API_KEY;
    const hasKey = Boolean(envKey && envKey.trim().length > 0);
    const preview = hasKey ? `${envKey.substring(0, 6)}...${envKey.substring(envKey.length - 4)}` : null;
    return sendJson(res, 200, { hasEnvKey: hasKey, preview: preview });
  }

  // Static File Serving
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (errIndex, indexContent) => {
          if (errIndex) {
            res.writeHead(500);
            res.end('Server Error: ' + errIndex.code);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      const contentType = MIME_TYPES[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SaveIQ Web Application is LIVE and RUNNING!`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`🔑 Groq Cloud AI Proxy: Active (/api/groq/chat)`);
  console.log(`======================================================\n`);
});

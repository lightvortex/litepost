const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for CSV file uploads
const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Variable substitution utility
function substituteVariables(text, variables) {
    if (!text) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
}

// ==================== CRUD Endpoints ====================

// GET /api/requests - List all requests
app.get('/api/requests', (req, res) => {
    try {
        const requests = db.prepare('SELECT id, name, method, url, headers, body, created_at FROM requests ORDER BY created_at DESC').all();
        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// POST /api/requests - Create new request
app.post('/api/requests', (req, res) => {
    try {
        const { name, method, url, headers, body } = req.body;
        
        if (!name || !method || !url) {
            return res.status(400).json({ error: 'Name, method, and URL are required' });
        }

        const stmt = db.prepare('INSERT INTO requests (name, method, url, headers, body) VALUES (?, ?, ?, ?, ?)');
        stmt.run(name, method.toUpperCase(), url, headers || null, body || null);
        
        res.status(201).json({ id: db.lastInsertRowid, name, method, url });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// PUT /api/requests/:id - Update request
app.put('/api/requests/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, method, url, headers, body } = req.body;
        
        const stmt = db.prepare('UPDATE requests SET name = ?, method = ?, url = ?, headers = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(name, method.toUpperCase(), url, headers || null, body || null, id);
        
        res.json({ id: parseInt(id), name, method, url });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// DELETE /api/requests/:id - Delete request
app.delete('/api/requests/:id', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM requests WHERE id = ?');
        stmt.run(id);
        
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// ==================== Proxy Endpoint ====================

// POST /api/proxy - Execute request via proxy
app.post('/api/proxy', async (req, res) => {
    try {
        const { requestId, method, url, headers, body } = req.body;
        
        // If requestId is provided, fetch from database
        let finalMethod = method;
        let finalUrl = url;
        let finalHeaders = headers;
        let finalBody = body;
        
        if (requestId) {
            const request = db.prepare('SELECT method, url, headers, body FROM requests WHERE id = ?').get(requestId);
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }
            finalMethod = request.method;
            finalUrl = request.url;
            finalHeaders = request.headers;
            finalBody = request.body;
        }
        
        // Parse headers
        const parsedHeaders = {};
        if (finalHeaders) {
            finalHeaders.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                if (key && value) {
                    parsedHeaders[key.trim()] = value;
                }
            });
        }
        
        // Substitute variables in URL
        const variables = {
            ...parsedHeaders,
            ...(body ? JSON.parse(body) : {})
        };
        
        const substitutedUrl = substituteVariables(finalUrl, variables);
        
        // Make the request
        const response = await axios({
            method: finalMethod,
            url: substitutedUrl,
            headers: parsedHeaders,
            data: finalBody,
            validateStatus: () => true // Don't throw on error status codes
        });
        
        res.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });
    } catch (error) {
        console.error('Proxy error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.message,
            data: error.response?.data
        });
    }
});

// ==================== Bulk Run Endpoint ====================

// POST /api/bulk-run - Bulk run with CSV data
app.post('/api/bulk-run', upload.single('csv'), async (req, res) => {
    try {
        const { requestId } = req.body;
        
        if (!requestId) {
            return res.status(400).json({ error: 'requestId is required' });
        }
        
        // Fetch the request configuration
        const request = db.prepare('SELECT method, url, headers, body FROM requests WHERE id = ?').get(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const results = [];
        const errors = [];
        
        // Process CSV rows
        if (req.file) {
            const csvData = fs.readFileSync(req.file.path, 'utf-8');
            const lines = csvData.split('\n');
            
            // Skip header row
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = line.split(',').map(v => v.trim());
                const variables = {};
                
                // Map CSV columns to variables
                for (let j = 0; j < values.length; j++) {
                    variables[`col${j}`] = values[j];
                }
                
                // Substitute variables
                const substitutedUrl = substituteVariables(request.url, variables);
                const substitutedBody = substituteVariables(request.body || '', variables);
                
                // Parse headers if they exist
                const parsedHeaders = {};
                if (request.headers) {
                    request.headers.split('\n').forEach(headerLine => {
                        const [key, ...valueParts] = headerLine.split(':');
                        const value = valueParts.join(':').trim();
                        if (key && value) {
                            parsedHeaders[key.trim()] = value;
                        }
                    });
                }
                
                // Make the request
                try {
                    const response = await axios({
                        method: request.method,
                        url: substitutedUrl,
                        headers: parsedHeaders,
                        data: substitutedBody,
                        validateStatus: () => true
                    });
                    
                    results.push({
                        url: substitutedUrl,
                        status: response.status,
                        data: response.data
                    });
                } catch (error) {
                    errors.push({
                        url: substitutedUrl,
                        error: error.message
                    });
                }
            }
            
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
        }
        
        res.json({
            requestId,
            total: results.length + errors.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Bulk run error:', error);
        res.status(500).json({ error: 'Failed to run bulk requests' });
    }
});

// ==================== Start Server ====================

app.listen(PORT, () => {
    console.log(`LitePost server running on http://localhost:${PORT}`);
});

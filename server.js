const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// STIER TIL DATA
const DATA_DIR = path.join(__dirname, 'data');
const STRATEGIES_FILE = path.join(DATA_DIR, 'strategies.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Sjekk at mapper/filer finnes
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(STRATEGIES_FILE)) fs.writeFileSync(STRATEGIES_FILE, '[]');
if (!fs.existsSync(SETTINGS_FILE)) {
    // Standard innstillinger hvis filen mangler
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ totalRooms: 57 }, null, 2));
}

// --- API: STRATEGIES ---
app.get('/api/strategies', (req, res) => {
    fs.readFile(STRATEGIES_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Feil');
        res.json(JSON.parse(data || '[]'));
    });
});

app.post('/api/strategies', (req, res) => {
    const newStrategy = req.body;
    fs.readFile(STRATEGIES_FILE, 'utf8', (err, data) => {
        let strategies = JSON.parse(data || '[]');
        
        if (newStrategy.id) {
            const index = strategies.findIndex(s => s.id === newStrategy.id);
            if (index !== -1) strategies[index] = newStrategy;
            else strategies.push(newStrategy);
        } else {
            newStrategy.id = Date.now().toString();
            strategies.push(newStrategy);
        }

        fs.writeFile(STRATEGIES_FILE, JSON.stringify(strategies, null, 2), (err) => {
            if (err) return res.status(500).send('Feil');
            res.json(newStrategy);
        });
    });
});

app.delete('/api/strategies/:id', (req, res) => {
    const idToDelete = req.params.id;
    fs.readFile(STRATEGIES_FILE, 'utf8', (err, data) => {
        let strategies = JSON.parse(data || '[]');
        strategies = strategies.filter(s => s.id !== idToDelete);
        fs.writeFile(STRATEGIES_FILE, JSON.stringify(strategies, null, 2), (err) => {
            if (err) return res.status(500).send('Feil');
            res.json({ success: true });
        });
    });
});

// --- API: SETTINGS (NY!) ---
app.get('/api/settings', (req, res) => {
    fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Feil');
        res.json(JSON.parse(data || '{}'));
    });
});

app.post('/api/settings', (req, res) => {
    const settings = req.body;
    fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), (err) => {
        if (err) return res.status(500).send('Feil');
        res.json(settings);
    });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running locally at http://localhost:${PORT}`);
    console.log(`Server accessible on LAN at http://172.16.102.146:${PORT}`);
});
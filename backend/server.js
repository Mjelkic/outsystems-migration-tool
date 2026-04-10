require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoute = require('./routes/upload');
const generateRoute = require('./routes/generate');
const refineRoute = require('./routes/refine');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/upload', uploadRoute);
app.use('/api/generate', generateRoute);
app.use('/api/refine', refineRoute);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Extend socket timeout to 5 minutes to handle slow AI proxy responses
server.setTimeout(300000);

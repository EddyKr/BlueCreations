require('dotenv').config();

const express = require('express');
const cors = require('cors');
const conversationRoutes = require('./routes/conversation');
const generateRoutes = require('./routes/generate');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for frontend development
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173', // Vite default
    'http://localhost:8080', // Webpack dev server
    'http://localhost:4200', // Angular CLI
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:4200',
    // Add any other ports your frontend might use
    /^http:\/\/localhost:\d+$/, // Allow any localhost port
    /^http:\/\/127\.0\.0\.1:\d+$/ // Allow any 127.0.0.1 port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true, // Allow cookies/credentials if needed
  optionsSuccessStatus: 200 // Support legacy browsers
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/', generateRoutes); // Mount generate routes at root level
app.use('/api/conversation', conversationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Multi-Agent Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Generate endpoint: http://localhost:${PORT}/generate`);
  console.log(`🌐 CORS enabled for localhost development`);
}); 
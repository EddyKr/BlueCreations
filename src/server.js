require('dotenv').config();

const express = require('express');
const cors = require('cors');
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
app.use('/', generateRoutes); // Main routes for both backoffice and frontend

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Multi-Agent Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Back office endpoints:`);
  console.log(`   - Generate: POST http://localhost:${PORT}/backoffice/generate`);
  console.log(`   - Save: POST http://localhost:${PORT}/backoffice/save-campaign`);
  console.log(`   - View campaigns: GET http://localhost:${PORT}/backoffice/campaigns`);
  console.log(`🌐 Frontend endpoints:`);
  console.log(`   - Get recommendation (profile-based): POST http://localhost:${PORT}/frontend/get-recommendation`);
  console.log(`   - Get recommendation (query-based): GET http://localhost:${PORT}/client/recommendation`);
  console.log(`🔧 CORS enabled for localhost development`);
}); 
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const conversationRoutes = require('./routes/conversation');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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
}); 
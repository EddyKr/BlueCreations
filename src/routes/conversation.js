const express = require('express');
const conversationalAgent = require('../services/conversationalAgent');

const router = express.Router();

// Start new conversation (now just processes a message)
router.post('/start', async (req, res) => {
  try {
    const { message, profileId } = req.body;
    
    const initialInput = {};
    if (message) {
      initialInput.message = message.trim();
    }
    if (profileId) {
      initialInput.profileId = profileId;
    }
    
    const response = await conversationalAgent.startConversation(initialInput);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        agent: response.agent,
        timestamp: response.timestamp,
        userProfile: response.userProfile
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process message', details: error.message }
    });
  }
});

// Continue conversation (now just processes a message, ignoring conversationId)
router.post('/:conversationId/continue', async (req, res) => {
  try {
    const { message, profileId } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required' }
      });
    }

    const userInput = { 
      message: message.trim(),
      profileId: profileId || null
    };
    
    const response = await conversationalAgent.continueConversation(null, userInput);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        agent: response.agent,
        timestamp: response.timestamp,
        userProfile: response.userProfile
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process message', details: error.message }
    });
  }
});

// Process message directly (new simplified endpoint)
router.post('/message', async (req, res) => {
  try {
    const { message, profileId } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required' }
      });
    }

    const userInput = { 
      message: message.trim(),
      profileId: profileId || null
    };
    
    const response = await conversationalAgent.processMessage(userInput);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        agent: response.agent,
        timestamp: response.timestamp,
        userProfile: response.userProfile
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process message', details: error.message }
    });
  }
});

// Get conversation (now returns not found since we don't store conversations)
router.get('/:conversationId', async (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Conversations are no longer stored. Use /message endpoint for direct processing.' }
  });
});

// List conversations (now returns empty array since we don't store conversations)
router.get('/', async (req, res) => {
  res.json({
    success: true,
    data: { 
      conversations: [], 
      count: 0,
      message: 'Conversations are no longer stored. Use /message endpoint for direct processing.'
    },
    timestamp: new Date().toISOString()
  });
});

// Delete conversation (now returns success since nothing to delete)
router.delete('/:conversationId', async (req, res) => {
  res.json({
    success: true,
    data: { 
      message: 'Conversations are no longer stored, nothing to delete',
      conversationId: req.params.conversationId
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 
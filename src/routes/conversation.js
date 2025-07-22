const express = require('express');
const conversationalAgent = require('../services/conversationalAgent');

const router = express.Router();

// Start new conversation
router.post('/start', async (req, res) => {
  try {
    const { message } = req.body;
    
    const initialInput = message ? { message: message.trim() } : {};
    const response = await conversationalAgent.startConversation(initialInput);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        agent: response.agent,
        sessionId: response.conversationId,
        timestamp: response.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to start conversation', details: error.message }
    });
  }
});

// Continue conversation
router.post('/:conversationId/continue', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required' }
      });
    }

    const userInput = { message: message.trim() };
    const response = await conversationalAgent.continueConversation(conversationId, userInput);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        agent: response.agent,
        sessionId: response.conversationId,
        timestamp: response.timestamp
      }
    });
  } catch (error) {
    if (error.message === 'Conversation not found') {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to continue conversation', details: error.message }
    });
  }
});

// Get conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = conversationalAgent.getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }

    res.json({
      success: true,
      data: conversation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve conversation', details: error.message }
    });
  }
});

// List conversations
router.get('/', async (req, res) => {
  try {
    const conversations = conversationalAgent.listConversations();
    
    res.json({
      success: true,
      data: { conversations, count: conversations.length },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to list conversations', details: error.message }
    });
  }
});

// Delete conversation
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const deleted = conversationalAgent.clearConversation(conversationId);
    
    if (deleted) {
      res.json({
        success: true,
        data: { message: 'Conversation deleted', conversationId },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete conversation', details: error.message }
    });
  }
});

module.exports = router; 
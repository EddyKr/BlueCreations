const express = require('express');
const conversationalAgent = require('../services/conversationalAgent');
const multiAgentOrchestrator = require('../services/multiAgentOrchestrator');
const recommendationEngine = require('../services/recommendationEngine');

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

// Get cached recommendations for specific message/profile combination
router.post('/recommendations', async (req, res) => {
  try {
    const { message, profileId } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required to lookup cached recommendations' }
      });
    }

    const userProfile = multiAgentOrchestrator.getUserProfile(profileId);
    const cachedRecommendations = multiAgentOrchestrator.getCachedRecommendations(message.trim(), userProfile);
    
    if (!cachedRecommendations) {
      return res.status(404).json({
        success: false,
        error: { message: 'No cached recommendations found for this message and profile combination' }
      });
    }

    res.json({
      success: true,
      data: {
        message: message.trim(),
        profileId: profileId || null,
        userProfile: userProfile ? { id: userProfile.id, segments: userProfile.segments } : null,
        recommendations: cachedRecommendations,
        totalRecommendations: cachedRecommendations.length,
        requestHash: multiAgentOrchestrator.generateRequestHash(message.trim(), userProfile)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve cached recommendations', details: error.message }
    });
  }
});

// Get cache statistics
router.get('/cache/statistics', async (req, res) => {
  try {
    const stats = multiAgentOrchestrator.getCacheStatistics();
    
    res.json({
      success: true,
      data: {
        ...stats,
        cacheMaxAgeMinutes: stats.cacheMaxAge / (1000 * 60),
        oldestEntryAge: stats.oldestEntry ? (Date.now() - stats.oldestEntry) / 1000 : null,
        newestEntryAge: stats.newestEntry ? (Date.now() - stats.newestEntry) / 1000 : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve cache statistics', details: error.message }
    });
  }
});

// Clear recommendation cache
router.delete('/cache', async (req, res) => {
  try {
    const result = multiAgentOrchestrator.clearRecommendationCache();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear recommendation cache', details: error.message }
    });
  }
});

// Get all cached recommendation hashes (for debugging)
router.get('/cache/entries', async (req, res) => {
  try {
    const stats = multiAgentOrchestrator.getCacheStatistics();
    
    // Get basic info about all cache entries without exposing full content
    const entries = [];
    multiAgentOrchestrator.recommendationCache.forEach((value, key) => {
      entries.push({
        hash: key,
        timestamp: value.timestamp,
        age: (Date.now() - value.timestamp) / 1000,
        recommendationCount: value.recommendations.length,
        approaches: value.recommendations.map(r => r.approach)
      });
    });

    res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        entries: entries.sort((a, b) => b.timestamp - a.timestamp), // newest first
        statistics: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve cache entries', details: error.message }
    });
  }
});

// ===== PERSONA-BASED RECOMMENDATION ENDPOINTS =====

// Generate recommendations for all personas and products
router.post('/recommendations/generate', async (req, res) => {
  try {
    const result = await recommendationEngine.generateAllRecommendations();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('already in progress')) {
      return res.status(409).json({
        success: false,
        error: { message: 'Recommendation generation already in progress. Please wait and try again.' }
      });
    }
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate recommendations', details: error.message }
    });
  }
});

// Get stored recommendations with minimal filtering
router.get('/recommendations/list', async (req, res) => {
  try {
    const filters = {
      sportInterest: req.query.sport,
      budgetRange: req.query.budget,
      skillLevel: req.query.skill,
      segment: req.query.segment,
      limit: req.query.limit ? parseInt(req.query.limit) : 10
    };

    const result = recommendationEngine.getRecommendations(filters);
    
    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve recommendations', details: error.message }
    });
  }
});

// Get recommendation statistics
router.get('/recommendations/stats', async (req, res) => {
  try {
    const stats = recommendationEngine.getStatistics();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve recommendation statistics', details: error.message }
    });
  }
});

// Clear all stored recommendations
router.delete('/recommendations', async (req, res) => {
  try {
    const result = recommendationEngine.clearRecommendations();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear recommendations', details: error.message }
    });
  }
});

// Quick recommendation lookup for website visitors (minimal data required)
router.get('/recommendations/quick', async (req, res) => {
  try {
    // Get basic recommendations with very minimal filtering
    const sport = req.query.sport || null;
    const budget = req.query.budget || null;
    const limit = Math.min(parseInt(req.query.limit) || 5, 10); // Max 10 items

    const filters = {
      sportInterest: sport,
      budgetRange: budget,
      limit: limit
    };

    const result = recommendationEngine.getRecommendations(filters);
    
    if (!result.success) {
      return res.json({
        success: false,
        message: result.message,
        recommendations: [],
        timestamp: new Date().toISOString()
      });
    }

    // Simplify response for quick website access
    const quickRecommendations = result.recommendations.map(rec => ({
      type: rec.type || 'persona-based',
      category: rec.category || rec.sportInterests?.[0] || 'general',
      products: rec.recommendedProducts.slice(0, 3).map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        discountedPrice: product.discountedPrice,
        originalPrice: product.originalPrice,
        discount: product.discount,
        reason: product.recommendationReason
      }))
    }));

    res.json({
      success: true,
      recommendations: quickRecommendations.slice(0, limit),
      total: quickRecommendations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve quick recommendations', details: error.message }
    });
  }
});

module.exports = router; 
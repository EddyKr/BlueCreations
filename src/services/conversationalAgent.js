const multiAgentOrchestrator = require('./multiAgentOrchestrator');
// const recommendationEngine = require('./recommendationEngine');

class ConversationalAgent {
  constructor() {
    // No longer managing conversations/sessions
    
    // Keywords that indicate product recommendation requests
    this.productRecommendationKeywords = [
      'recommend', 'recommendation', 'suggest', 'suggestion', 'product', 'buy', 'purchase', 
      'equipment', 'gear', 'shop', 'shopping', 'looking for', 'need', 'want to buy',
      'golf', 'hockey', 'soccer', 'tennis', 'sport', 'sports'
    ];
  }

  async processMessage(userInput = {}) {
    try {
      const userMessage = this._extractMessageText(userInput);
      
      if (!userMessage && Object.keys(userInput).length === 0) {
        return {
          timestamp: new Date(),
          message: "Hello! I'm Maya, your recommendation specialist. I can help you find the perfect sports equipment based on your interests and budget. What sport are you interested in, or would you like general product recommendations?",
          agent: 'Maya (Quick Recommendation Agent)'
        };
      }

      // Check if this is a product recommendation request
      if (this._isProductRecommendationRequest(userMessage)) {
        return await this._handleProductRecommendation(userMessage, userInput.profileId);
      }

      // For non-product requests, use the multi-agent orchestrator
      const request = {
        message: userMessage,
        profileId: userInput.profileId || null
      };

      const multiAgentResponse = await multiAgentOrchestrator.processUserMessage(request);

      return {
        timestamp: new Date(),
        message: multiAgentResponse.response,
        agent: multiAgentResponse.currentAgent,
        userProfile: multiAgentResponse.userProfile
      };

    } catch (error) {
      console.error('Processing error:', error);
      
      return {
        timestamp: new Date(),
        message: "I'm having some technical difficulties. Let me try to help you directly! What can I assist you with?",
        agent: 'Maya (Fallback Mode)'
      };
    }
  }

  // Check if the user message is requesting product recommendations
  _isProductRecommendationRequest(message) {
    const lowerMessage = message.toLowerCase();
    return this.productRecommendationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
  }

  // Handle product recommendation requests using the recommendation engine
  async _handleProductRecommendation(userMessage, profileId) {
    try {
      // Get user profile for filtering
      const userProfile = multiAgentOrchestrator.getUserProfile(profileId);
      
      // Extract filters from user profile and message
      const filters = this._extractRecommendationFilters(userMessage, userProfile);
      
      // Get recommendations from the engine
      // const recommendationResult = recommendationEngine.getRecommendations(filters);
      
      // if (!recommendationResult.success || recommendationResult.recommendations.length === 0) {
      //   return {
      //     timestamp: new Date(),
      //     message: "I'd love to help with recommendations! First, let me generate some product suggestions. You can ask me again in a moment, or let me know what sport you're interested in and your budget range (budget/moderate/premium/luxury).",
      //     agent: 'Maya (Quick Recommendation Agent)',
      //     userProfile: userProfile ? { id: userProfile.id, segments: userProfile.segments } : null
      //   };
      // }

      // // Format the recommendations into a natural response
      // const responseMessage = this._formatRecommendationResponse(recommendationResult.recommendations, userProfile, filters);

      // return {
      //   timestamp: new Date(),
      //   message: responseMessage,
      //   agent: 'Maya (Quick Recommendation Agent)',
      //   userProfile: userProfile ? { id: userProfile.id, segments: userProfile.segments } : null
      // };

    } catch (error) {
      console.error('Product recommendation error:', error);
      return {
        timestamp: new Date(),
        message: "I encountered an issue getting your product recommendations. Let me connect you with my specialist team instead.",
        agent: 'Maya (Fallback to Multi-Agent)'
      };
    }
  }

  // Extract recommendation filters from message and user profile
  _extractRecommendationFilters(message, userProfile) {
    const filters = { limit: 5 }; // Default limit
    const lowerMessage = message.toLowerCase();

    // Extract sport from message or profile
    const sports = ['golf', 'hockey', 'soccer', 'tennis'];
    const sportFromMessage = sports.find(sport => lowerMessage.includes(sport));
    if (sportFromMessage) {
      filters.sportInterest = sportFromMessage;
    } else if (userProfile) {
      const sportInterests = this._getPropertyValues(userProfile, 'sport_interests');
      if (sportInterests.length > 0) {
        filters.sportInterest = sportInterests[0]; // Use first sport interest
      }
    }

    // Extract budget from message or profile
    const budgets = ['budget', 'moderate', 'premium', 'luxury'];
    const budgetFromMessage = budgets.find(budget => lowerMessage.includes(budget));
    if (budgetFromMessage) {
      filters.budgetRange = budgetFromMessage;
    } else if (userProfile) {
      const budgetRange = this._getPropertyValues(userProfile, 'budget_range')[0];
      if (budgetRange) {
        filters.budgetRange = budgetRange;
      }
    }

    // Extract skill level from profile
    if (userProfile) {
      const skillLevel = this._getPropertyValues(userProfile, 'skill_level')[0];
      if (skillLevel) {
        filters.skillLevel = skillLevel;
      }
    }

    return filters;
  }

  // Format recommendations into a natural conversational response
  _formatRecommendationResponse(recommendations, userProfile, filters) {
    const userName = userProfile ? this._getPropertyValues(userProfile, 'name')[0] : null;
    const greeting = userName ? `Hi ${userName}! ` : "Great! ";
    
    let response = greeting + "Here are my top product recommendations for you:\n\n";

    // Take first recommendation set and show top 3 products
    const topRecommendation = recommendations[0];
    const products = topRecommendation.recommendedProducts.slice(0, 3);

    products.forEach((product, index) => {
      const savings = product.savings ? ` (save $${product.savings.toFixed(2)})` : '';
      response += `${index + 1}. **${product.name}** by ${product.brand}\n`;
      response += `   💰 $${product.discountedPrice.toFixed(2)}${savings}\n`;
      response += `   📦 ${product.stock} in stock\n`;
      response += `   ⭐ ${product.recommendationReason}\n\n`;
    });

    // Add personalized note based on filters
    if (filters.sportInterest) {
      response += `These recommendations are tailored for ${filters.sportInterest} enthusiasts`;
      if (filters.budgetRange) {
        response += ` with a ${filters.budgetRange} budget range`;
      }
      response += ".\n\n";
    }

    response += "Would you like more recommendations for a specific sport or budget range? Just let me know!";

    return response;
  }

  // Helper method to get property values from user profile
  _getPropertyValues(userProfile, propertyId) {
    if (!userProfile || !userProfile.properties) return [];
    const property = userProfile.properties.find(prop => prop.id === propertyId);
    return property ? property.values : [];
  }

  _extractMessageText(input) {
    if (typeof input === 'string') return input;
    if (input.message) return input.message;
    if (input.text) return input.text;
    return JSON.stringify(input);
  }

  // Legacy methods for backward compatibility - now simplified
  async startConversation(initialInput = {}) {
    return await this.processMessage(initialInput);
  }

  async continueConversation(conversationId, userInput) {
    // Ignore conversationId since we're not tracking sessions
    return await this.processMessage(userInput);
  }

  getConversation(conversationId) {
    // No longer storing conversations
    return null;
  }

  clearConversation(conversationId) {
    // No conversations to clear
    return true;
  }

  listConversations() {
    // No conversations to list
    return [];
  }
}

module.exports = new ConversationalAgent(); 
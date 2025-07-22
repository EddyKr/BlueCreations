const multiAgentOrchestrator = require('./multiAgentOrchestrator');

class ConversationalAgent {
  constructor() {
    // No longer managing conversations/sessions
  }

  async processMessage(userInput = {}) {
    try {
      const userMessage = this._extractMessageText(userInput);
      
      if (!userMessage && Object.keys(userInput).length === 0) {
        return {
          timestamp: new Date(),
          message: "Hello! I'm Alex, your project coordinator. How can I help you today?",
          agent: 'Alex (Project Coordinator)'
        };
      }

      // Create request object for multiAgentOrchestrator
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
      console.error('Multi-agent response error:', error);
      
      return {
        timestamp: new Date(),
        message: "I'm having some technical difficulties. Let me try to help you directly! What can I assist you with?",
        agent: 'Alex (Fallback Mode)'
      };
    }
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
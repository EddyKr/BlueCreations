const { v4: uuidv4 } = require('uuid');
const multiAgentOrchestrator = require('./multiAgentOrchestrator');

class ConversationalAgent {
  constructor() {
    this.conversations = new Map();
  }

  async startConversation(initialInput = {}) {
    const conversationId = uuidv4();
    const conversation = {
      id: conversationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      state: 'active'
    };

    if (Object.keys(initialInput).length > 0) {
      conversation.messages.push({
        type: 'user',
        content: initialInput,
        timestamp: new Date()
      });
    }

    this.conversations.set(conversationId, conversation);
    return await this._generateMultiAgentResponse(conversation, initialInput);
  }

  async continueConversation(conversationId, userInput) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.updatedAt = new Date();
    conversation.messages.push({
      type: 'user',
      content: userInput,
      timestamp: new Date()
    });
    
    return await this._generateMultiAgentResponse(conversation, userInput);
  }

  async _generateMultiAgentResponse(conversation, userInput) {
    try {
      const userMessage = this._extractMessageText(userInput);
      
      if (!userMessage && Object.keys(userInput).length === 0) {
        return {
          conversationId: conversation.id,
          timestamp: new Date(),
          state: 'active',
          message: "Hello! I'm Alex, your project coordinator. How can I help you today?",
          agent: 'Alex (Project Coordinator)'
        };
      }

      const multiAgentResponse = await multiAgentOrchestrator.processUserMessage(
        userMessage, 
        conversation.id
      );

      const response = {
        conversationId: conversation.id,
        timestamp: new Date(),
        state: 'active',
        message: multiAgentResponse.response,
        agent: multiAgentResponse.currentAgent
      };

      conversation.messages.push({
        type: 'multi-agent',
        content: response,
        timestamp: new Date()
      });

      return response;

    } catch (error) {
      console.error('Multi-agent response error:', error);
      
      const fallbackResponse = {
        conversationId: conversation.id,
        timestamp: new Date(),
        state: 'active',
        message: "I'm having some technical difficulties. Let me try to help you directly! What can I assist you with?",
        agent: 'Alex (Fallback Mode)'
      };

      return fallbackResponse;
    }
  }

  _extractMessageText(input) {
    if (typeof input === 'string') return input;
    if (input.message) return input.message;
    if (input.text) return input.text;
    return JSON.stringify(input);
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId) || null;
  }

  clearConversation(conversationId) {
    return this.conversations.delete(conversationId);
  }

  listConversations() {
    return Array.from(this.conversations.values());
  }
}

module.exports = new ConversationalAgent(); 
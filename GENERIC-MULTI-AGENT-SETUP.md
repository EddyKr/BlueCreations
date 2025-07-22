# Generic Multi-Agent LLM Backend Setup Guide

## Overview

This guide helps you create a backend system with an OpenAI LLM-powered main agent that intelligently delegates tasks to specialized sub-agents and synthesizes their responses. The architecture ensures users interact with a single, cohesive assistant while leveraging multiple domain experts behind the scenes.

## Architecture Pattern

```
User Input → Main Orchestrator Agent → Decision Engine
                                     ↓
            ┌─────────────────────────────────────────┐
            ├→ Requirements Analyst Agent             │
            ├→ Domain Expert Agent A                  │
            ├→ Domain Expert Agent B                  │
            └→ Technical Implementation Agent         │
                                     ↓
                    Synthesis & Final Response
```

## Key Features

- **Intelligent Delegation**: Main agent decides which specialists to consult based on user requirements
- **Context Preservation**: All agents maintain conversation history and build upon previous context
- **Seamless UX**: Users see a single coherent response, not multiple agent interactions
- **Configurable Specialists**: Easy to add, remove, or modify specialist agents
- **Fallback Mechanisms**: Graceful degradation if specialists are unavailable

## Step-by-Step Setup

### 1. Project Structure

Create the following directory structure:

```
your-project/
├── src/
│   ├── server.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── conversation.js
│   └── services/
│       ├── openaiService.js
│       ├── multiAgentOrchestrator.js
│       ├── conversationalAgent.js
│       └── specialists/
│           ├── requirementsAnalyst.js
│           ├── domainExpertA.js
│           ├── domainExpertB.js
│           └── technicalAdvisor.js
├── package.json
├── .env
└── README.md
```

### 2. Dependencies

Install required dependencies:

```bash
npm init -y
npm install express cors dotenv openai uuid
npm install --save-dev nodemon
```

**package.json example:**
```json
{
  "name": "your-multi-agent-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1", 
    "openai": "^4.20.1",
    "uuid": "^9.0.1"
  }
}
```

### 3. Environment Configuration

Create `.env` file:
```env
OPENAI_API_KEY=your-openai-api-key-here
PORT=3000
NODE_ENV=development
```

### 4. Core Implementation

#### A. OpenAI Service (`src/services/openaiService.js`)

```javascript
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.config = {
      API_KEY: process.env.OPENAI_API_KEY,
      MODELS: {
        GPT_3_5_TURBO: 'gpt-3.5-turbo',
        GPT_4O: 'gpt-4o'
      },
      MAX_TOKENS: {
        STANDARD: 1000,
        EXTENDED: 1500
      }
    };
    this.initialize();
  }

  initialize() {
    if (!this.config.API_KEY) {
      console.warn('⚠️ OpenAI API key not configured');
      return;
    }
    this.client = new OpenAI({ apiKey: this.config.API_KEY });
    console.log('✅ OpenAI Service initialized');
  }

  async createSimpleCompletion(prompt, options = {}) {
    if (!this.client) {
      throw new Error('OpenAI not configured');
    }

    const {
      model = this.config.MODELS.GPT_4O,
      maxTokens = this.config.MAX_TOKENS.STANDARD,
      temperature = 0.7
    } = options;

    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ];

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature
    });

    return response.choices[0].message.content;
  }

  getAvailableModels() { return this.config.MODELS; }
  getTokenLimits() { return this.config.MAX_TOKENS; }
  isConfigured() { return !!this.client; }
}

module.exports = new OpenAIService();
```

#### B. Multi-Agent Orchestrator (`src/services/multiAgentOrchestrator.js`)

```javascript
const { v4: uuidv4 } = require('uuid');
const openaiService = require('./openaiService');

class MultiAgentOrchestrator {
  constructor() {
    this.sessions = new Map();
    this.agentPersonalities = {
      orchestrator: {
        name: "Alex",
        role: "Project Coordinator",
        systemPrompt: `You are Alex, an experienced project coordinator. Your role is to:

1. Understand user needs through natural conversation
2. Ask clarifying questions when information is unclear
3. Coordinate with specialists when deeper expertise is needed
4. Provide direct answers when you have sufficient knowledge

CONTEXT MEMORY RULES - CRITICAL:
- ALWAYS read the ENTIRE conversation history before responding
- NEVER ask for information the user already provided
- EXPLICITLY reference what they told you
- BUILD UPON previous messages - don't start over each time

DECISION RULES:
- Have enough context → CONSULT_SPECIALISTS or ANSWER_DIRECTLY
- Missing essential info → ASK_QUESTIONS
- Simple questions → ANSWER_DIRECTLY

RESPONSE FORMAT:
DECISION: [CONSULT_REQUIREMENTS | CONSULT_DOMAIN_A | CONSULT_DOMAIN_B | CONSULT_TECHNICAL | ANSWER_DIRECTLY | ASK_QUESTIONS]
RESPONSE: [Your response to the user]`
      },
      
      requirementsAnalyst: {
        name: "Sam",
        role: "Requirements Analyst", 
        systemPrompt: `You are Sam, a requirements analyst. You excel at:
- Clarifying project requirements and constraints
- Identifying critical success factors
- Understanding user needs and contexts
- Breaking down complex projects into specifications

Always reference the complete conversation history and build upon established context.`
      },
      
      domainExpertA: {
        name: "Dr. Maya",
        role: "Domain Expert A",
        systemPrompt: `You are Dr. Maya, a domain expert specializing in [YOUR_DOMAIN_A]. 
Provide specific recommendations with clear reasoning based on requirements.
Always maintain context from the conversation.`
      },
      
      technicalAdvisor: {
        name: "Tech",
        role: "Technical Advisor",
        systemPrompt: `You are Tech, a technical implementation expert. You specialize in:
- Practical implementation advice
- Cost analysis and optimization
- Technical constraints and solutions
- Best practices and troubleshooting

Always reference the established project context from the conversation.`
      }
    };
  }

  async processUserMessage(message, sessionId = null) {
    try {
      // Create or get session
      let session = this.sessions.get(sessionId);
      if (!session) {
        sessionId = sessionId || uuidv4();
        this.createSession(sessionId);
        session = this.sessions.get(sessionId);
      }

      // Add user message
      session.messages.push({
        type: 'user',
        content: message,
        timestamp: new Date()
      });

      // Get orchestrator decision
      const orchestratorResponse = await this.consultOrchestrator(session);
      
      // Add orchestrator response
      session.messages.push({
        type: 'orchestrator',
        agent: 'Alex',
        content: orchestratorResponse,
        timestamp: new Date()
      });

      return {
        sessionId: sessionId,
        response: orchestratorResponse,
        currentAgent: 'Alex (Project Coordinator)',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Multi-agent processing error:', error);
      throw new Error(`Multi-agent processing failed: ${error.message}`);
    }
  }

  async consultOrchestrator(session) {
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    const prompt = {
      system: this.agentPersonalities.orchestrator.systemPrompt + `

Available specialists:
- Sam (Requirements Analyst) - for clarifying needs
- Dr. Maya (Domain Expert A) - for domain-specific recommendations
- Tech (Technical Advisor) - for implementation guidance

Respond in EXACTLY this format:
DECISION: [CONSULT_REQUIREMENTS | CONSULT_DOMAIN_A | CONSULT_TECHNICAL | ANSWER_DIRECTLY | ASK_QUESTIONS]
RESPONSE: [Your response to the user]`,
      
      user: `CONVERSATION HISTORY:
${conversationHistory}

Analyze the conversation and determine what to do next. Consider what information is already provided and what might be missing.`
    };

    const response = await this.callOpenAI(prompt, 'Orchestrator');
    const decision = this.parseOrchestratorDecision(response);
    
    if (decision.action === 'ANSWER_DIRECTLY' || decision.action === 'ASK_QUESTIONS') {
      return decision.response;
    } else {
      return await this.runSpecialistWorkflow(session, decision);
    }
  }

  parseOrchestratorDecision(orchestratorResponse) {
    const lines = orchestratorResponse.split('\n');
    let decision = { action: null, response: orchestratorResponse };
    
    for (let line of lines) {
      if (line.startsWith('DECISION:')) {
        decision.action = line.replace('DECISION:', '').trim();
      } else if (line.startsWith('RESPONSE:')) {
        decision.response = line.replace('RESPONSE:', '').trim();
        const responseIndex = lines.indexOf(line);
        if (responseIndex < lines.length - 1) {
          decision.response = lines.slice(responseIndex).join('\n').replace('RESPONSE:', '').trim();
        }
        break;
      }
    }
    
    if (!decision.action) {
      decision.action = 'ASK_QUESTIONS';
    }
    
    return decision;
  }

  async runSpecialistWorkflow(session, initialDecision) {
    let consultedSpecialists = new Set();
    let specialistResponses = new Map();
    
    // Consult appropriate specialist
    let specialistResponse = '';
    switch (initialDecision.action) {
      case 'CONSULT_REQUIREMENTS':
        specialistResponse = await this.consultRequirementsAnalyst(session);
        specialistResponses.set('REQUIREMENTS', specialistResponse);
        break;
      case 'CONSULT_DOMAIN_A':
        specialistResponse = await this.consultDomainExpert(session, 'A');
        specialistResponses.set('DOMAIN_A', specialistResponse);
        break;
      case 'CONSULT_TECHNICAL':
        specialistResponse = await this.consultTechnicalAdvisor(session);
        specialistResponses.set('TECHNICAL', specialistResponse);
        break;
    }
    
    // Get final synthesis
    return await this.getFinalSynthesis(session, specialistResponses);
  }

  async consultRequirementsAnalyst(session) {
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    const prompt = {
      system: this.agentPersonalities.requirementsAnalyst.systemPrompt,
      user: `CONVERSATION HISTORY:
${conversationHistory}

Analyze the requirements and provide your assessment of what information we have and what might be missing.`
    };

    return await this.callOpenAI(prompt, 'Requirements Analyst');
  }

  async consultDomainExpert(session, domain = 'A') {
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    const prompt = {
      system: this.agentPersonalities.domainExpertA.systemPrompt,
      user: `CONVERSATION HISTORY:
${conversationHistory}

Based on the requirements, provide domain-specific recommendations and guidance.`
    };

    return await this.callOpenAI(prompt, 'Domain Expert');
  }

  async consultTechnicalAdvisor(session) {
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    const prompt = {
      system: this.agentPersonalities.technicalAdvisor.systemPrompt,
      user: `CONVERSATION HISTORY:
${conversationHistory}

Provide technical implementation advice and practical considerations.`
    };

    return await this.callOpenAI(prompt, 'Technical Advisor');
  }

  async getFinalSynthesis(session, specialistResponses) {
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    let allSpecialistInput = '\n--- SPECIALIST INPUT ---\n';
    for (let [specialist, response] of specialistResponses) {
      allSpecialistInput += `${specialist}: ${response}\n\n`;
    }
    
    const prompt = {
      system: `You are Alex, an expert coordinator. Synthesize the specialist knowledge into a helpful, comprehensive response. Do not mention internal consultations - present as if you personally have this expertise.`,
      user: `User Request:
${conversationHistory}

Expert Knowledge:
${allSpecialistInput}

Provide a complete response that addresses the user's needs with clear recommendations and practical guidance.`
    };

    return await this.callOpenAI(prompt, 'Final Synthesis');
  }

  async callOpenAI(prompt, agentName = 'System') {
    return await openaiService.createSimpleCompletion(prompt, {
      model: openaiService.getAvailableModels().GPT_4O,
      maxTokens: openaiService.getTokenLimits().EXTENDED,
      temperature: 0.7
    });
  }

  formatConversationHistory(messages) {
    return messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      if (msg.type === 'user') {
        return `[${timestamp}] User: ${msg.content}`;
      } else if (msg.agent) {
        return `[${timestamp}] ${msg.agent}: ${msg.content}`;
      }
      return `[${timestamp}] System: ${msg.content}`;
    }).join('\n');
  }

  createSession(sessionId) {
    this.sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
      messages: [],
      state: 'active'
    });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
}

module.exports = new MultiAgentOrchestrator();
```

#### C. Conversational Agent (`src/services/conversationalAgent.js`)

```javascript
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
```

#### D. Express Server (`src/server.js`)

```javascript
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
```

#### E. API Routes (`src/routes/conversation.js`)

```javascript
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
```

#### F. Error Handler (`src/middleware/errorHandler.js`)

```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler };
```

### 5. Customization Guide

#### A. Adding New Specialist Agents

1. **Define the agent in orchestrator:**
```javascript
newSpecialist: {
  name: "Dr. Smith",
  role: "New Domain Expert",
  systemPrompt: `You are Dr. Smith, expert in [DOMAIN]. Your responsibilities include:
  - [Specific expertise area 1]
  - [Specific expertise area 2]
  - [Specific expertise area 3]`
}
```

2. **Add consultation method:**
```javascript
async consultNewSpecialist(session, previousAnalysis = '') {
  const conversationHistory = this.formatConversationHistory(session.messages);
  
  const prompt = {
    system: this.agentPersonalities.newSpecialist.systemPrompt,
    user: `CONVERSATION HISTORY:
${conversationHistory}

Previous Analysis: ${previousAnalysis}

Provide your specialized analysis and recommendations.`
  };

  return await this.callOpenAI(prompt, 'New Specialist');
}
```

3. **Update decision logic in orchestrator system prompt:**
```
DECISION: [... | CONSULT_NEW_SPECIALIST | ...]
```

#### B. Modifying Decision Logic

Customize the orchestrator's decision-making by updating:

1. **Essential information requirements**
2. **Decision thresholds** 
3. **Specialist consultation order**
4. **Context preservation rules**

#### C. Domain-Specific Adaptations

Replace domain-specific elements:

1. **Agent personalities and expertise areas**
2. **Required information for decision-making**
3. **Specialist consultation triggers**
4. **Response synthesis approach**

### 6. API Usage Examples

#### Start a conversation:
```bash
curl -X POST http://localhost:3000/api/conversation/start \
  -H "Content-Type: application/json" \
  -d '{"message": "I need help with my project"}'
```

#### Continue conversation:
```bash
curl -X POST http://localhost:3000/api/conversation/{sessionId}/continue \
  -H "Content-Type: application/json" \
  -d '{"message": "Here are more details about what I need"}'
```

### 7. Running the System

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 8. Key Success Factors

1. **Context Preservation**: All agents must reference complete conversation history
2. **Seamless UX**: Users should never know they're talking to multiple agents
3. **Smart Delegation**: Orchestrator must intelligently decide when to consult specialists
4. **Error Handling**: Graceful fallbacks when specialists are unavailable
5. **Scalable Architecture**: Easy to add/remove/modify specialist agents

### 9. Advanced Features to Consider

- **Persistent storage** (Redis/Database for session management)
- **Agent learning** (Fine-tuning based on successful interactions)
- **Performance monitoring** (Response times, API costs)
- **A/B testing** (Different agent personalities or decision strategies)
- **Multi-language support**
- **Webhooks** for real-time updates

This architecture provides a solid foundation for building sophisticated multi-agent systems that deliver excellent user experiences while leveraging specialized AI expertise behind the scenes. 
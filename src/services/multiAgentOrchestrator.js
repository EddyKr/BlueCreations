const { v4: uuidv4 } = require('uuid');
const openaiService = require('./openaiService');

// Import specialist agents
const analyticsAgent = require('./specialists/analyticsAgent');
const persuasionAgent = require('./specialists/persuasionAgent');
const textGenerationAgent = require('./specialists/textGenerationAgent');
const htmlCssAgent = require('./specialists/htmlCssAgent');
const ethicsAgent = require('./specialists/ethicsAgent');

class MultiAgentOrchestrator {
  constructor() {
    this.sessions = new Map();
    this.specialists = {
      analytics: analyticsAgent,
      persuasion: persuasionAgent,
      textGeneration: textGenerationAgent,
      htmlCss: htmlCssAgent,
      ethics: ethicsAgent
    };
    
    this.orchestratorPersonality = {
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
- Focus on conversion optimization and ethical selling

AVAILABLE SPECIALISTS:
- Alex (Analytics Specialist) - for analyzing user behavior, conversion funnels, and performance optimization
- Maya (Persuasion Specialist) - for creating compelling messaging and addressing customer objections
- Sam (Content Generation Specialist) - for creating product descriptions and marketing copy
- Jordan (UI/UX Conversion Specialist) - for optimizing page layouts and checkout flows
- Dr. Riley (Ethics & Compliance Specialist) - for ensuring ethical marketing practices and compliance

RESPONSE FORMAT:
DECISION: [CONSULT_REQUIREMENTS | CONSULT_DOMAIN_A | CONSULT_DOMAIN_B | CONSULT_TECHNICAL | ANSWER_DIRECTLY | ASK_QUESTIONS]
RESPONSE: [Your response to the user]`
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
      system: this.orchestratorPersonality.systemPrompt,
      user: `CONVERSATION HISTORY:
${conversationHistory}

Analyze the conversation and determine what to do next. Consider what information is already provided and what might be missing.

Choose the most appropriate action:
- CONSULT_ANALYTICS: For analyzing user behavior, conversion metrics, and optimization opportunities
- CONSULT_PERSUASION: For creating compelling messaging, handling objections, and conversion psychology
- CONSULT_CONTENT: For generating product descriptions, marketing copy, and persuasive content
- CONSULT_DESIGN: For optimizing page layouts, checkout flows, and UI/UX for conversions
- CONSULT_ETHICS: For reviewing marketing practices for ethical compliance and transparency
- ANSWER_DIRECTLY: If you have enough information to provide a complete answer

Respond in EXACTLY this format:
DECISION: [Your chosen action]
RESPONSE: [Your response to the user]`
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
    let specialistResponses = new Map();
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    // Consult appropriate specialist
    let specialistResponse = null;
    switch (initialDecision.action) {
      case 'CONSULT_ANALYTICS':
        specialistResponse = await this.specialists.analytics.analyzeConversion(conversationHistory);
        specialistResponses.set('ANALYTICS', specialistResponse.analysis);
        break;
      case 'CONSULT_PERSUASION':
        specialistResponse = await this.specialists.persuasion.createPersuasiveContent(conversationHistory);
        specialistResponses.set('PERSUASION', specialistResponse.content);
        break;
      case 'CONSULT_CONTENT':
        specialistResponse = await this.specialists.textGeneration.generateProductContent(conversationHistory);
        specialistResponses.set('CONTENT', specialistResponse.content);
        break;
      case 'CONSULT_DESIGN':
        specialistResponse = await this.specialists.htmlCss.optimizePageLayout(conversationHistory, 'product_page');
        specialistResponses.set('DESIGN', specialistResponse.optimization);
        break;
      case 'CONSULT_ETHICS':
        specialistResponse = await this.specialists.ethics.reviewMarketingEthics(conversationHistory);
        specialistResponses.set('ETHICS', specialistResponse.review);
        break;
    }
    
    // Get final synthesis
    return await this.getFinalSynthesis(session, specialistResponses);
  }

  async getFinalSynthesis(session, specialistResponses) {
    const conversationHistory = this.formatConversationHistory(session.messages);
    
    let allSpecialistInput = '\n--- SPECIALIST INPUT ---\n';
    for (let [specialist, response] of specialistResponses) {
      allSpecialistInput += `${specialist}: ${response}\n\n`;
    }
    
    const prompt = {
      system: `You are Alex, an expert coordinator. Synthesize the specialist knowledge into a helpful, comprehensive response. Do not mention internal consultations - present as if you personally have this expertise. Provide actionable recommendations and clear next steps.`,
      user: `User Request:
${conversationHistory}

Expert Knowledge:
${allSpecialistInput}

Provide a complete response that addresses the user's needs with clear recommendations and practical guidance. Structure your response logically and include specific next steps where appropriate.`
    };

    return await this.callOpenAI(prompt, 'Final Synthesis');
  }

  // New methods for direct specialist consultation
  async consultSpecialistDirectly(specialistType, method, conversationHistory, ...args) {
    try {
      const specialist = this.specialists[specialistType];
      if (!specialist) {
        throw new Error(`Unknown specialist type: ${specialistType}`);
      }
      
      if (typeof specialist[method] !== 'function') {
        throw new Error(`Unknown method ${method} for specialist ${specialistType}`);
      }
      
      return await specialist[method](conversationHistory, ...args);
    } catch (error) {
      console.error(`Error consulting ${specialistType} specialist:`, error);
      throw error;
    }
  }

  async getRequirementsAnalysis(sessionId, specificRequest = '') {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    
    const conversationHistory = this.formatConversationHistory(session.messages);
    return await this.specialists.requirements.analyze(conversationHistory, specificRequest);
  }

  async getTechStackRecommendation(sessionId, projectType, constraints = {}) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    
    const conversationHistory = this.formatConversationHistory(session.messages);
    return await this.specialists.domainA.recommendTechStack(conversationHistory, projectType, constraints);
  }

  async getUXAnalysis(sessionId, targetUsers = '') {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    
    const conversationHistory = this.formatConversationHistory(session.messages);
    return await this.specialists.domainB.analyzeUserExperience(conversationHistory, targetUsers);
  }

  async getCostEstimate(sessionId, projectScope, duration = '') {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    
    const conversationHistory = this.formatConversationHistory(session.messages);
    return await this.specialists.technical.estimateCosts(conversationHistory, projectScope, duration);
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

  // Utility methods for getting specialist personalities
  getSpecialistPersonalities() {
    return {
      requirements: this.specialists.requirements.getPersonality(),
      domainA: this.specialists.domainA.getPersonality(),
      domainB: this.specialists.domainB.getPersonality(),
      technical: this.specialists.technical.getPersonality()
    };
  }

  listAvailableSpecialists() {
    const personalities = this.getSpecialistPersonalities();
    return Object.entries(personalities).map(([key, personality]) => ({
      id: key,
      name: personality.name,
      role: personality.role
    }));
  }
}

module.exports = new MultiAgentOrchestrator(); 
const openaiService = require('./openaiService');
const fs = require('fs');
const path = require('path');

// Import specialist agents
const analyticsAgent = require('./specialists/analyticsAgent');
const persuasionAgent = require('./specialists/persuasionAgent');
const textGenerationAgent = require('./specialists/textGenerationAgent');
const htmlCssAgent = require('./specialists/htmlCssAgent');
const ethicsAgent = require('./specialists/ethicsAgent');

class MultiAgentOrchestrator {
  constructor() {
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

1. Understand user needs from their message
2. Coordinate with specialists when deeper expertise is needed
3. Provide direct answers when you have sufficient knowledge

DECISION RULES:
- Have enough context from the message → CONSULT_SPECIALISTS or ANSWER_DIRECTLY
- Simple questions → ANSWER_DIRECTLY
- Focus on conversion optimization and ethical selling

AVAILABLE SPECIALISTS:
- Alex (Analytics Specialist) - for analyzing user behavior, conversion funnels, and performance optimization
- Maya (Persuasion Specialist) - for creating compelling messaging and addressing customer objections
- Sam (Content Generation Specialist) - for creating product descriptions and marketing copy
- Jordan (UI/UX Conversion Specialist) - for optimizing page layouts and checkout flows
- Dr. Riley (Ethics & Compliance Specialist) - for ensuring ethical marketing practices and compliance

RESPONSE FORMAT:
DECISION: [CONSULT_ANALYTICS | CONSULT_PERSUASION | CONSULT_CONTENT | CONSULT_DESIGN | CONSULT_ETHICS | ANSWER_DIRECTLY]
RESPONSE: [Your response to the user]`
    };
  }

  // Load user profiles from personas.json
  loadUserProfiles() {
    try {
      const personasPath = path.join(__dirname, '../data/personas.json');
      const personasData = fs.readFileSync(personasPath, 'utf8');
      const personas = JSON.parse(personasData);
      return personas.userProfiles || [];
    } catch (error) {
      console.error('Error loading user profiles:', error);
      return [];
    }
  }

  // Get user profile by ID
  getUserProfile(profileId) {
    if (!profileId) return null;
    
    const userProfiles = this.loadUserProfiles();
    return userProfiles.find(profile => profile.id === profileId) || null;
  }

  // Format user profile for agents
  formatUserProfileForAgents(userProfile) {
    if (!userProfile) return '';
    
    let profileInfo = '\n--- USER PROFILE CONTEXT ---\n';
    profileInfo += `User ID: ${userProfile.id}\n`;
    profileInfo += `Permission Level: ${userProfile.permissions?.level || 'Unknown'}\n`;
    
    if (userProfile.properties) {
      profileInfo += 'User Properties:\n';
      userProfile.properties.forEach(prop => {
        profileInfo += `- ${prop.id}: ${prop.values.join(', ')}\n`;
      });
    }
    
    if (userProfile.segments && userProfile.segments.length > 0) {
      profileInfo += `User Segments: ${userProfile.segments.map(s => s.id).join(', ')}\n`;
    }
    
    if (userProfile.consentedObjectives && userProfile.consentedObjectives.length > 0) {
      profileInfo += `Consented Features: ${userProfile.consentedObjectives.join(', ')}\n`;
    }
    
    if (userProfile.refusedObjectives && userProfile.refusedObjectives.length > 0) {
      profileInfo += `Refused Features: ${userProfile.refusedObjectives.join(', ')}\n`;
    }
    
    profileInfo += '--- END USER PROFILE ---\n\n';
    return profileInfo;
  }

  async processUserMessage(request) {
    try {
      // Handle both string and JSON request formats
      let message, profileId;
      
      if (typeof request === 'string') {
        message = request;
        profileId = null;
      } else if (typeof request === 'object' && request.message) {
        message = request.message;
        profileId = request.profileId || null;
      } else {
        throw new Error('Invalid request format. Expected string or {message, profileId}');
      }

      // Get user profile if profileId is provided
      const userProfile = this.getUserProfile(profileId);

      // Get orchestrator decision
      const orchestratorResponse = await this.consultOrchestrator(message, userProfile);

      return {
        response: orchestratorResponse,
        currentAgent: 'Alex (Project Coordinator)',
        timestamp: new Date().toISOString(),
        userProfile: userProfile ? { id: userProfile.id, segments: userProfile.segments } : null
      };

    } catch (error) {
      console.error('Multi-agent processing error:', error);
      throw new Error(`Multi-agent processing failed: ${error.message}`);
    }
  }

  async consultOrchestrator(message, userProfile) {
    const userProfileContext = this.formatUserProfileForAgents(userProfile);
    
    const prompt = {
      system: this.orchestratorPersonality.systemPrompt,
      user: `${userProfileContext}USER MESSAGE:
${message}

Analyze the message and determine what to do next. You MUST choose a specialist to consult or answer directly - you cannot ask questions.

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
    
    if (decision.action === 'ANSWER_DIRECTLY') {
      return decision.response;
    } else {
      return await this.runSpecialistWorkflow(message, userProfile, decision);
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
    
    // Default to analytics if no clear decision
    if (!decision.action) {
      decision.action = 'CONSULT_ANALYTICS';
    }
    
    return decision;
  }

  async runSpecialistWorkflow(message, userProfile, initialDecision) {
    let specialistResponses = new Map();
    const userProfileContext = this.formatUserProfileForAgents(userProfile);
    const fullContext = userProfileContext + `USER MESSAGE: ${message}`;
    
    // Consult appropriate specialist
    let specialistResponse = null;
    switch (initialDecision.action) {
      case 'CONSULT_ANALYTICS':
        specialistResponse = await this.specialists.analytics.analyzeConversion(fullContext);
        specialistResponses.set('ANALYTICS', specialistResponse.analysis);
        break;
      case 'CONSULT_PERSUASION':
        specialistResponse = await this.specialists.persuasion.createPersuasiveContent(fullContext);
        specialistResponses.set('PERSUASION', specialistResponse.content);
        break;
      case 'CONSULT_CONTENT':
        specialistResponse = await this.specialists.textGeneration.generateProductContent(fullContext);
        specialistResponses.set('CONTENT', specialistResponse.content);
        break;
      case 'CONSULT_DESIGN':
        specialistResponse = await this.specialists.htmlCss.optimizePageLayout(fullContext, 'product_page');
        specialistResponses.set('DESIGN', specialistResponse.optimization);
        break;
      case 'CONSULT_ETHICS':
        specialistResponse = await this.specialists.ethics.reviewMarketingEthics(fullContext);
        specialistResponses.set('ETHICS', specialistResponse.review);
        break;
    }
    
    // Get final synthesis
    return await this.getFinalSynthesis(message, userProfile, specialistResponses);
  }

  async getFinalSynthesis(message, userProfile, specialistResponses) {
    const userProfileContext = this.formatUserProfileForAgents(userProfile);
    
    let allSpecialistInput = '\n--- SPECIALIST INPUT ---\n';
    for (let [specialist, response] of specialistResponses) {
      allSpecialistInput += `${specialist}: ${response}\n\n`;
    }
    
    // Create system prompt based on whether profile is available
    const hasProfile = userProfile && userProfile.id;
    const systemPrompt = hasProfile 
      ? `You are Alex, an expert coordinator. Synthesize the specialist knowledge into a helpful, comprehensive response. Consider the user profile information to tailor your response appropriately. Do not mention internal consultations - present as if you personally have this expertise. Provide actionable recommendations and clear next steps.`
      : `You are Alex, an expert coordinator. Synthesize the specialist knowledge into a helpful, comprehensive response. Do not mention internal consultations - present as if you personally have this expertise. Provide actionable recommendations and clear next steps.`;
    
    // Create user prompt based on whether profile is available
    const userPrompt = hasProfile
      ? `${userProfileContext}User Request:
${message}

Expert Knowledge:
${allSpecialistInput}

Provide a complete response that addresses the user's needs with clear recommendations and practical guidance. Tailor your response based on the user profile information (age, location, permission level, segments, etc.). Structure your response logically and include specific next steps where appropriate.`
      : `User Request:
${message}

Expert Knowledge:
${allSpecialistInput}

Provide a complete response that addresses the user's needs with clear recommendations and practical guidance. Base your recommendations solely on the message content and specialist analysis. Structure your response logically and include specific next steps where appropriate.`;
    
    const prompt = {
      system: systemPrompt,
      user: userPrompt
    };

    return await this.callOpenAI(prompt, 'Final Synthesis');
  }

  // New methods for direct specialist consultation
  async consultSpecialistDirectly(specialistType, method, userMessage, ...args) {
    try {
      const specialist = this.specialists[specialistType];
      if (!specialist) {
        throw new Error(`Unknown specialist type: ${specialistType}`);
      }
      
      if (typeof specialist[method] !== 'function') {
        throw new Error(`Unknown method ${method} for specialist ${specialistType}`);
      }
      
      return await specialist[method](userMessage, ...args);
    } catch (error) {
      console.error(`Error consulting ${specialistType} specialist:`, error);
      throw error;
    }
  }

  async callOpenAI(prompt, agentName = 'System') {
    return await openaiService.createSimpleCompletion(prompt, {
      model: openaiService.getAvailableModels().GPT_4O,
      maxTokens: openaiService.getTokenLimits().EXTENDED,
      temperature: 0.7
    });
  }

  // Utility methods for getting specialist personalities
  getSpecialistPersonalities() {
    const personalities = {};
    
    // Get personalities from available specialists
    Object.entries(this.specialists).forEach(([key, specialist]) => {
      if (specialist && typeof specialist.getPersonality === 'function') {
        personalities[key] = specialist.getPersonality();
      }
    });
    
    return personalities;
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
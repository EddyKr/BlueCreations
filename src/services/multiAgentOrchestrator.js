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
4. Recommend products when users ask for product suggestions or shopping advice

DECISION RULES:
- Have enough context from the message → CONSULT_SPECIALISTS or ANSWER_DIRECTLY
- Simple questions → ANSWER_DIRECTLY
- Product/shopping requests → CONSULT_PRODUCTS
- Focus on conversion optimization and ethical selling

AVAILABLE SPECIALISTS:
- Alex (Analytics Specialist) - for analyzing user behavior, conversion funnels, and performance optimization
- Maya (Persuasion Specialist) - for creating compelling messaging and addressing customer objections
- Sam (Content Generation Specialist) - for creating product descriptions and marketing copy
- Jordan (UI/UX Conversion Specialist) - for optimizing page layouts and checkout flows
- Dr. Riley (Ethics & Compliance Specialist) - for ensuring ethical marketing practices and compliance

PRODUCT RECOMMENDATIONS:
- When users ask for product suggestions, shopping advice, or mention wanting to buy something
- Uses user profile data (sport interests, budget, skill level, brand preferences) for personalization
- Provides tailored recommendations from available product catalog

RESPONSE FORMAT:
DECISION: [CONSULT_ANALYTICS | CONSULT_PERSUASION | CONSULT_CONTENT | CONSULT_DESIGN | CONSULT_ETHICS | CONSULT_PRODUCTS | ANSWER_DIRECTLY]
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

  // Load products from products.json
  loadProducts() {
    try {
      const productsPath = path.join(__dirname, '../data/products.json');
      const productsData = fs.readFileSync(productsPath, 'utf8');
      const products = JSON.parse(productsData);
      return products.products || [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  // Get product recommendations based on user profile
  getProductRecommendations(userProfile, limit = 3) {
    if (!userProfile) return [];
    
    const products = this.loadProducts();
    const sportInterests = this.getPropertyValues(userProfile, 'sport_interests');
    const budgetRange = this.getPropertyValues(userProfile, 'budget_range')[0] || 'moderate';
    const skillLevel = this.getPropertyValues(userProfile, 'skill_level')[0] || 'intermediate';
    const preferredBrands = this.getPropertyValues(userProfile, 'preferred_brands');
    
    // Filter products by sport interests
    let relevantProducts = products.filter(product => 
      sportInterests.includes(product.category)
    );
    
    // If no sport-specific products, include tennis as fallback
    if (relevantProducts.length === 0) {
      relevantProducts = products.filter(product => 
        product.category === 'tennis' || sportInterests.includes(product.category)
      );
    }
    
    // Score products based on profile match
    const scoredProducts = relevantProducts.map(product => {
      let score = 0;
      
      // Brand preference bonus
      if (preferredBrands.includes(product.brand)) {
        score += 30;
      }
      
      // Budget alignment
      const discountedPrice = product.price * (1 - product.discount / 100);
      if (budgetRange === 'budget' && discountedPrice <= 200) score += 25;
      else if (budgetRange === 'moderate' && discountedPrice >= 100 && discountedPrice <= 500) score += 25;
      else if (budgetRange === 'premium' && discountedPrice >= 200 && discountedPrice <= 800) score += 25;
      else if (budgetRange === 'luxury' && discountedPrice >= 400) score += 25;
      
      // Skill level consideration (higher priced items for advanced/professional)
      if (skillLevel === 'professional' && discountedPrice >= 500) score += 20;
      else if (skillLevel === 'advanced' && discountedPrice >= 200) score += 15;
      else if (skillLevel === 'intermediate' && discountedPrice >= 100 && discountedPrice <= 600) score += 15;
      else if (skillLevel === 'recreational' && discountedPrice <= 400) score += 15;
      
      // Stock availability
      if (product.stock > 10) score += 10;
      else if (product.stock > 0) score += 5;
      
      // Discount bonus
      if (product.discount > 15) score += 10;
      else if (product.discount > 0) score += 5;
      
      return { ...product, score };
    });
    
    // Sort by score and return top recommendations
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Helper method to get property values from user profile
  getPropertyValues(userProfile, propertyId) {
    if (!userProfile.properties) return [];
    const property = userProfile.properties.find(prop => prop.id === propertyId);
    return property ? property.values : [];
  }

  // Format product recommendations for display
  formatProductRecommendations(recommendations, userProfile) {
    if (recommendations.length === 0) {
      return '\nNo specific product recommendations available based on your profile.';
    }
    
    const userName = this.getPropertyValues(userProfile, 'name')[0] || 'there';
    const sportInterests = this.getPropertyValues(userProfile, 'sport_interests');
    
    let output = `\n--- PERSONALIZED PRODUCT RECOMMENDATIONS FOR ${userName.toUpperCase()} ---\n`;
    output += `Based on your interests in: ${sportInterests.join(', ')}\n\n`;
    
    recommendations.forEach((product, index) => {
      const discountedPrice = product.price * (1 - product.discount / 100);
      const savings = product.price - discountedPrice;
      
      output += `${index + 1}. ${product.name} by ${product.brand}\n`;
      output += `   ${product.description}\n`;
      output += `   Price: $${discountedPrice.toFixed(2)}`;
      if (product.discount > 0) {
        output += ` (was $${product.price}, save $${savings.toFixed(2)})`;
      }
      output += `\n   Stock: ${product.stock} available\n`;
      output += `   Match Score: ${product.score}/100\n\n`;
    });
    
    return output;
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
- CONSULT_PRODUCTS: For recommending products based on user profile and shopping intent
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
      case 'CONSULT_PRODUCTS':
        // Handle product recommendations directly
        const recommendations = this.getProductRecommendations(userProfile);
        const formattedRecommendations = this.formatProductRecommendations(recommendations, userProfile);
        specialistResponses.set('PRODUCTS', formattedRecommendations);
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
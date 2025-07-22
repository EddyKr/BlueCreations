const openaiService = require('../openaiService');

class PersuasionAgent {
  constructor() {
    this.personality = {
      name: "Maya",
      role: "Persuasion Specialist",
      systemPrompt: `You are Maya, a persuasion and conversion psychology specialist. You excel at:
- Creating compelling and persuasive messaging
- Understanding psychological triggers that drive purchases
- Developing urgency and scarcity tactics (ethically)
- Crafting effective call-to-action strategies
- Building trust and credibility through messaging
- Addressing customer objections and concerns
- Creating social proof and testimonial strategies

COMMUNICATION STYLE:
- Persuasive yet authentic
- Focus on emotional and logical appeals
- Provide specific messaging examples
- Balance persuasion with ethics
- Consider customer psychology and motivations

PERSUASION FRAMEWORK:
1. Customer Psychology Analysis
2. Persuasive Messaging Strategy
3. Objection Handling Tactics
4. Trust and Credibility Building
5. Urgency and Scarcity Implementation
6. Social Proof Integration`
    };
  }

  async createPersuasiveContent(conversationHistory, contentType = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${contentType ? `CONTENT TYPE REQUESTED: ${contentType}` : ''}

Please create persuasive content that encourages purchases. Focus on:
1. Key psychological triggers to use
2. Compelling headlines and copy
3. Effective call-to-action phrases
4. Trust-building elements
5. Urgency and scarcity messaging
6. Objection handling strategies

Provide specific examples and explain the psychology behind each recommendation.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        content: response,
        analysisType: 'persuasive_content',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Persuasion Agent error:', error);
      throw new Error(`Persuasive content creation failed: ${error.message}`);
    }
  }

  async optimizeCallToAction(conversationHistory, currentCTA) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Optimize call-to-action elements to maximize conversions.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

CURRENT CALL-TO-ACTION:
${currentCTA}

Please optimize the call-to-action strategy:
1. Analyze current CTA effectiveness
2. Suggest improved wording and positioning
3. Recommend psychological triggers to include
4. Propose A/B testing variations
5. Consider button design and placement
6. Address potential customer hesitations`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        optimization: response,
        analysisType: 'cta_optimization',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('CTA optimization error:', error);
      throw new Error(`CTA optimization failed: ${error.message}`);
    }
  }

  async handleObjections(conversationHistory, commonObjections = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Address customer objections and build persuasive counter-arguments.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${commonObjections ? `COMMON OBJECTIONS: ${commonObjections}` : ''}

Please provide objection handling strategies:
1. Identify likely customer objections
2. Create persuasive responses for each objection
3. Suggest proactive messaging to prevent objections
4. Recommend trust-building elements
5. Propose social proof strategies
6. Address price and value concerns`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        objectionHandling: response,
        analysisType: 'objection_handling',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Objection handling error:', error);
      throw new Error(`Objection handling failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new PersuasionAgent(); 
const openaiService = require('../openaiService');

class EthicsAgent {
  constructor() {
    this.personality = {
      name: "Dr. Riley",
      role: "Ethics & Compliance Specialist",
      systemPrompt: `You are Dr. Riley, an ethics and compliance specialist for ecommerce marketing. You excel at:
- Ensuring marketing practices are ethical and transparent
- Reviewing persuasion tactics for potential manipulation
- Ensuring compliance with consumer protection laws
- Balancing conversion optimization with customer trust
- Identifying potentially deceptive practices
- Promoting sustainable and responsible business practices
- Ensuring accessibility and inclusivity in marketing

COMMUNICATION STYLE:
- Balanced and objective
- Focus on long-term customer relationships
- Provide regulatory compliance guidance
- Emphasize transparency and honesty
- Consider diverse customer perspectives
- Balance business goals with ethical responsibility

ETHICS FRAMEWORK:
1. Transparency and Honesty Assessment
2. Consumer Protection Compliance
3. Accessibility and Inclusivity Review
4. Long-term Relationship Impact
5. Regulatory and Legal Considerations
6. Sustainable Business Practice Evaluation`
    };
  }

  async reviewMarketingEthics(conversationHistory, marketingContent = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${marketingContent ? `MARKETING CONTENT TO REVIEW: ${marketingContent}` : ''}

Please provide an ethical review of the marketing strategies and content:
1. Transparency and honesty assessment
2. Potential manipulation or deception concerns
3. Consumer protection compliance
4. Accessibility and inclusivity considerations
5. Long-term customer relationship impact
6. Recommendations for ethical improvements

Focus on building sustainable customer relationships while maintaining effectiveness.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.4
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        review: response,
        analysisType: 'ethics_review',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Ethics Agent error:', error);
      throw new Error(`Ethics review failed: ${error.message}`);
    }
  }

  async assessCompliance(conversationHistory, businessType, targetMarkets = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Assess compliance with relevant laws and regulations for the business and markets.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

BUSINESS TYPE: ${businessType}
${targetMarkets ? `TARGET MARKETS: ${targetMarkets}` : ''}

Please assess compliance requirements:
1. Relevant consumer protection laws
2. Advertising and marketing regulations
3. Data privacy and protection requirements
4. Accessibility compliance (ADA, WCAG)
5. Industry-specific regulations
6. International compliance considerations

Provide specific guidance and recommendations for compliance.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.3
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        compliance: response,
        analysisType: 'compliance_assessment',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Compliance assessment error:', error);
      throw new Error(`Compliance assessment failed: ${error.message}`);
    }
  }

  async balancePersuasionEthics(conversationHistory, persuasionTactics) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Balance persuasive tactics with ethical considerations and customer trust.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PERSUASION TACTICS: ${persuasionTactics}

Please evaluate the ethical implications:
1. Assess each tactic for ethical concerns
2. Identify potential customer harm or manipulation
3. Suggest ethical alternatives that maintain effectiveness
4. Consider impact on vulnerable populations
5. Recommend transparency improvements
6. Balance short-term gains with long-term trust

Provide guidance for ethical persuasion that builds lasting customer relationships.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.4
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        ethicalGuidance: response,
        analysisType: 'persuasion_ethics',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Persuasion ethics evaluation error:', error);
      throw new Error(`Persuasion ethics evaluation failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new EthicsAgent(); 
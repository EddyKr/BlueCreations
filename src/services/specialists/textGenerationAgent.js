const openaiService = require('../openaiService');

class TextGenerationAgent {
  constructor() {
    this.personality = {
      name: "Sam",
      role: "Content Generation Specialist",
      systemPrompt: `You are Sam, a content generation specialist for ecommerce. You excel at:
- Creating compelling product descriptions that sell
- Writing engaging marketing copy and headlines
- Crafting email marketing campaigns
- Developing category and landing page content
- Creating urgency-driven promotional copy
- Writing customer testimonials and reviews
- Generating SEO-optimized content for conversions

COMMUNICATION STYLE:
- Creative and engaging
- Focus on benefits over features
- Use emotional and sensory language
- Create clear, scannable content
- Balance persuasion with information
- Optimize for both humans and search engines

CONTENT FRAMEWORK:
1. Audience and Voice Analysis
2. Benefit-Focused Messaging
3. Emotional Engagement Strategy
4. SEO and Conversion Optimization
5. Call-to-Action Integration
6. Brand Consistency Maintenance`
    };
  }

  async generateProductContent(conversationHistory, productDetails = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${productDetails ? `PRODUCT DETAILS: ${productDetails}` : ''}

Please generate compelling product content that drives sales. Focus on:
1. Attention-grabbing headlines
2. Benefit-focused product descriptions
3. Emotional appeal and storytelling
4. Key selling points and unique value
5. Trust signals and credibility elements
6. Clear call-to-action messaging

Provide multiple variations and explain the strategy behind each approach.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.8
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        content: response,
        analysisType: 'product_content',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Text Generation Agent error:', error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  async createMarketingCopy(conversationHistory, campaignType, targetAudience = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Create compelling marketing copy for specific campaigns and audiences.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

CAMPAIGN TYPE: ${campaignType}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

Please create marketing copy that converts:
1. Headlines and subject lines
2. Body copy with emotional hooks
3. Feature-to-benefit translations
4. Urgency and scarcity messaging
5. Social proof integration
6. Compelling offers and incentives

Tailor the tone and messaging for the specific campaign type and audience.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        marketingCopy: response,
        analysisType: 'marketing_copy',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Marketing copy creation error:', error);
      throw new Error(`Marketing copy creation failed: ${error.message}`);
    }
  }

  async optimizeContent(conversationHistory, existingContent, optimizationGoal) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Optimize existing content to improve conversions and engagement.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

EXISTING CONTENT:
${existingContent}

OPTIMIZATION GOAL: ${optimizationGoal}

Please optimize the content:
1. Identify areas for improvement
2. Suggest specific rewrites and enhancements
3. Improve clarity and persuasiveness
4. Enhance emotional appeal
5. Optimize for conversions
6. Maintain brand voice and consistency`
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
        analysisType: 'content_optimization',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Content optimization error:', error);
      throw new Error(`Content optimization failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new TextGenerationAgent(); 
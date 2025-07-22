const openaiService = require('../openaiService');

class HtmlCssAgent {
  constructor() {
    this.personality = {
      name: "Jordan",
      role: "UI/UX Conversion Specialist",
      systemPrompt: `You are Jordan, a UI/UX specialist focused on conversion optimization. You excel at:
- Designing high-converting landing pages and product pages
- Optimizing checkout flows and forms
- Creating effective visual hierarchy for sales
- Implementing mobile-first responsive design
- Optimizing page load speeds for conversions
- Designing trust-building visual elements
- Creating effective product galleries and showcases

COMMUNICATION STYLE:
- Technical yet accessible
- Provide specific code examples
- Focus on conversion impact
- Consider mobile and accessibility
- Balance aesthetics with functionality
- Use data-driven design principles

DESIGN FRAMEWORK:
1. Conversion-Focused Layout Analysis
2. Visual Hierarchy Optimization
3. Mobile-First Responsive Strategy
4. Trust and Credibility Design
5. Performance and Loading Optimization
6. A/B Testing Implementation`
    };
  }

  async optimizePageLayout(conversationHistory, pageType, currentLayout = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PAGE TYPE: ${pageType}
${currentLayout ? `CURRENT LAYOUT: ${currentLayout}` : ''}

Please provide UI/UX optimization recommendations for maximum conversions:
1. Layout structure and visual hierarchy
2. Key conversion elements placement
3. Mobile responsiveness considerations
4. Trust signals and credibility design
5. Performance optimization techniques
6. Specific HTML/CSS implementation examples

Focus on elements that directly impact purchase decisions and conversion rates.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        optimization: response,
        analysisType: 'page_layout',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('HTML/CSS Agent error:', error);
      throw new Error(`Layout optimization failed: ${error.message}`);
    }
  }

  async designConversionElements(conversationHistory, elementType, specifications = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Design specific UI elements that maximize conversions and user engagement.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

ELEMENT TYPE: ${elementType}
${specifications ? `SPECIFICATIONS: ${specifications}` : ''}

Please design conversion-optimized UI elements:
1. Visual design principles for conversions
2. HTML structure and semantic markup
3. CSS styling for trust and appeal
4. Interactive states and animations
5. Mobile optimization considerations
6. Accessibility and usability features

Provide complete code examples with explanations.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.5
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        design: response,
        analysisType: 'conversion_elements',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Conversion elements design error:', error);
      throw new Error(`Conversion elements design failed: ${error.message}`);
    }
  }

  async optimizeCheckoutFlow(conversationHistory, currentFlow = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Optimize checkout flow design to minimize abandonment and maximize completion.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${currentFlow ? `CURRENT CHECKOUT FLOW: ${currentFlow}` : ''}

Please optimize the checkout flow for conversions:
1. Flow structure and step optimization
2. Form design and field optimization
3. Trust signals and security indicators
4. Progress indicators and feedback
5. Error handling and validation
6. Mobile checkout optimization

Provide specific UI/UX recommendations with implementation details.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.5
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        checkoutOptimization: response,
        analysisType: 'checkout_flow',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Checkout flow optimization error:', error);
      throw new Error(`Checkout flow optimization failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new HtmlCssAgent(); 
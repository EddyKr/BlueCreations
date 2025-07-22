const openaiService = require('../openaiService');

class DomainExpertB {
  constructor() {
    this.personality = {
      name: "Dr. Sarah",
      role: "Domain Expert B - UX/UI Design & Product Strategy",
      systemPrompt: `You are Dr. Sarah, a senior domain expert specializing in user experience design and product strategy. Your expertise includes:

DESIGN & UX DOMAINS:
- User experience (UX) design principles
- User interface (UI) design and patterns
- User research and persona development
- Information architecture and wireframing
- Usability testing and validation
- Accessibility and inclusive design
- Design systems and component libraries
- Mobile-first and responsive design

PRODUCT STRATEGY AREAS:
- Product roadmap planning
- Feature prioritization and MVP definition
- User journey mapping and optimization
- Market research and competitive analysis
- Product-market fit validation
- Growth strategies and user acquisition
- Analytics and user behavior analysis
- A/B testing and conversion optimization

BUSINESS CONSIDERATIONS:
- Market positioning and differentiation
- User adoption and engagement strategies
- Monetization and business model design
- Brand identity and messaging
- Content strategy and information design
- Social media and digital marketing integration

COMMUNICATION STYLE:
- Focus on user-centered design approaches
- Provide actionable design and product recommendations
- Consider business goals alongside user needs
- Reference industry standards and best practices
- Always maintain context from the conversation
- Balance creativity with practical constraints
- Emphasize measurable outcomes and user value

RESPONSE FRAMEWORK:
1. User Experience Analysis
2. Design Recommendations
3. Product Strategy Insights
4. Business Alignment
5. Implementation Approach
6. Success Metrics & Validation`
    };
  }

  async analyzeUserExperience(conversationHistory, targetUsers = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${targetUsers ? `TARGET USERS: ${targetUsers}` : ''}

Please provide a comprehensive UX analysis including:
1. Target user analysis and persona development
2. User journey mapping and pain points
3. Information architecture recommendations
4. UI/UX design principles and patterns
5. Accessibility and usability considerations
6. Mobile and responsive design strategy
7. User research and testing recommendations
8. Success metrics and validation approaches

Focus on creating exceptional user experiences that drive engagement and satisfaction.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        uxAnalysis: response,
        expertiseType: 'ux-analysis',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Domain Expert B error:', error);
      throw new Error(`UX analysis failed: ${error.message}`);
    }
  }

  async developProductStrategy(conversationHistory, businessGoals = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Develop comprehensive product strategy and roadmap recommendations.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${businessGoals ? `BUSINESS GOALS: ${businessGoals}` : ''}

Please provide product strategy guidance including:
1. Product vision and positioning
2. MVP definition and feature prioritization
3. Go-to-market strategy
4. User acquisition and retention approaches
5. Competitive analysis and differentiation
6. Product roadmap and milestone planning
7. Success metrics and KPI definition
8. Risk assessment and mitigation strategies

Focus on creating a viable product strategy that balances user needs with business objectives.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        productStrategy: response,
        expertiseType: 'product-strategy',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Product strategy development error:', error);
      throw new Error(`Product strategy development failed: ${error.message}`);
    }
  }

  async designUserInterface(conversationHistory, designRequirements) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Provide detailed UI design recommendations and guidelines.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

DESIGN REQUIREMENTS: ${designRequirements}

Please provide UI design guidance including:
1. Visual design principles and aesthetics
2. Component design and design system recommendations
3. Navigation and interaction patterns
4. Color schemes and typography suggestions
5. Layout and spacing guidelines
6. Responsive design considerations
7. Accessibility compliance strategies
8. Brand alignment and visual identity
9. Prototyping and design validation approaches

Focus on creating intuitive, attractive, and functional user interfaces.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        uiDesign: response,
        expertiseType: 'ui-design',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('UI design guidance error:', error);
      throw new Error(`UI design guidance failed: ${error.message}`);
    }
  }

  async optimizeConversion(conversationHistory, conversionGoals) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Provide conversion optimization and user engagement strategies.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

CONVERSION GOALS: ${conversionGoals}

Please provide conversion optimization recommendations including:
1. Conversion funnel analysis and optimization
2. Landing page design and messaging strategies
3. Call-to-action optimization
4. User onboarding and activation strategies
5. A/B testing recommendations
6. User behavior analysis approaches
7. Growth hacking and engagement tactics
8. Retention and loyalty strategies

Focus on strategies that measurably improve user conversion and engagement.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        conversionOptimization: response,
        expertiseType: 'conversion-optimization',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Conversion optimization error:', error);
      throw new Error(`Conversion optimization failed: ${error.message}`);
    }
  }

  async validateMarketFit(conversationHistory, productConcept) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Assess product-market fit and provide validation strategies.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PRODUCT CONCEPT: ${productConcept}

Please provide market validation guidance including:
1. Target market analysis and sizing
2. Competitive landscape assessment
3. Value proposition validation
4. Customer development strategies
5. Market research methodologies
6. Validation experiment design
7. Success criteria and metrics
8. Pivot and iteration strategies

Focus on practical approaches to validate market demand and product-market fit.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        marketValidation: response,
        expertiseType: 'market-validation',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Market validation error:', error);
      throw new Error(`Market validation failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new DomainExpertB(); 
const openaiService = require('../openaiService');

class DomainExpertA {
  constructor() {
    this.personality = {
      name: "Dr. Maya",
      role: "Domain Expert A - Software Architecture & Web Development",
      systemPrompt: `You are Dr. Maya, a senior domain expert specializing in software architecture and web development. Your expertise includes:

TECHNICAL DOMAINS:
- Full-stack web application architecture
- Frontend frameworks (React, Vue, Angular)
- Backend technologies (Node.js, Python, Java, .NET)
- Database design and optimization
- Cloud platforms and deployment strategies
- Microservices and API design
- Security best practices
- Performance optimization
- DevOps and CI/CD pipelines

EXPERTISE AREAS:
- System architecture design
- Technology stack recommendations
- Scalability planning
- Integration patterns
- Code quality and maintainability
- Modern development practices
- Industry standards and compliance

COMMUNICATION STYLE:
- Provide expert-level technical guidance
- Recommend specific technologies and approaches
- Consider scalability, maintainability, and performance
- Reference industry best practices
- Always maintain context from the conversation
- Give practical, actionable recommendations
- Consider budget and timeline constraints

RESPONSE FRAMEWORK:
1. Technical Analysis
2. Recommended Approach
3. Technology Stack Suggestions
4. Architecture Considerations
5. Implementation Strategy
6. Potential Challenges & Mitigation`
    };
  }

  async provideDomainGuidance(conversationHistory, specificDomain = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${specificDomain ? `SPECIFIC DOMAIN FOCUS: ${specificDomain}` : ''}

Based on the requirements and context provided, please provide expert domain guidance including:
1. Technical architecture recommendations
2. Suggested technology stack
3. Best practices for this type of project
4. Scalability considerations
5. Security recommendations
6. Performance optimization strategies
7. Development approach and methodology

Provide specific, actionable recommendations with clear reasoning.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        guidance: response,
        expertiseType: 'domain-guidance',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Domain Expert A error:', error);
      throw new Error(`Domain guidance failed: ${error.message}`);
    }
  }

  async recommendTechStack(conversationHistory, projectType, constraints = {}) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Provide detailed technology stack recommendations based on project requirements.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PROJECT TYPE: ${projectType}
CONSTRAINTS: ${JSON.stringify(constraints, null, 2)}

Please recommend a complete technology stack including:
1. Frontend technologies and frameworks
2. Backend languages and frameworks
3. Database solutions
4. Cloud/hosting platforms
5. Development tools and services
6. Third-party integrations
7. DevOps and deployment tools

For each recommendation, provide:
- Specific technology choices
- Reasoning for the selection
- Pros and cons
- Learning curve considerations
- Community support and ecosystem
- Long-term maintenance implications`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        techStackRecommendation: response,
        expertiseType: 'tech-stack',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Tech stack recommendation error:', error);
      throw new Error(`Tech stack recommendation failed: ${error.message}`);
    }
  }

  async reviewArchitecture(conversationHistory, proposedArchitecture) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Review and provide expert feedback on the proposed architecture.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PROPOSED ARCHITECTURE:
${proposedArchitecture}

Please provide an expert architectural review covering:
1. Architecture strengths and benefits
2. Potential weaknesses or concerns
3. Scalability implications
4. Security considerations
5. Maintainability factors
6. Performance characteristics
7. Alternative approaches to consider
8. Implementation recommendations
9. Risk mitigation strategies

Be specific about technical concerns and provide actionable improvement suggestions.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.5
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        architectureReview: response,
        expertiseType: 'architecture-review',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Architecture review error:', error);
      throw new Error(`Architecture review failed: ${error.message}`);
    }
  }

  async suggestBestPractices(conversationHistory, developmentPhase) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Suggest industry best practices for the specific development phase.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

DEVELOPMENT PHASE: ${developmentPhase}

Please provide best practices recommendations for this development phase including:
1. Code quality standards
2. Testing strategies
3. Documentation requirements
4. Security practices
5. Performance optimization
6. Deployment practices
7. Monitoring and maintenance
8. Team collaboration approaches

Focus on practical, implementable practices that will ensure project success.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        bestPractices: response,
        expertiseType: 'best-practices',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Best practices recommendation error:', error);
      throw new Error(`Best practices recommendation failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new DomainExpertA(); 
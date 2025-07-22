const openaiService = require('../openaiService');

class TechnicalAdvisor {
  constructor() {
    this.personality = {
      name: "Tech",
      role: "Technical Implementation Advisor",
      systemPrompt: `You are Tech, a technical implementation expert with deep practical experience. You specialize in:

IMPLEMENTATION EXPERTISE:
- Practical coding solutions and implementations
- Cost analysis and budget optimization
- Technical constraints and realistic timelines
- Performance optimization strategies
- Troubleshooting and debugging approaches
- Code review and quality assurance
- Technical debt management
- Deployment and DevOps practices

PRACTICAL FOCUS AREAS:
- Implementation complexity assessment
- Resource estimation (time, cost, personnel)
- Technical risk identification and mitigation
- Tool and library recommendations
- Development workflow optimization
- Testing and quality assurance strategies
- Monitoring and maintenance planning
- Scaling and optimization approaches

COMMUNICATION STYLE:
- Focus on practical, implementable solutions
- Provide realistic timelines and cost estimates
- Identify potential technical roadblocks early
- Suggest efficient implementation approaches
- Always reference the established project context
- Balance ideal solutions with practical constraints
- Give step-by-step implementation guidance

ANALYSIS FRAMEWORK:
1. Implementation Complexity Assessment
2. Resource Requirements Analysis
3. Technical Risk Evaluation
4. Cost-Benefit Analysis
5. Timeline Estimation
6. Recommended Implementation Approach
7. Quality Assurance Strategy
8. Maintenance and Scaling Considerations`
    };
  }

  async analyzeImplementation(conversationHistory, proposedSolution = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${proposedSolution ? `PROPOSED SOLUTION: ${proposedSolution}` : ''}

Please provide a comprehensive technical implementation analysis including:
1. Implementation complexity breakdown
2. Required technical skills and expertise
3. Estimated development timeline
4. Resource requirements (developers, tools, services)
5. Potential technical challenges and solutions
6. Cost implications and optimization opportunities
7. Quality assurance and testing strategy
8. Deployment and maintenance considerations

Provide realistic estimates and practical implementation guidance.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        implementationAnalysis: response,
        analysisType: 'implementation',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Technical Advisor error:', error);
      throw new Error(`Implementation analysis failed: ${error.message}`);
    }
  }

  async estimateCosts(conversationHistory, projectScope, duration = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Provide detailed cost analysis and estimation for the project.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PROJECT SCOPE: ${projectScope}
${duration ? `ESTIMATED DURATION: ${duration}` : ''}

Please provide a comprehensive cost analysis including:
1. Development costs (personnel, time)
2. Infrastructure and hosting costs
3. Third-party services and licenses
4. Tools and software requirements
5. Ongoing maintenance costs
6. Potential hidden costs and contingencies
7. Cost optimization strategies
8. Budget recommendations for different phases

Provide realistic cost ranges and explain the factors that might affect pricing.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.5
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        costAnalysis: response,
        analysisType: 'cost-estimation',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Cost estimation error:', error);
      throw new Error(`Cost estimation failed: ${error.message}`);
    }
  }

  async identifyRisks(conversationHistory, implementationPlan) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Identify technical risks and provide mitigation strategies.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

IMPLEMENTATION PLAN: ${implementationPlan}

Please identify and analyze technical risks including:
1. Technical complexity risks
2. Resource and timeline risks
3. Technology and tool risks
4. Integration and compatibility risks
5. Scalability and performance risks
6. Security and compliance risks
7. Team and skill-related risks
8. External dependency risks

For each risk, provide:
- Risk probability and impact assessment
- Potential consequences
- Mitigation strategies
- Contingency plans
- Early warning indicators`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        riskAnalysis: response,
        analysisType: 'risk-assessment',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Risk identification error:', error);
      throw new Error(`Risk identification failed: ${error.message}`);
    }
  }

  async optimizePerformance(conversationHistory, performanceConcerns) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Provide performance optimization recommendations and strategies.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PERFORMANCE CONCERNS: ${performanceConcerns}

Please provide performance optimization guidance including:
1. Performance bottleneck identification
2. Optimization strategies and techniques
3. Caching and data management approaches
4. Code optimization recommendations
5. Infrastructure optimization options
6. Monitoring and profiling strategies
7. Load testing and validation approaches
8. Scalability planning

Focus on practical, implementable optimizations with measurable impact.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        performanceOptimization: response,
        analysisType: 'performance-optimization',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Performance optimization error:', error);
      throw new Error(`Performance optimization failed: ${error.message}`);
    }
  }

  async troubleshootIssues(conversationHistory, technicalIssue) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Provide troubleshooting guidance and solutions for technical issues.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

TECHNICAL ISSUE: ${technicalIssue}

Please provide troubleshooting guidance including:
1. Issue analysis and root cause identification
2. Step-by-step debugging approach
3. Potential solutions and workarounds
4. Testing and validation methods
5. Prevention strategies for future occurrences
6. Tools and techniques for diagnosis
7. Documentation and logging recommendations

Provide practical, actionable troubleshooting steps.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        troubleshootingGuidance: response,
        analysisType: 'troubleshooting',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Troubleshooting guidance error:', error);
      throw new Error(`Troubleshooting guidance failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new TechnicalAdvisor(); 
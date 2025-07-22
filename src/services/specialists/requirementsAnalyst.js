const openaiService = require('../openaiService');

class RequirementsAnalyst {
  constructor() {
    this.personality = {
      name: "Sam",
      role: "Requirements Analyst",
      systemPrompt: `You are Sam, a requirements analyst. You excel at:
- Clarifying project requirements and constraints
- Identifying critical success factors
- Understanding user needs and contexts
- Breaking down complex projects into specifications
- Asking the right questions to uncover hidden requirements
- Prioritizing features and functionality
- Identifying potential risks and dependencies

COMMUNICATION STYLE:
- Be thorough but concise
- Ask specific, targeted questions
- Provide structured analysis
- Always reference the complete conversation history and build upon established context
- Focus on what's missing or unclear in the requirements

ANALYSIS FRAMEWORK:
1. Current Requirements Assessment
2. Missing Information Identification
3. Risk and Constraint Analysis
4. Success Criteria Definition
5. Next Steps Recommendation`
    };
  }

  async analyze(conversationHistory, specificRequest = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${specificRequest ? `SPECIFIC REQUEST: ${specificRequest}` : ''}

Please provide a comprehensive requirements analysis. Focus on:
1. What requirements are clearly defined
2. What critical information is missing
3. Potential risks or constraints to consider
4. Success criteria that should be established
5. Recommended next steps for requirements gathering

Format your response with clear sections and actionable insights.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.7
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        analysis: response,
        analysisType: 'requirements',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Requirements Analyst error:', error);
      throw new Error(`Requirements analysis failed: ${error.message}`);
    }
  }

  async clarifyRequirements(conversationHistory, unclearAreas) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: You are specifically asked to help clarify unclear or missing requirements.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

UNCLEAR AREAS IDENTIFIED:
${Array.isArray(unclearAreas) ? unclearAreas.join('\n- ') : unclearAreas}

Please provide specific questions and recommendations to clarify these unclear areas. Focus on:
- Specific questions to ask the user
- Information needed to move forward
- Potential assumptions we might need to validate
- Dependencies that need to be understood`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        clarification: response,
        analysisType: 'clarification',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Requirements clarification error:', error);
      throw new Error(`Requirements clarification failed: ${error.message}`);
    }
  }

  async assessFeasibility(conversationHistory, proposedSolution) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Assess the feasibility of the proposed solution against the requirements.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

PROPOSED SOLUTION:
${proposedSolution}

Please assess:
1. How well the solution meets the stated requirements
2. Potential gaps or misalignments
3. Implementation complexity considerations
4. Resource requirements
5. Timeline feasibility
6. Risk assessment`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.5
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        feasibilityAssessment: response,
        analysisType: 'feasibility',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Feasibility assessment error:', error);
      throw new Error(`Feasibility assessment failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new RequirementsAnalyst(); 
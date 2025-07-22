const openaiService = require('../openaiService');

class AnalyticsAgent {
  constructor() {
    this.personality = {
      name: "Alex",
      role: "Analytics Specialist",
      systemPrompt: `You are Alex, an ecommerce analytics specialist. You excel at:
- Analyzing user behavior patterns and conversion funnels
- Identifying drop-off points and optimization opportunities
- Recommending A/B testing strategies
- Interpreting conversion metrics and KPIs
- Understanding customer journey analytics
- Providing data-driven insights for sales optimization
- Identifying high-value customer segments

COMMUNICATION STYLE:
- Data-driven and analytical
- Provide specific metrics and benchmarks
- Suggest actionable testing strategies
- Always reference industry standards and best practices
- Focus on measurable outcomes and ROI

ANALYTICS FRAMEWORK:
1. Current Performance Assessment
2. User Behavior Analysis
3. Conversion Funnel Optimization
4. Customer Segmentation Insights
5. Testing and Optimization Recommendations`
    };
  }

  async analyzeConversion(conversationHistory, specificMetrics = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${specificMetrics ? `SPECIFIC METRICS TO ANALYZE: ${specificMetrics}` : ''}

Please provide a comprehensive conversion analysis. Focus on:
1. Key conversion metrics to track
2. User behavior patterns that drive sales
3. Common drop-off points and solutions
4. Customer segmentation strategies
5. A/B testing recommendations
6. Performance benchmarks and goals

Format your response with specific, actionable analytics insights.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        analysis: response,
        analysisType: 'conversion',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Analytics Agent error:', error);
      throw new Error(`Analytics analysis failed: ${error.message}`);
    }
  }

  async optimizeFunnel(conversationHistory, currentFunnel) {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Optimize the conversion funnel to increase sales and reduce drop-offs.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

CURRENT FUNNEL:
${currentFunnel}

Please provide funnel optimization recommendations:
1. Identify potential bottlenecks
2. Suggest conversion rate improvements
3. Recommend tracking and measurement strategies
4. Propose testing methodologies
5. Estimate expected impact on conversions`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.5
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        optimization: response,
        analysisType: 'funnel_optimization',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Funnel optimization error:', error);
      throw new Error(`Funnel optimization failed: ${error.message}`);
    }
  }

  async segmentCustomers(conversationHistory, customerData = '') {
    try {
      const prompt = {
        system: this.personality.systemPrompt + `

FOCUS: Analyze customer segments to create targeted marketing strategies.`,
        user: `CONVERSATION HISTORY:
${conversationHistory}

${customerData ? `CUSTOMER DATA: ${customerData}` : ''}

Please provide customer segmentation analysis:
1. Key customer segments to target
2. Behavioral patterns for each segment
3. Personalization strategies
4. Conversion optimization by segment
5. Lifetime value analysis
6. Targeted messaging recommendations`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.6
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        segmentation: response,
        analysisType: 'customer_segmentation',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Customer segmentation error:', error);
      throw new Error(`Customer segmentation failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new AnalyticsAgent(); 
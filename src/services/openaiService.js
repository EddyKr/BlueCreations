const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.config = {
      API_KEY: process.env.OPENAI_API_KEY,
      MODELS: {
        GPT_3_5_TURBO: 'gpt-3.5-turbo',
        GPT_4O: 'gpt-4o'
      },
      MAX_TOKENS: {
        STANDARD: 1000,
        EXTENDED: 1500
      }
    };
    this.initialize();
  }

  initialize() {
    if (!this.config.API_KEY) {
      console.warn('⚠️ OpenAI API key not configured');
      return;
    }
    this.client = new OpenAI({ apiKey: this.config.API_KEY });
    console.log('✅ OpenAI Service initialized');
  }

  async createSimpleCompletion(prompt, options = {}) {
    if (!this.client) {
      throw new Error('OpenAI not configured');
    }

    const {
      model = this.config.MODELS.GPT_4O,
      maxTokens = this.config.MAX_TOKENS.STANDARD,
      temperature = 0.7
    } = options;

    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ];

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature
    });

    return response.choices[0].message.content;
  }

  getAvailableModels() { return this.config.MODELS; }
  getTokenLimits() { return this.config.MAX_TOKENS; }
  isConfigured() { return !!this.client; }
}

module.exports = new OpenAIService(); 
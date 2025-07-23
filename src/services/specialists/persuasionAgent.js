const openaiService = require('../openaiService');

class PersuasionAgent {
  constructor() {
    this.personality = {
      name: "Maya",
      role: "Creative Persuasion Specialist",
      systemPrompt: `You are Maya, a CREATIVE persuasion and conversion psychology specialist who NEVER generates boring, repetitive content. You excel at:

- Crafting VARIED, engaging messaging that stands out
- Understanding deep psychological triggers beyond basic urgency
- Creating FRESH approaches using different emotional angles
- Avoiding overused phrases like "limited time", "don't miss", "shop now"
- Using creative vocabulary, power words, and unexpected language
- Mixing tones: playful, sophisticated, edgy, intimate, bold
- Building authentic excitement and genuine curiosity
- Don't use quotes in your responses
Additional details:
- Use psychology-driven strategies and emotional appeals to craft short,
- effective, and trustworthy messaging.
- Create persuasive copy using emotional and logical triggers.
- Include strong headlines, a clear CTA, and trust-building elements.
- Please keep the output concise (under 100 words). Use bullet points if helpful.
- Please do not include product description,
- Message should be able to catch and maintain users attention
- Message should be HTML supported text only and should not include asterisks , and should inlcude bullet points and emojis if necessary
       

CREATIVITY PRINCIPLES:
- ALWAYS vary your vocabulary and approach
- Use unexpected angles and fresh perspectives  
- Create emotional hooks that feel authentic
- Avoid predictable sales language
- Make every message feel like a discovery
- Use social currency and insider language
- Create curiosity gaps and intrigue

FORBIDDEN PHRASES (avoid these overused terms):
- "Limited time offer"
- "Don't miss out" 
- "Shop now"
- "Hurry up"
- "Last chance"
- "Act fast"

PREFERRED CREATIVE ALTERNATIVES:
- "Flash alert", "Plot twist", "Insider access", "Secret unlocked"
- "Breaking news", "VIP exclusive", "Members only", "Behind the scenes"
- "Price drop activated", "Savings unlocked", "Deal decoded"

TONE VARIETY: Cycle between energetic, sophisticated, playful, mysterious, authoritative, intimate, rebellious.`
    };
  }

  async createPersuasiveContent(conversationHistory, contentType = '') {
    try {
      // Add variety by randomly selecting different approaches
      const approaches = [
        'urgency_scarcity',
        'social_proof',
        'exclusive_vip',
        'emotional_fomo',
        'value_focused',
        'risk_reversal',
        'curiosity_gap',
        'seasonal_trending'
      ];
      
      const selectedApproach = approaches[Math.floor(Math.random() * approaches.length)];
      
      const prompt = {
        system: this.personality.systemPrompt + `

CURRENT APPROACH: ${selectedApproach}

VARIED MESSAGING STRATEGIES:
- urgency_scarcity: "Act fast! Limited time/quantity remaining"
- social_proof: "Join thousands who already saved" 
- exclusive_vip: "VIP members only" or "Exclusive early access"
- emotional_fomo: Fear of missing out emotional triggers
- value_focused: Emphasize incredible value and savings
- risk_reversal: "Risk-free" and guarantee messaging
- curiosity_gap: "Secret deals" or "Hidden savings"
- seasonal_trending: Tie to current trends/seasons

TONE VARIETIES: Mix between energetic, sophisticated, playful, authoritative, intimate, bold.

CREATIVE ELEMENTS: Use power words, sensory language, numbers, social currency, insider language.`,

        user: `CONVERSATION HISTORY:
${conversationHistory}

${contentType ? `CONTENT TYPE REQUESTED: ${contentType}` : ''}

Create SHORT, PUNCHY persuasive content using the ${selectedApproach} approach.

REQUIREMENTS:
- 1-2 sentences maximum
- Use VARIED vocabulary (avoid "limited time", "don't miss", "shop now" every time)
- Be creative and engaging, not formulaic
- Match the selected psychological approach
- Include emotional hooks and power words
- Make it feel fresh and exciting

VARIETY EXAMPLES:
• "Flash alert: 48-hour price drop activated!"
• "Insider access: Members save an extra 30% today"
• "Plot twist: Your cart just got cheaper"
• "Breaking: Premium gear at clearance prices"
• "Secret unlocked: VIP savings now live"

Generate ONE compelling message that feels fresh and exciting, not boring or repetitive.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.9 // Higher creativity
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        content: response,
        approach: selectedApproach,
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

  async generateCreativeVariations(conversationHistory, count = 3) {
    try {
      const variations = [];
      const approaches = [
        'urgency_scarcity',
        'social_proof', 
        'exclusive_vip',
        'emotional_fomo',
        'value_focused',
        'risk_reversal',
        'curiosity_gap',
        'seasonal_trending'
      ];

      // Generate multiple variations with different approaches
      for (let i = 0; i < count; i++) {
        const approach = approaches[i % approaches.length];
        
        const prompt = {
          system: this.personality.systemPrompt + `

CURRENT APPROACH: ${approach}
VARIATION NUMBER: ${i + 1} of ${count}

ENSURE EACH VARIATION IS COMPLETELY DIFFERENT in:
- Vocabulary used
- Emotional angle
- Tone of voice
- Psychological trigger
- Creative hook`,

          user: `CONVERSATION HISTORY:
${conversationHistory}

Generate a UNIQUE, creative persuasive message using the ${approach} approach.

Make this variation #${i + 1} completely DIFFERENT from typical messaging:
- Use unexpected vocabulary
- Create a unique emotional hook
- Be creative and memorable
- Keep it punchy (1-2 sentences max)
- Avoid clichéd sales language

CREATIVE INSPIRATION:
• "Your wallet just got lighter... in the best way"
• "Warning: Serious savings ahead"
• "Permission to spoil yourself granted" 
• "Code cracked: Elite pricing unlocked"
• "Plot armor activated for your budget"

Generate ONE fresh, exciting message that stands out.`
        };

        const response = await openaiService.createSimpleCompletion(prompt, {
          model: openaiService.getAvailableModels().GPT_4O,
          maxTokens: openaiService.getTokenLimits().STANDARD,
          temperature: 0.95 // Maximum creativity
        });

        variations.push({
          content: response,
          approach: approach,
          variationNumber: i + 1
        });
      }

      return {
        agent: this.personality.name,
        role: this.personality.role,
        variations: variations,
        totalCount: count,
        analysisType: 'creative_variations',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Creative variations error:', error);
      throw new Error(`Creative variations generation failed: ${error.message}`);
    }
  }

  async createHeaderCopy(conversationHistory, persuasionText = '', contentType = '') {
    try {
      // Use the same approach variety as the persuasion text
      const approaches = [
        'urgency_scarcity',
        'social_proof',
        'exclusive_vip',
        'emotional_fomo',
        'value_focused',
        'risk_reversal',
        'curiosity_gap',
        'seasonal_trending'
      ];
      
      const selectedApproach = approaches[Math.floor(Math.random() * approaches.length)];
      
      const prompt = {
        system: this.personality.systemPrompt + `

CURRENT APPROACH: ${selectedApproach}

HEADER COPY FOCUS: Create compelling headlines that complement persuasion text.

HEADER CHARACTERISTICS:
- Short and punchy (3-8 words ideal)
- Create immediate interest and curiosity
- Match the emotional tone of the persuasion text
- Use power words and active language
- Avoid generic phrases like "Great Deals" or "Shop Now"
- Create urgency or intrigue without being pushy
- Should work as main page headers or section titles

CREATIVE HEADER STYLES:
- Question hooks: "Ready for the upgrade?"
- Statement hooks: "Your style evolution starts here"
- Number hooks: "3 ways to save big today"
- Emotional hooks: "Feel the difference"
- Mystery hooks: "The secret everyone's talking about"
- Benefit hooks: "More for less, guaranteed"`,

        user: `CONVERSATION HISTORY:
${conversationHistory}

${persuasionText ? `PERSUASION TEXT TO MATCH:
${persuasionText}` : ''}

${contentType ? `CONTENT TYPE REQUESTED: ${contentType}` : ''}

Create a SHORT, POWERFUL header copy using the ${selectedApproach} approach that COMPLEMENTS the persuasion text.

REQUIREMENTS:
- 3-8 words maximum for main header
- Match the tone and energy of the persuasion text
- Use the same psychological approach (${selectedApproach})
- Be creative and attention-grabbing
- Should work well as a page/section header
- Avoid clichéd phrases

HEADER STYLE EXAMPLES:
• "Flash Alert: Premium Unlocked"
• "Members Only: Savings Inside"
• "Plot Twist: Everything's Cheaper"
• "Breaking: Your Upgrade Awaits"
• "Exclusive Access: VIP Pricing"
• "Secret Level: Unlocked"

Generate ONE compelling header that matches the persuasion text vibe.`
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().STANDARD,
        temperature: 0.9 // Higher creativity to match persuasion text
      });

      return {
        agent: this.personality.name,
        role: this.personality.role,
        headerCopy: response,
        approach: selectedApproach,
        analysisType: 'header_copy',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Header copy generation error:', error);
      throw new Error(`Header copy generation failed: ${error.message}`);
    }
  }

  getPersonality() {
    return this.personality;
  }
}

module.exports = new PersuasionAgent(); 
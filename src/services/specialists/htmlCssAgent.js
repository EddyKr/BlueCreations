const openaiService = require("../openaiService");

class HtmlCssAgent {
  constructor() {
    this.personality = {
      name: "Jordan",
      role: "UI/UX Conversion Specialist",
      systemPrompt: `NIKE-INSPIRED DESIGN SYSTEM:

GENERAL PRINCIPLES:
- Bold, athletic, performance-focused aesthetic
- High contrast black/white color scheme
- Minimal, impactful design with strong CTAs
- Mobile-first responsive approach
- Clean typography with strong hierarchy
- Full-width layouts with edge-to-edge imagery
- Use flexbox for product cards with flex-direction: column
- Product content should use flex: 1 with display: flex and flex-direction: column
- Buttons must be in a separate product-action div at the bottom

COMMUNICATION STYLE:
- Provide complete HTML/CSS code
- Focus on conversion and performance
- Create bold, confident designs
- Emphasize product imagery
- Use Nike's "Just Do It" energy

HTML STRUCTURE:
<div class="product-card">
  <div class="product-image" style="background-image: url('[USE ACTUAL PRODUCT IMAGE URL]');"></div>
  <div class="product-content">
    <div class="product-info">
      <h2 class="product-title">[PRODUCT NAME]</h2>
      <p class="product-price">$[PRODUCT PRICE]</p>
      <p class="product-description">[PRODUCT DESCRIPTION]</p>
    </div>
    <div class="product-action">
      <a href="#" class="product-button">Buy Now</a>
    </div>
  </div>
</div>
`,
    };
  }

  getPersonality() {
    return this.personality;
  }

  // ===== NEW: EMBEDDABLE RECOMMENDATION WIDGET GENERATOR =====
  async generateRecommendationWidget(
    campaignObjective,
    productList,
    additionalPrompt = "",
    widgetType = "product_cards",
    brandStyling = null,
    variation = 1
  ) {
    try {
      // Include product details in the prompt
      const productDetails = productList.map((product, index) => ({
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        discount: product.discount,
        brand: product.brand
      }));

      const prompt = {
        system:
          this.personality.systemPrompt +
          `

FOCUS: Generate complete, embeddable HTML/CSS recommendation widgets that can be directly inserted into any website div.

WIDGET TYPE: ${widgetType}

PRODUCT DATA:
${productDetails.map((p, i) => `
Product ${i + 1}:
- Name: ${p.name}
- Price: $${p.price}
- Description: ${p.description}
- Image URL: ${p.image}
- Brand: ${p.brand}
- Discount: ${p.discount}%
`).join('')}

USE THE ACTUAL PRODUCT IMAGE URLs PROVIDED ABOVE, NOT PLACEHOLDER IMAGES!

${brandStyling ? `

  PRODUCT CARDS:
- Image above all the text
- Product Title: 20-28px font size, 600-800 font weight, sans-serif, dark text (#111 or #000)
- Product Description: 16-20px font size, 300-500 font weight, sans-serif, MUST BE VISIBLE - use dark gray (#333 or #555) for readability
- Price: 20-28px font size, 600-800 font weight, sans-serif, dark text (#111 or #000)
- Button: 0-50px border radius, black/white high contrast, FULL WIDTH (width: 100%)
- Button Text: 600-800 font weight, uppercase preferred
- Layout: Clean grid, minimal gaps, high impact visuals
- Background: Light backgrounds (#FFF, #F5F5F5, #FAFAFA) with dark text for contrast

IMPORTANT: 
1. Include Google Fonts import in your CSS: @import url('https://fonts.googleapis.com/css2?family=${brandStyling.fonts.primary.replace(' ', '+')}:wght@400;500;600;700&family=${brandStyling.fonts.secondary.replace(' ', '+')}:wght@300;400;500&display=swap');
2. Use these brand colors and fonts throughout the design for consistency with the brand identity.
3. Apply font-family: '${brandStyling.fonts.primary}', ${brandStyling.fonts.fallback}; to headings and CTAs
4. Apply font-family: '${brandStyling.fonts.secondary}', ${brandStyling.fonts.fallback}; to body text and descriptions` : ""}
5. - Product Title: 20-28px font size, 600-800 font weight, sans-serif, dark text (#111 or #000)
- Product Description: 16-20px font size, 300-500 font weight, sans-serif, MUST BE VISIBLE - use dark gray (#333 or #555) for readability
- Price: 20-28px font size, 600-800 font weight, sans-serif, dark text (#111 or #000)
- Button: 0-50px border radius, black/white high contrast, FULL WIDTH (width: 100%)
- Button Text: 600-800 font weight, uppercase preferred
6. Postfix css classes with the variation number: ${variation}

${additionalPrompt ? `ADDITIONAL REQUIREMENTS: ${additionalPrompt}` : ""}

Generate a complete, embeddable HTML/CSS recommendation widget that:

1. Displays exactly 3 products (or fewer if less provided) in an attractive, conversion-focused layout
2. Uses a horizontal grid/flex layout optimized for 3 product cards
3. Includes compelling copy aligned with the campaign objective
4. Has clear call-to-action buttons ${brandStyling ? 'using the provided brand colors and fonts' : ''}
5. Is fully responsive and mobile-friendly (stack vertically on mobile)
6. Uses modern CSS techniques (flexbox/grid)
7. Includes hover effects and micro-interactions ${brandStyling ? 'with brand color and font theming' : ''}
8. Has proper semantic HTML structure
9. Can be directly copied and pasted into any website div
10. ${brandStyling ? 'Uses the brand colors and fonts consistently throughout the design' : 'Uses modern, appealing colors and fonts'}
11. ${brandStyling ? 'Includes Google Fonts imports at the top of the CSS' : 'Uses web-safe fonts'}
12. Optimizes the layout specifically for 3-product display (not more)
13. Generate a template for the widget that can be used to generate the widget for the product list
14. CRITICAL: Buttons must be aligned at the bottom of each card regardless of content length. Use flexbox layout:
    - .product-card { display: flex; flex-direction: column; height: 100%; }
    - .product-content { flex: 1; display: flex; flex-direction: column; }
    - .product-info { flex: 1; } to push buttons to bottom
    - .product-action { /* button container at bottom */ }
    - .cta-button, .product-button { width: 100%; display: block; }

Return ONLY the complete HTML/CSS code (including <style> tags) that can be embedded. No explanations outside the code.`,
      };

      const response = await openaiService.createSimpleCompletion(prompt, {
        model: openaiService.getAvailableModels().GPT_4O,
        maxTokens: openaiService.getTokenLimits().EXTENDED,
        temperature: 0.2,
      });

      // Clean up the response to ensure it's pure HTML/CSS
      const cleanedCode = this.cleanWidgetCode(response);

      return {
        agent: this.personality.name,
        role: this.personality.role,
        widgetCode: cleanedCode,
        widgetType: widgetType,
        campaignObjective: campaignObjective,
        productCount: productList.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Widget generation error:", error);
      throw new Error(`Widget generation failed: ${error.message}`);
    }
  }

  // Clean and validate the generated widget code
  cleanWidgetCode(rawCode) {
    // Remove any markdown code blocks
    let cleanCode = rawCode.replace(/```html|```css|```/g, "").trim();

    // Ensure it starts with proper HTML
    if (!cleanCode.startsWith("<")) {
      // If no HTML structure, wrap in a div
      cleanCode = `<div class="recommendation-widget">\n${cleanCode}\n</div>`;
    }

    // Add a default style block if none exists and contains HTML
    if (cleanCode.includes("<") && !cleanCode.includes("<style")) {
      const defaultStyles = `
<style>
.recommendation-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 100%;
  margin: 0 auto;
}
</style>`;
      cleanCode = defaultStyles + "\n" + cleanCode;
    }

    return cleanCode;
  }

  // Generate multiple widget variations for A/B testing
  async generateWidgetVariations(
    campaignObjective,
    productList,
    additionalPrompt = ""
  ) {
    try {
      const widgetTypes = ["product_cards", "banner", "compact"];
      const variations = [];

      for (const widgetType of widgetTypes) {
        const widget = await this.generateRecommendationWidget(
          campaignObjective,
          productList,
          additionalPrompt,
          widgetType
        );
        variations.push(widget);
      }

      return {
        agent: this.personality.name,
        role: this.personality.role,
        variations: variations,
        campaignObjective: campaignObjective,
        totalVariations: variations.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Widget variations generation error:", error);
      throw new Error(`Widget variations generation failed: ${error.message}`);
    }
  }
}

module.exports = new HtmlCssAgent();

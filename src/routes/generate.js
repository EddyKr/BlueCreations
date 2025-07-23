const express = require('express');
const multiAgentOrchestrator = require('../services/multiAgentOrchestrator');

const router = express.Router();

// Storage for saved campaigns
const savedCampaigns = new Map(); // key: campaign name, value: campaign data

// ===== BACK OFFICE ENDPOINTS FOR MARKETERS =====

// Generate 3 recommendation variations for marketers
router.post('/backoffice/generate', async (req, res) => {
  try {
    const { campaignObjective, additionalPrompt, category, brandName } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign objective is required'
      });
    }

    console.log('Back office: Generating 3 variations for marketer...');

    // Get brand colors and fonts if brand name is provided
    let brandStyling = null;
    if (brandName && brandName.trim()) {
      try {
        brandStyling = await getBrandStyling(brandName.trim());
        console.log(`Brand styling for ${brandName}:`, brandStyling);
      } catch (error) {
        console.error('Error getting brand styling:', error);
        // Continue without brand styling if there's an error
      }
    }

    // Load products from data folder
    const allProducts = multiAgentOrchestrator.loadProducts();
    
    if (!allProducts || allProducts.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No products available in the system'
      });
    }

    // Filter products by category if specified
    let productList = allProducts;
    if (category && category.trim()) {
      productList = allProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
      
      if (productList.length === 0) {
        return res.status(400).json({
          success: false,
          error: `No products found for category: ${category}`,
          availableCategories: [...new Set(allProducts.map(p => p.category))]
        });
      }
    }

    // Randomly select 3 products for widget display
    productList = getRandomProducts(productList, 3);

    // Generate 3 different variations with different styles
    const variations = await Promise.all([
      generateHtmlCssVariation('product_cards', campaignObjective, productList, additionalPrompt, brandStyling, 1, 'minimal'),
      generateHtmlCssVariation('product_cards', campaignObjective, productList, additionalPrompt, brandStyling, 2, 'bold'),
      generateHtmlCssVariation('product_cards', campaignObjective, productList, additionalPrompt, brandStyling, 3, 'premium')
    ]);

    // Format response
    const response = {
      success: true,
      variations: variations.map((variation, index) => ({
        id: `variation_${index + 1}`,
        widgetType: variation.widgetType,
        html: variation.html,
        css: variation.css,
        text: variation.text
      })),
      template: generateHtmlTemplate(),
      campaignObjective: campaignObjective,
      productCount: productList.length,
      category: category || 'all',
      products: productList.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        category: product.category,
        description: product.description,
        discount: product.discount || null,
        image: product.image || null
      })),
      generatedAt: new Date().toISOString(),
      brandName: brandName || null,
      brandStyling: brandStyling
    };

    res.json(response);
    
  } catch (error) {
    console.error('Back office generate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

// Save a recommendation campaign for later use
router.post('/backoffice/save-campaign', async (req, res) => {
  try {
    const { 
      campaignId,
      campaignName,
      campaignObjective, 
      variation, 
      targetingCriteria,
      category,
      notes,
      products 
    } = req.body;
    
    // Validate required fields
    if (!campaignName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required'
      });
    }
    
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign objective is required'
      });
    }
    
    // Check if campaign name already exists
    if (savedCampaigns.has(campaignName)) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name already exists. Please choose a different name.'
      });
    }
    
    // Create campaign object with targeting criteria for agent selection
    const campaign = {
      id: campaignId, // Use campaign name as ID
      name: campaignName,
      objective: campaignObjective,
      category: category || 'all',
      targetingCriteria: targetingCriteria || {
        segments: [],
        interests: [],
        demographics: {},
        behaviors: []
      },
      notes: notes || '',
      products: products || [],
      variation: {
        widgetType: variation.widgetType || 'product_cards',
        html: variation.html,
        css: variation.css,
        text: variation.text
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to storage using campaign name as key
    savedCampaigns.set(campaignName, campaign);
    
    console.log(`Campaign saved with name: ${campaignName}`);
    
    res.json({
      success: true,
      message: 'Campaign saved successfully',
      campaignId: campaignName, // Return campaign name as ID
      campaignName: campaignName,
      campaign: campaign
    });
    
  } catch (error) {
    console.error('Save campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save campaign',
      details: error.message
    });
  }
});

// Get all campaigns for back office
router.get('/backoffice/campaigns', (req, res) => {
  try {
    const { limit = 20, offset = 0, status, category } = req.query;
    
    let campaigns = Array.from(savedCampaigns.values());
    
    // Filter by status if specified
    if (status) {
      campaigns = campaigns.filter(c => c.status === status);
    }
    
    // Filter by category if specified
    if (category && category !== 'all') {
      campaigns = campaigns.filter(c => 
        c.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Sort by creation date (newest first)
    campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const total = campaigns.length;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedCampaigns = campaigns.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      campaigns: paginatedCampaigns,
      pagination: {
        total: total,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offsetNum + limitNum < total
      },
      filters: {
        status: status || 'all',
        category: category || 'all'
      }
    });
    
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve campaigns',
      details: error.message
    });
  }
});

// ===== FRONTEND ENDPOINT FOR USER RECOMMENDATION =====

// Get personalized recommendation based on user data
router.post('/frontend/get-recommendation', async (req, res) => {
  try {
    const { userProfile, context } = req.body;
    
    console.log('Frontend: Selecting recommendation for user...');
    
    // Get all active campaigns
    const activeCampaigns = Array.from(savedCampaigns.values())
      .filter(campaign => campaign.status === 'active');
    
    if (activeCampaigns.length === 0) {
      // No recommendations available - return empty as per requirement
      return res.json({
        success: true,
        recommendation: null,
        message: 'No recommendations available'
      });
    }
    
    // Use selection agent to find best matching campaign
    const selectedCampaign = await selectBestCampaignForUser(
      activeCampaigns,
      userProfile,
      context
    );
    
    if (!selectedCampaign) {
      // No matching recommendation - return empty as per requirement
      return res.json({
        success: true,
        recommendation: null,
        message: 'No matching recommendations for user profile'
      });
    }
    
    // Return the selected recommendation
    res.json({
      success: true,
      recommendation: {
        campaignId: selectedCampaign.id,
        campaignName: selectedCampaign.name,
        html: selectedCampaign.variation.html,
        css: selectedCampaign.variation.css,
        text: selectedCampaign.variation.text,
        widgetType: selectedCampaign.variation.widgetType,
        category: selectedCampaign.category,
        products: selectedCampaign.products || [],
        template: generateHtmlTemplate()
      },
      matchReason: selectedCampaign.matchReason || 'Profile match'
    });
    
  } catch (error) {
    console.error('Frontend recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendation',
      details: error.message
    });
  }
});

// ===== CLIENT-SIDE ENDPOINT FOR QUERY-BASED RECOMMENDATION =====

// Get recommendation based on query string parameters
router.get('/client/recommendation', (req, res) => {
  try {
    const { 
      campaignName,
      status = 'active'
    } = req.query;
    
    console.log('Client: Retrieving recommendation by query parameters...');
    
    // Get all campaigns with specified status
    let campaigns = Array.from(savedCampaigns.values())
      .filter(campaign => campaign.status === status);
    
    if (campaigns.length === 0) {
      return res.json({
        success: true,
        recommendation: null,
        message: 'No active recommendations available'
      });
    }
    
    // Filter by campaign name if provided
    if (campaignName) {
      campaigns = campaigns.filter(c => 
        c.name.toLowerCase().includes(campaignName.toLowerCase())
      );
    }

    if (campaigns.length === 0) {
      return res.json({
        success: true,
        recommendation: null,
        message: 'No recommendations match the query criteria'
      });
    }
    
    // Sort by creation date and return the most recent match
    campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const selectedCampaign = campaigns[0];
    
    // Build match criteria for response
    const matchCriteria = {};
    if (campaignName) matchCriteria.campaignName = campaignName;
    
    res.json({
      success: true,
      recommendation: formatRecommendationResponse(selectedCampaign),
      matchCriteria: matchCriteria,
      totalMatches: campaigns.length
    });
    
  } catch (error) {
    console.error('Client recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendation',
      details: error.message
    });
  }
});

// Helper function to format recommendation response
function formatRecommendationResponse(campaign) {
  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    category: campaign.category,
    html: campaign.variation.html,
    css: campaign.variation.css,
    text: campaign.variation.text,
    products: campaign.products || [],
    template: generateHtmlTemplate(),
    createdAt: campaign.createdAt
  };
}

// ===== HELPER FUNCTIONS =====

// Randomly select n items from an array
function getRandomProducts(products, count) {
  // If we have fewer products than requested, return all products
  if (products.length <= count) {
    return products;
  }
  
  // Create a copy of the array to avoid mutating the original
  const shuffled = [...products];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the first 'count' items from the shuffled array
  return shuffled.slice(0, count);
}

// Get brand colors and fonts using OpenAI
async function getBrandStyling(brandName) {
  try {
    const prompt = `You are a brand styling expert. Given a brand name, return the official brand colors and typography in a JSON format.

Brand: ${brandName}

Return only a JSON object with this exact structure:
{
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode", 
    "accent": "#hexcode",
    "text": "#hexcode",
    "background": "#hexcode"
  },
  "fonts": {
    "primary": "Google Font Name",
    "secondary": "Google Font Name",
    "fallback": "serif, sans-serif, or monospace"
  }
}

For the brand "${brandName}", provide:
COLORS:
- primary: The main brand color (usually the most recognizable color)
- secondary: A complementary color often used with the primary
- accent: A color used for highlights, buttons, or calls-to-action
- text: A suitable text color that works with the brand
- background: A suitable background color that works with the brand

FONTS (use actual Google Fonts names):
- primary: The main font used for headings and important text (e.g., "Roboto", "Open Sans", "Montserrat")
- secondary: A complementary font for body text (e.g., "Lato", "Source Sans Pro", "Inter")
- fallback: CSS font family fallback ("sans-serif", "serif", or "monospace")

Only return the JSON object, no other text.`;

    const result = await multiAgentOrchestrator.callOpenAI({
      system: "You are a brand styling expert that returns only valid JSON with colors and fonts for brands.",
      user: prompt
    }, 'Brand Styling Agent');

    // Clean and parse the response
    const cleanResponse = result.replace(/```json|```/g, '').trim();
    const styling = JSON.parse(cleanResponse);
    
    // Validate that we have the required properties
    const requiredColors = ['primary', 'secondary', 'accent', 'text', 'background'];
    const requiredFonts = ['primary', 'secondary', 'fallback'];
    
    const hasAllColors = styling.colors && requiredColors.every(color => 
      styling.colors[color] && styling.colors[color].startsWith('#')
    );
    
    const hasAllFonts = styling.fonts && requiredFonts.every(font => 
      styling.fonts[font] && styling.fonts[font].length > 0
    );
    
    if (!hasAllColors || !hasAllFonts) {
      throw new Error('Invalid styling response format');
    }
    
    return styling;
  } catch (error) {
    console.error('Error getting brand styling:', error);
    // Return default styling if brand detection fails
    return {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d', 
        accent: '#28a745',
        text: '#333333',
        background: '#ffffff'
      },
      fonts: {
        primary: 'Inter',
        secondary: 'Source Sans Pro',
        fallback: 'sans-serif'
      }
    };
  }
}

// Selection agent logic to find best campaign for user
async function selectBestCampaignForUser(campaigns, userProfile, context) {
  try {
    // If no user profile provided, cannot match
    if (!userProfile || Object.keys(userProfile).length === 0) {
      return null;
    }
    
    // Score each campaign based on user profile match
    const scoredCampaigns = campaigns.map(campaign => {
      let score = 0;
      let matchReasons = [];
      
      const targeting = campaign.targetingCriteria || {};
      
      // Check segment matches
      if (targeting.segments && userProfile.segments) {
        const matchingSegments = targeting.segments.filter(segment => 
          userProfile.segments.includes(segment)
        );
        score += matchingSegments.length * 10;
        if (matchingSegments.length > 0) {
          matchReasons.push(`Segments: ${matchingSegments.join(', ')}`);
        }
      }
      
      // Check interest matches
      if (targeting.interests && userProfile.interests) {
        const matchingInterests = targeting.interests.filter(interest => 
          userProfile.interests.includes(interest)
        );
        score += matchingInterests.length * 8;
        if (matchingInterests.length > 0) {
          matchReasons.push(`Interests: ${matchingInterests.join(', ')}`);
        }
      }
      
      // Check demographic matches
      if (targeting.demographics && userProfile.demographics) {
        const demos = targeting.demographics;
        const userDemos = userProfile.demographics;
        
        // Age range check
        if (demos.ageMin && demos.ageMax && userDemos.age) {
          if (userDemos.age >= demos.ageMin && userDemos.age <= demos.ageMax) {
            score += 5;
            matchReasons.push(`Age: ${userDemos.age}`);
          }
        }
        
        // Location check
        if (demos.location && userDemos.location) {
          if (demos.location === userDemos.location) {
            score += 5;
            matchReasons.push(`Location: ${userDemos.location}`);
          }
        }
      }
      
      // Check behavior matches
      if (targeting.behaviors && userProfile.behaviors) {
        const matchingBehaviors = targeting.behaviors.filter(behavior => 
          userProfile.behaviors.includes(behavior)
        );
        score += matchingBehaviors.length * 6;
        if (matchingBehaviors.length > 0) {
          matchReasons.push(`Behaviors: ${matchingBehaviors.join(', ')}`);
        }
      }
      
      // Category preference
      if (campaign.category && userProfile.preferences?.categories) {
        if (userProfile.preferences.categories.includes(campaign.category)) {
          score += 3;
          matchReasons.push(`Category: ${campaign.category}`);
        }
      }
      
      return {
        ...campaign,
        score: score,
        matchReason: matchReasons.join('; ')
      };
    });
    
    // Filter out campaigns with zero score (no match)
    const matchingCampaigns = scoredCampaigns.filter(c => c.score > 0);
    
    if (matchingCampaigns.length === 0) {
      return null; // No matching campaigns
    }
    
    // Sort by score and return best match
    matchingCampaigns.sort((a, b) => b.score - a.score);
    
    return matchingCampaigns[0];
    
  } catch (error) {
    console.error('Error in campaign selection:', error);
    return null;
  }
}

// Generate HTML/CSS variation with persuasion text
async function generateHtmlCssVariation(widgetType, campaignObjective, productList, additionalPrompt, brandStyling = null, variation = 1, style = 'standard') {
  try {
    // Add style-specific instructions to the prompt
    const stylePrompts = {
      minimal: 'Create a MINIMAL, clean design with lots of whitespace, subtle borders, and understated elegance. Use thin fonts, light colors, and simple layouts.',
      bold: 'Create a BOLD, high-impact design with strong contrasts, thick borders, large fonts, and eye-catching elements. Use dark backgrounds with bright accents.',
      premium: 'Create a PREMIUM, luxurious design with rich colors, elegant typography, subtle animations, and sophisticated layouts. Use gold accents and premium feel.'
    };
    
    const enhancedPrompt = `${additionalPrompt || ''} ${stylePrompts[style] || ''}`;
    
    // Generate persuasion text using LLM with brand styling
    const persuasionText = await generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, enhancedPrompt, brandStyling);

    // Generate HTML/CSS widget using the htmlCssAgent with brand styling and style variation
    const htmlCssResult = await multiAgentOrchestrator.specialists.htmlCss.generateRecommendationWidget(
      campaignObjective,
      productList,
      enhancedPrompt,
      widgetType,
      brandStyling,
      variation
    );

    // Extract HTML and CSS from the widget code
    const { html, css } = extractHtmlAndCss(htmlCssResult.widgetCode);

    return {
      widgetType: widgetType,
      html: html,
      css: css,
      text: persuasionText
    };

  } catch (error) {
    console.error(`Error generating ${widgetType} variation:`, error);
    
    // Fallback with LLM text
    const fallbackPersuasionText = await generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, additionalPrompt, brandStyling, true);
    
    return {
      widgetType: widgetType,
      html: generateFallbackHtml(widgetType, productList),
      css: generateFallbackCss(widgetType, brandStyling, style),
      text: fallbackPersuasionText
    };
  }
}

// Generate persuasion text using LLM
async function generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, additionalPrompt, brandStyling = null, isFallback = false) {
  try {
    // Extract pricing psychology data without product details
    const hasDiscounts = productList.some(p => p.discount && p.discount > 0);
    const maxDiscount = hasDiscounts ? Math.max(...productList.map(p => p.discount || 0)) : 0;
    const priceRange = productList.length > 0 ? {
      min: Math.min(...productList.map(p => parseFloat(p.price))),
      max: Math.max(...productList.map(p => parseFloat(p.price)))
    } : { min: 0, max: 0 };
    const category = productList.length > 0 ? productList[0].category : 'products';
    
    const persuasionContext = `
CAMPAIGN OBJECTIVE: ${campaignObjective}

PRICING CONTEXT:
- Product Category: ${category}
- Has Special Offers: ${hasDiscounts ? 'Yes' : 'No'}
- Maximum Discount Available: ${maxDiscount}%
- Price Range: $${priceRange.min} - $${priceRange.max}
- Number of Products: ${productList.length}

WIDGET TYPE: ${widgetType}

${brandStyling ? `BRAND STYLING CONTEXT:
- Primary Brand Color: ${brandStyling.colors.primary}
- Primary Font: ${brandStyling.fonts.primary}
- Brand Voice: Consider the brand's visual identity when crafting messaging tone` : ''}

ADDITIONAL REQUIREMENTS: ${additionalPrompt || 'None'}

Generate compelling, price-focused persuasion text that would accompany a ${widgetType} widget. 

The text should be:
- PRICE-FOCUSED and deal-oriented (don't mention specific product names/brands)
- SHORT and punchy (2-3 sentences max)
- Action-oriented with urgency
- Focused on savings, value, and limited-time offers
- General enough to work with any products in this category
- Include strong call-to-action language
${brandStyling ? `- Reflect the brand's personality based on the font choice (${brandStyling.fonts.primary}) and color scheme
- Use a tone that aligns with the brand's visual identity` : ''}

Examples of good price-focused persuasion:
"Limited time offer! Save up to 25% on premium gear. Don't miss these exclusive deals!"
"Unbeatable prices on quality products! Shop now and save big before it's too late!"
"Flash sale ends soon! Get the best deals of the season while supplies last!"

${brandStyling ? `BRAND GUIDANCE:
- Font choice "${brandStyling.fonts.primary}" suggests a certain brand personality - craft messaging that complements this
- Primary color ${brandStyling.colors.primary} should influence the energy and tone of the messaging` : ''}

Return only the persuasion text, no additional formatting or explanations.`;

    const persuasionResult = await multiAgentOrchestrator.specialists.persuasion.createPersuasiveContent(persuasionContext);
    
    return persuasionResult.content || persuasionResult.text || `Limited time offers on premium ${category}! Save up to ${maxDiscount}% - shop now!`;

  } catch (error) {
    console.error(`Error generating persuasion text:`, error);
    const category = productList.length > 0 ? productList[0].category : 'products';
    const hasDiscounts = productList.some(p => p.discount && p.discount > 0);
    const maxDiscount = hasDiscounts ? Math.max(...productList.map(p => p.discount || 0)) : 0;
    
    // Generate brand-aware fallback text
    if (brandStyling) {
      const isModernFont = ['Inter', 'Roboto', 'Montserrat', 'Poppins'].includes(brandStyling.fonts.primary);
      const isPlayfulFont = ['Comfortaa', 'Quicksand', 'Nunito'].includes(brandStyling.fonts.primary);
      
      if (isPlayfulFont) {
        return hasDiscounts 
          ? `🎉 Amazing ${category} deals! Save up to ${maxDiscount}% - grab yours now!`
          : `✨ Discover awesome ${category} at great prices! Shop the collection now!`;
      } else if (isModernFont) {
        return hasDiscounts 
          ? `Premium ${category} on sale. Save up to ${maxDiscount}% - limited time.`
          : `Curated ${category} collection. Exceptional quality, competitive prices.`;
      }
    }
    
    return hasDiscounts 
      ? `Exclusive deals on ${category}! Save up to ${maxDiscount}% - limited time only!`
      : `Discover premium ${category} at unbeatable prices. Shop now for the best selection!`;
  }
}

// Extract HTML and CSS from widget code
function extractHtmlAndCss(widgetCode) {
  try {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styleMatches = widgetCode.match(styleRegex);
    
    let css = '';
    if (styleMatches) {
      css = styleMatches.map(match => {
        return match.replace(/<\/?style[^>]*>/gi, '').trim();
      }).join('\n');
    }

    let html = widgetCode.replace(styleRegex, '').trim();
    
    if (!css && html) {
      return { html: html, css: '' };
    }

    return { html: html || widgetCode, css: css };

  } catch (error) {
    console.error('Error extracting HTML/CSS:', error);
    return { html: widgetCode, css: '' };
  }
}

function generateHtmlTemplate() {
  return `
<div class="product-card-container">
  <div class="product-card">
    <div class="product-image" style="background-image: url('{{productImage}}')"></div>
    <div class="product-content">
      <div class="product-info">
        <h2 class="product-name">{{productName}}</h2>
        <p class="product-brand">{{brand}}</p>
        <p class="product-description">{{description}}</p>
        <p class="product-price">{{price}} <span class="product-discount">{{discount}} OFF</span></p>
      </div>
      <div class="product-action">
        <button class="cta-button">{{buttonText}}</button>
      </div>
    </div>
  </div>
  <!-- Repeat similar blocks for each product -->
</div>`
}
// Fallback HTML generator
function generateFallbackHtml(widgetType, productList) {
  const products = productList.slice(0, 3);
  
  return `
<div class="product-card-container">
  ${products.map(product => `
  <div class="product-card">
    <div class="product-image" style="background-image: url('${product.image || 'https://via.placeholder.com/150'}')"></div>
    <div class="product-content">
      <div class="product-info">
        <h2 class="product-name">${product.name}</h2>
        <p class="product-brand">${product.brand}</p>
        <p class="product-description">${product.description || 'Premium quality product'}</p>
        <p class="product-price">$${product.price} ${product.discount ? `<span class="product-discount">${product.discount}% OFF</span>` : ''}</p>
      </div>
      <div class="product-action">
        <button class="cta-button">Add to Cart</button>
      </div>
    </div>
  </div>`).join('')}
</div>`;
}

// Fallback CSS generator  
function generateFallbackCss(widgetType, brandStyling = null, style = 'standard') {
  // Use brand styling if available, otherwise default styling
  const colors = brandStyling?.colors || {
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#28a745', 
    text: '#333333',
    background: '#ffffff'
  };
  
  const fonts = brandStyling?.fonts || {
    primary: 'Inter',
    secondary: 'Source Sans Pro',
    fallback: 'sans-serif'
  };

  // Style-specific customizations
  const styleConfigs = {
    minimal: {
      borderRadius: '2px',
      borderWidth: '1px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      hoverShadow: '0 2px 6px rgba(0,0,0,0.08)',
      gap: '2rem',
      padding: '2rem',
      titleSize: '1.1rem',
      fontWeight: '400',
      buttonPadding: '10px 20px',
      background: '#fafafa'
    },
    bold: {
      borderRadius: '0px',
      borderWidth: '3px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      hoverShadow: '0 8px 24px rgba(0,0,0,0.3)',
      gap: '1rem',
      padding: '1rem',
      titleSize: '1.5rem',
      fontWeight: '800',
      buttonPadding: '16px 32px',
      background: '#000000'
    },
    premium: {
      borderRadius: '16px',
      borderWidth: '1px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      hoverShadow: '0 12px 48px rgba(0,0,0,0.15)',
      gap: '1.5rem',
      padding: '1.5rem',
      titleSize: '1.3rem',
      fontWeight: '600',
      buttonPadding: '14px 28px',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'
    }
  };

  const config = styleConfigs[style] || styleConfigs.minimal;

  // Generate Google Fonts import URL
  const fontImports = `@import url('https://fonts.googleapis.com/css2?family=${fonts.primary.replace(' ', '+')}:wght@400;500;600;700;800&family=${fonts.secondary.replace(' ', '+')}:wght@300;400;500&display=swap');`;
  
  return `${fontImports}

.product-card-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${config.gap};
  padding: ${config.padding};
  background: ${style === 'bold' ? config.background : colors.background};
  align-items: stretch;
}
@media (max-width: 768px) {
  .product-card-container {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1024px) and (min-width: 769px) {
  .product-card-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
.product-card {
  border: ${config.borderWidth} solid ${style === 'bold' ? colors.primary : colors.secondary};
  border-radius: ${config.borderRadius};
  overflow: hidden;
  background: ${style === 'bold' ? '#111' : colors.background};
  box-shadow: ${config.boxShadow};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: ${config.hoverShadow};
  border-color: ${colors.primary};
}
.product-image {
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-bottom: 2px solid ${colors.primary};
}
.product-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.product-info {
  flex: 1;
  padding: 1.25rem 1.25rem 0.5rem 1.25rem;
}
.product-action {
  padding: 0 1.25rem 1.25rem 1.25rem;
}
.product-name {
  font-family: '${fonts.primary}', ${fonts.fallback};
  font-size: ${config.titleSize};
  font-weight: ${config.fontWeight};
  margin: 0 0 0.5rem 0;
  color: ${style === 'bold' ? colors.background : colors.text};
}
.product-brand {
  font-family: '${fonts.secondary}', ${fonts.fallback};
  font-size: ${style === 'bold' ? '1rem' : '0.9rem'};
  color: ${style === 'bold' ? colors.accent : colors.secondary};
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: ${style === 'premium' ? '1px' : '0.5px'};
}
.product-description {
  font-family: '${fonts.secondary}', ${fonts.fallback};
  font-size: ${style === 'minimal' ? '0.85rem' : '0.9rem'};
  color: ${style === 'bold' ? '#ccc' : colors.secondary};
  margin: 0 0 1rem 0;
  line-height: ${style === 'premium' ? '1.6' : '1.4'};
}
.product-price {
  font-family: '${fonts.primary}', ${fonts.fallback};
  font-size: ${style === 'bold' ? '1.3rem' : '1.1rem'};
  font-weight: ${style === 'minimal' ? '500' : '700'};
  color: ${style === 'bold' ? colors.primary : colors.text};
  margin: 0 0 0.5rem 0;
}
.product-discount {
  font-family: '${fonts.secondary}', ${fonts.fallback};
  background: ${colors.accent};
  color: ${colors.background};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}
.cta-button {
  font-family: '${fonts.primary}', ${fonts.fallback};
  background: ${style === 'minimal' ? 'transparent' : colors.primary};
  color: ${style === 'minimal' ? colors.primary : colors.background};
  border: ${style === 'minimal' ? `2px solid ${colors.primary}` : 'none'};
  padding: ${config.buttonPadding};
  border-radius: ${style === 'bold' ? '0' : style === 'premium' ? '50px' : '4px'};
  font-weight: ${style === 'bold' ? '800' : '600'};
  cursor: pointer;
  width: 100%;
  display: block;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
  text-transform: ${style === 'bold' ? 'uppercase' : 'none'};
  letter-spacing: ${style === 'bold' ? '1px' : '0'};
}
.cta-button:hover {
  background: ${style === 'minimal' ? colors.primary : colors.accent};
  color: ${style === 'minimal' ? colors.background : colors.background};
  transform: ${style === 'premium' ? 'scale(1.05)' : 'translateY(-1px)'};
  box-shadow: ${style === 'premium' ? '0 8px 24px rgba(0,0,0,0.2)' : 'none'};
}
${style === 'premium' ? `
.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, ${colors.accent} 0%, transparent 100%);
  opacity: 0.3;
}` : ''}`;
}

module.exports = router; 
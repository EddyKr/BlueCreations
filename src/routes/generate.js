const express = require('express');
const multiAgentOrchestrator = require('../services/multiAgentOrchestrator');

const router = express.Router();

// Storage for saved campaigns
const savedCampaigns = new Map(); // key: campaign name, value: campaign data

// ===== BACK OFFICE ENDPOINTS FOR MARKETERS =====

// Generate 3 recommendation variations for marketers
router.post('/backoffice/generate', async (req, res) => {
  try {
    const { campaignObjective, additionalPrompt, category } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign objective is required'
      });
    }

    console.log('Back office: Generating 3 variations for marketer...');

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

    // Generate 3 different variations
    const variations = await Promise.all([
      generateHtmlCssVariation('product_cards', campaignObjective, productList, additionalPrompt),
      generateHtmlCssVariation('product_cards', campaignObjective, productList, additionalPrompt),
      generateHtmlCssVariation('product_cards', campaignObjective, productList, additionalPrompt)
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
      generatedAt: new Date().toISOString()
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
      id: campaignName, // Use campaign name as ID
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
async function generateHtmlCssVariation(widgetType, campaignObjective, productList, additionalPrompt) {
  try {
    // Generate persuasion text using LLM
    const persuasionText = await generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, additionalPrompt);

    // Generate HTML/CSS widget using the htmlCssAgent
    const htmlCssResult = await multiAgentOrchestrator.specialists.htmlCss.generateRecommendationWidget(
      campaignObjective,
      productList,
      additionalPrompt || '',
      widgetType
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
    const fallbackPersuasionText = await generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, additionalPrompt, true);
    
    return {
      widgetType: widgetType,
      html: generateFallbackHtml(widgetType, productList),
      css: generateFallbackCss(widgetType),
      text: fallbackPersuasionText
    };
  }
}

// Generate persuasion text using LLM
async function generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, additionalPrompt, isFallback = false) {
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

ADDITIONAL REQUIREMENTS: ${additionalPrompt || 'None'}

Generate compelling, price-focused persuasion text that would accompany a ${widgetType} widget. 

The text should be:
- PRICE-FOCUSED and deal-oriented (don't mention specific product names/brands)
- SHORT and punchy (2-3 sentences max)
- Action-oriented with urgency
- Focused on savings, value, and limited-time offers
- General enough to work with any products in this category
- Include strong call-to-action language

Examples of good price-focused persuasion:
"Limited time offer! Save up to 25% on premium gear. Don't miss these exclusive deals!"
"Unbeatable prices on quality products! Shop now and save big before it's too late!"
"Flash sale ends soon! Get the best deals of the season while supplies last!"

Return only the persuasion text, no additional formatting or explanations.`;

    const persuasionResult = await multiAgentOrchestrator.specialists.persuasion.createPersuasiveContent(persuasionContext);
    
    return persuasionResult.content || persuasionResult.text || `Limited time offers on premium ${category}! Save up to ${maxDiscount}% - shop now!`;

  } catch (error) {
    console.error(`Error generating persuasion text:`, error);
    const category = productList.length > 0 ? productList[0].category : 'products';
    const hasDiscounts = productList.some(p => p.discount && p.discount > 0);
    const maxDiscount = hasDiscounts ? Math.max(...productList.map(p => p.discount || 0)) : 0;
    
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
    <div class="product-image" style="background-image: url('https://via.placeholder.com/150')"></div>
    <div class="product-info">
      <h2 class="product-name">{{productName}}</h2>
      <p class="product-brand">{{brand}}</p>
      <p class="product-description">{{description}}</p>
      <p class="product-price">{{price}} <span class="product-discount">{{discount}} OFF</span></p>
      <button class="cta-button">{{buttonText}}</button>
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
    <div class="product-image" style="background-image: url('https://via.placeholder.com/150')"></div>
    <div class="product-info">
      <h2 class="product-name">${product.name}</h2>
      <p class="product-brand">${product.brand}</p>
      <p class="product-description">${product.description || 'Premium quality product'}</p>
      <p class="product-price">$${product.price} ${product.discount ? `<span class="product-discount">${product.discount}% OFF</span>` : ''}</p>
      <button class="cta-button">Add to Cart</button>
    </div>
  </div>`).join('')}
</div>`;
}

// Fallback CSS generator  
function generateFallbackCss(widgetType) {
  return `
.product-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}
.product-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.product-image {
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.product-info {
  padding: 1.25rem;
}
.product-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}
.product-brand {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.product-description {
  font-size: 0.9rem;
  color: #777;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}
.product-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1.25rem 0;
}
.product-discount {
  background: #e74c3c;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}
.cta-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s ease;
}
.cta-button:hover {
  background: #0056b3;
}`;
}

module.exports = router; 
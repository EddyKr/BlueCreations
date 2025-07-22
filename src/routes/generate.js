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
      campaignObjective: campaignObjective,
      productCount: productList.length,
      category: category || 'all',
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
      notes 
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
    
    if (!variation || !variation.html || !variation.css || !variation.text) {
      return res.status(400).json({
        success: false,
        error: 'Complete variation (html, css, text) is required'
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
        widgetType: selectedCampaign.variation.widgetType
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
    const productSummary = productList.map(p => 
      `${p.name} by ${p.brand} - $${p.price}${p.discount ? ` (${p.discount}% off)` : ''}`
    ).join('\n');
    
    const persuasionContext = `
CAMPAIGN OBJECTIVE: ${campaignObjective}

PRODUCTS TO PROMOTE:
${productSummary}

WIDGET TYPE: ${widgetType}

ADDITIONAL REQUIREMENTS: ${additionalPrompt || 'None'}

Generate compelling persuasion text that would accompany a ${widgetType} widget for these products. Make it engaging and conversion-focused.

The text should be:
- Compelling and action-oriented
- Focused on the products and campaign objective
- Appropriate for the ${widgetType} widget format
- Ready to use as marketing copy

Return only the persuasion text, no additional formatting or explanations.`;

    const persuasionResult = await multiAgentOrchestrator.specialists.persuasion.createPersuasiveContent(persuasionContext);
    
    return persuasionResult.content || persuasionResult.text || 'Experience premium quality with our carefully selected products.';

  } catch (error) {
    console.error(`Error generating persuasion text:`, error);
    const category = productList.length > 0 ? productList[0].category : 'sports';
    return `Discover our premium ${category} collection. Quality and performance guaranteed.`;
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

// Fallback HTML generator
function generateFallbackHtml(widgetType, productList) {
  const products = productList.slice(0, 3);
  
  return `
<div class="product-cards-widget">
  <h2>Recommended Products</h2>
  <div class="products-grid">
    ${products.map(product => `
    <div class="product-card">
      <h3>${product.name}</h3>
      <p class="brand">${product.brand}</p>
      <p class="price">$${product.price}</p>
      ${product.discount ? `<span class="discount">${product.discount}% OFF</span>` : ''}
      <button class="add-to-cart">Add to Cart</button>
    </div>`).join('')}
  </div>
</div>`;
}

// Fallback CSS generator  
function generateFallbackCss(widgetType) {
  return `
.product-cards-widget {
  padding: 1.5rem;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}
.add-to-cart {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}`;
}

module.exports = router; 
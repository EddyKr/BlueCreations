const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multiAgentOrchestrator = require('../services/multiAgentOrchestrator');

const router = express.Router();

// Storage for saved campaigns with UUID
const savedCampaigns = new Map(); // key: uuid, value: campaign data

// Generate 3 recommendation variations - Returns HTML/CSS and persuasion text
router.post('/generate', async (req, res) => {
  try {
    const { campaignObjective, additionalPrompt, category } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign objective is required'
      });
    }

    console.log('Generating 3 HTML/CSS + persuasion variations...');

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

    console.log(`Using ${productList.length} products${category ? ` from category: ${category}` : ' from all categories'}`);

    // Generate 3 different HTML/CSS + persuasion variations
    const variations = await Promise.all([
      // Variation 1: Product Cards widget
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
      availableCategories: [...new Set(allProducts.map(p => p.category))],
      generatedAt: new Date().toISOString()
    };

    res.json(response);
    
  } catch (error) {
    console.error('Generate endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate HTML/CSS recommendations',
      details: error.message
    });
  }
});

// Save a generated variation to campaigns array with UUID
router.post('/save-campaign', async (req, res) => {
  try {
    const { 
      campaignName,
      campaignObjective, 
      variation, 
      category,
      additionalPrompt,
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
    
    // Generate UUID for the campaign
    const campaignId = uuidv4();
    
    // Create campaign object
    const campaign = {
      id: campaignId,
      name: campaignName,
      objective: campaignObjective,
      category: category || 'all',
      additionalPrompt: additionalPrompt || '',
      notes: notes || '',
      variation: {
        widgetType: variation.widgetType || 'product_cards',
        html: variation.html,
        css: variation.css,
        text: variation.text
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to storage
    savedCampaigns.set(campaignId, campaign);
    
    console.log(`Campaign saved with ID: ${campaignId}`);
    
    res.json({
      success: true,
      message: 'Campaign saved successfully',
      campaignId: campaignId,
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

// Get all saved campaigns
router.get('/campaigns', (req, res) => {
  try {
    const { limit = 20, offset = 0, category, search } = req.query;
    
    let campaigns = Array.from(savedCampaigns.values());
    
    // Filter by category if specified
    if (category && category !== 'all') {
      campaigns = campaigns.filter(c => 
        c.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Search in name, objective, or notes
    if (search) {
      const searchLower = search.toLowerCase();
      campaigns = campaigns.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.objective.toLowerCase().includes(searchLower) ||
        c.notes.toLowerCase().includes(searchLower)
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
        category: category || 'all',
        search: search || null
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

// Get specific campaign by UUID
router.get('/campaigns/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!savedCampaigns.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const campaign = savedCampaigns.get(id);
    
    res.json({
      success: true,
      campaign: campaign
    });
    
  } catch (error) {
    console.error('Get specific campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve campaign',
      details: error.message
    });
  }
});

// Update specific campaign by UUID
router.put('/campaigns/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!savedCampaigns.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const existingCampaign = savedCampaigns.get(id);
    
    // Update campaign with new data
    const updatedCampaign = {
      ...existingCampaign,
      ...updates,
      id: existingCampaign.id, // Preserve ID
      createdAt: existingCampaign.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    savedCampaigns.set(id, updatedCampaign);
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
    
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign',
      details: error.message
    });
  }
});

// Delete specific campaign by UUID
router.delete('/campaigns/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!savedCampaigns.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const deletedCampaign = savedCampaigns.get(id);
    savedCampaigns.delete(id);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully',
      deletedCampaign: {
        id: deletedCampaign.id,
        name: deletedCampaign.name
      }
    });
    
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign',
      details: error.message
    });
  }
});

// Get campaigns statistics
router.get('/campaigns-stats', (req, res) => {
  try {
    const campaigns = Array.from(savedCampaigns.values());
    
    const stats = {
      totalCampaigns: campaigns.length,
      byCategory: {},
      byWidgetType: {},
      recentActivity: campaigns
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          createdAt: c.createdAt
        }))
    };
    
    // Group by category
    campaigns.forEach(c => {
      stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
    });
    
    // Group by widget type
    campaigns.forEach(c => {
      const widgetType = c.variation.widgetType;
      stats.byWidgetType[widgetType] = (stats.byWidgetType[widgetType] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Get campaigns stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get campaign statistics',
      details: error.message
    });
  }
});

// Get available product categories
router.get('/categories', (req, res) => {
  try {
    const products = multiAgentOrchestrator.loadProducts();
    const categories = [...new Set(products.map(p => p.category))];
    
    res.json({
      success: true,
      categories: categories,
      totalProducts: products.length,
      productsByCategory: categories.reduce((acc, cat) => {
        acc[cat] = products.filter(p => p.category === cat).length;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load categories',
      details: error.message
    });
  }
});

// Get all available products
router.get('/products', (req, res) => {
  try {
    const { category } = req.query;
    let products = multiAgentOrchestrator.loadProducts();
    
    if (category) {
      products = products.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      products: products,
      totalCount: products.length,
      category: category || 'all'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load products',
      details: error.message
    });
  }
});

// Helper function to generate HTML/CSS variation with persuasion text
async function generateHtmlCssVariation(widgetType, campaignObjective, productList, additionalPrompt) {
  try {
    // Always generate persuasion text first using the LLM
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
      text: persuasionText // Always from LLM
    };

  } catch (error) {
    console.error(`Error generating ${widgetType} variation:`, error);
    
    // Even for fallback, generate persuasion text with LLM
    const fallbackPersuasionText = await generatePersuasionTextWithLLM(widgetType, campaignObjective, productList, additionalPrompt, true);
    
    return {
      widgetType: widgetType,
      html: generateFallbackHtml(widgetType, productList),
      css: generateFallbackCss(widgetType),
      text: fallbackPersuasionText // Still from LLM, even in fallback
    };
  }
}

// Helper function to generate persuasion text using LLM
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

${isFallback ? 
  'IMPORTANT: Generate fallback persuasion text that works even if technical issues occur. Focus on general product benefits and compelling call-to-action.' : 
  `Generate compelling persuasion text that would accompany a ${widgetType} widget for these products. Make it engaging and conversion-focused.`}

The text should be:
- Compelling and action-oriented
- Focused on the products and campaign objective
- Appropriate for the ${widgetType} widget format
- Ready to use as marketing copy

Return only the persuasion text, no additional formatting or explanations.`;

    const persuasionResult = await multiAgentOrchestrator.specialists.persuasion.createPersuasiveContent(persuasionContext);
    
    // Extract just the content from the result
    return persuasionResult.content || persuasionResult.text || 'Experience premium quality and unmatched performance with our carefully selected products.';

  } catch (error) {
    console.error(`Error generating persuasion text for ${widgetType}:`, error);
    
    // Last resort: use a very basic template but still try to make it contextual
    const category = productList.length > 0 ? productList[0].category : 'sports';
    const productCount = productList.length;
    
    if (productCount === 1) {
      return `Discover the ${productList[0].name} - engineered for excellence and built to elevate your ${category} performance. Experience the difference quality makes.`;
    } else {
      return `Explore our premium ${category} collection featuring ${productCount} expertly selected products. Each item is chosen for quality, performance, and value. Upgrade your game today.`;
    }
  }
}

// Helper function to extract HTML and CSS from widget code
function extractHtmlAndCss(widgetCode) {
  try {
    // Look for <style> tags and extract CSS
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styleMatches = widgetCode.match(styleRegex);
    
    let css = '';
    if (styleMatches) {
      css = styleMatches.map(match => {
        return match.replace(/<\/?style[^>]*>/gi, '').trim();
      }).join('\n');
    }

    // Remove style tags from HTML to get clean HTML
    let html = widgetCode.replace(styleRegex, '').trim();
    
    // If no separate CSS found, assume it's all HTML with inline styles
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
  const products = productList.slice(0, 3); // Take first 3 products
  
  if (widgetType === 'banner') {
    return `
<div class="banner-widget">
  <h2>Featured ${products[0]?.category || 'Sports'} Equipment</h2>
  <div class="product-highlight">
    <h3>${products[0]?.name || 'Premium Product'}</h3>
    <p class="price">$${products[0]?.price || '199.99'}</p>
    <button class="cta-button">Shop Now</button>
  </div>
</div>`;
  } else if (widgetType === 'compact') {
    return `
<div class="compact-widget">
  <h3>Top Pick: ${products[0]?.name || 'Premium Product'}</h3>
  <span class="price">$${products[0]?.price || '199.99'}</span>
  <button class="buy-btn">Buy</button>
</div>`;
  } else {
    // Default to product cards
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
}

// Fallback CSS generator  
function generateFallbackCss(widgetType) {
  if (widgetType === 'banner') {
    return `
.banner-widget {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
}
.cta-button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}`;
  } else if (widgetType === 'compact') {
    return `
.compact-widget {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e1e1e1;
  border-radius: 6px;
}
.buy-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}`;
  } else {
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
}

module.exports = router; 
const express = require('express');
const conversationalAgent = require('../services/conversationalAgent');
const multiAgentOrchestrator = require('../services/multiAgentOrchestrator');

const router = express.Router();

// ===== BACK OFFICE HTML/CSS WIDGET GENERATION ENDPOINTS =====

// Generate comprehensive multi-agent recommendation widget
router.post('/backoffice/widgets/comprehensive-generate', async (req, res) => {
  try {
    const { campaignObjective, productList, additionalPrompt, widgetType = 'product_cards' } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Campaign objective is required' }
      });
    }

    if (!productList || !Array.isArray(productList) || productList.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product list is required and must be a non-empty array' }
      });
    }

    // Generate widget using comprehensive multi-agent workflow
    const result = await multiAgentOrchestrator.generateComprehensiveWidget(
      campaignObjective,
      productList,
      additionalPrompt || '',
      widgetType
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { 
          message: result.error,
          details: result.ethicsReason,
          suggestions: result.suggestedImprovements
        }
      });
    }

    res.json({
      success: true,
      data: {
        widgetId: result.widgetId,
        finalWidgetCode: result.summary.finalWidgetCode,
        workflow: {
          textGenerated: result.summary.textGenerated,
          ethicsApproved: result.summary.ethicsApproved,
          htmlGenerated: result.summary.htmlGenerated,
          persuasionEnhanced: result.summary.persuasionEnhanced
        },
        campaignObjective: campaignObjective,
        widgetType: widgetType,
        productCount: productList.length,
        instructions: 'Widget generated through comprehensive multi-agent workflow. Copy finalWidgetCode to embed on your website.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate comprehensive widget', details: error.message }
    });
  }
});

// Generate embeddable recommendation widget (Simple - direct to HTML agent)
router.post('/backoffice/widgets/generate', async (req, res) => {
  try {
    const { campaignObjective, productList, additionalPrompt, widgetType = 'product_cards' } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Campaign objective is required' }
      });
    }

    if (!productList || !Array.isArray(productList) || productList.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product list is required and must be a non-empty array' }
      });
    }

    // Generate widget using HTML/CSS agent directly (legacy endpoint)
    const result = await multiAgentOrchestrator.specialists.htmlCss.generateRecommendationWidget(
      campaignObjective,
      productList,
      additionalPrompt || '',
      widgetType
    );

    res.json({
      success: true,
      data: {
        widgetCode: result.widgetCode,
        widgetType: result.widgetType,
        campaignObjective: result.campaignObjective,
        productCount: result.productCount,
        generatedBy: result.agent,
        instructions: 'Copy the widgetCode and paste it directly into any HTML div on your website',
        note: 'This is the simple generation endpoint. Use /comprehensive-generate for full multi-agent workflow.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate widget', details: error.message }
    });
  }
});

// ===== SAVED WIDGET RECOMMENDATIONS MANAGEMENT =====

// Get all saved widget recommendations
router.get('/backoffice/widgets/saved', async (req, res) => {
  try {
    const filters = {
      limit: req.query.limit ? Math.min(parseInt(req.query.limit), 50) : 10,
      widgetType: req.query.widgetType || null,
      approved: req.query.approved ? req.query.approved === 'true' : null,
      searchTerm: req.query.searchTerm || null
    };

    const result = multiAgentOrchestrator.getSavedWidgetRecommendations(filters);
    
    res.json({
      success: result.success,
      data: {
        widgets: result.widgets.map(widget => ({
          id: widget.id,
          campaignObjective: widget.campaignObjective,
          widgetType: widget.widgetType,
          productCount: widget.productCount,
          ethicsApproved: widget.ethicsReview.approved,
          generatedAt: widget.generatedAt,
          status: widget.status,
          // Include basic summary but not full specialist outputs
          textAgent: widget.textGeneration.agent,
          htmlAgent: widget.htmlGeneration.agent,
          persuasionTactics: widget.persuasionEnhancement.persuasionTactics
        })),
        total: result.total,
        filtered: result.filtered,
        hasMore: result.hasMore,
        filters: filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve saved widgets', details: error.message }
    });
  }
});

// Get specific saved widget by ID with full details
router.get('/backoffice/widgets/saved/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { includeFullDetails = 'false' } = req.query;
    
    const result = multiAgentOrchestrator.getWidgetRecommendationById(widgetId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.message }
      });
    }

    // Return summary or full details based on query parameter
    const responseData = includeFullDetails === 'true' ? 
      result.widget : // Full widget data with all specialist outputs
      {
        ...result.summary,
        finalWidgetCode: result.widget.htmlGeneration.widgetCode,
        instructions: 'Copy finalWidgetCode to embed this widget on your website'
      };

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve widget', details: error.message }
    });
  }
});

// Get widget code only (for embedding)
router.get('/backoffice/widgets/saved/:widgetId/code', async (req, res) => {
  try {
    const { widgetId } = req.params;
    
    const result = multiAgentOrchestrator.getWidgetRecommendationById(widgetId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.message }
      });
    }

    // Return just the HTML/CSS code for embedding
    res.json({
      success: true,
      data: {
        widgetId: widgetId,
        widgetCode: result.widget.htmlGeneration.widgetCode,
        widgetType: result.widget.widgetType,
        campaignObjective: result.widget.campaignObjective,
        ethicsApproved: result.widget.ethicsReview.approved,
        instructions: 'Copy this code and paste directly into any div on your website'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve widget code', details: error.message }
    });
  }
});

// Delete a saved widget recommendation
router.delete('/backoffice/widgets/saved/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    
    const result = multiAgentOrchestrator.deleteWidgetRecommendation(widgetId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.message }
      });
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete widget', details: error.message }
    });
  }
});

// Clear all saved widget recommendations
router.delete('/backoffice/widgets/saved', async (req, res) => {
  try {
    const result = multiAgentOrchestrator.clearWidgetRecommendations();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear widget recommendations', details: error.message }
    });
  }
});

// Get statistics about saved widget recommendations
router.get('/backoffice/widgets/stats', async (req, res) => {
  try {
    const result = multiAgentOrchestrator.getWidgetRecommendationsStats();
    
    res.json({
      success: result.success,
      data: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve widget statistics', details: error.message }
    });
  }
});

// Generate multiple widget variations for A/B testing
router.post('/backoffice/widgets/variations', async (req, res) => {
  try {
    const { campaignObjective, productList, additionalPrompt } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Campaign objective is required' }
      });
    }

    if (!productList || !Array.isArray(productList) || productList.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product list is required and must be a non-empty array' }
      });
    }

    // Generate multiple widget variations
    const result = await multiAgentOrchestrator.specialists.htmlCss.generateWidgetVariations(
      campaignObjective,
      productList,
      additionalPrompt || ''
    );

    res.json({
      success: true,
      data: {
        variations: result.variations.map(variation => ({
          widgetCode: variation.widgetCode,
          widgetType: variation.widgetType,
          instructions: `${variation.widgetType.toUpperCase()}: Copy this code and paste into any HTML div`
        })),
        campaignObjective: result.campaignObjective,
        totalVariations: result.totalVariations,
        generatedBy: result.agent,
        usage: 'Use different variations for A/B testing to optimize conversions'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate widget variations', details: error.message }
    });
  }
});

// Generate widget with AI-selected products from catalog
router.post('/backoffice/widgets/smart-generate', async (req, res) => {
  try {
    const { campaignObjective, productCriteria, additionalPrompt, widgetType = 'product_cards', maxProducts = 4, useComprehensive = false } = req.body;
    
    // Validate required fields
    if (!campaignObjective?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Campaign objective is required' }
      });
    }

    if (!productCriteria) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product criteria is required (e.g., category, price range, etc.)' }
      });
    }

    // Load products from catalog
    const allProducts = multiAgentOrchestrator.loadProducts();
    
    if (allProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No products available in catalog' }
      });
    }

    // Simple product filtering based on criteria
    let filteredProducts = allProducts;
    
    if (productCriteria.category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category && p.category.toLowerCase().includes(productCriteria.category.toLowerCase())
      );
    }
    
    if (productCriteria.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= productCriteria.maxPrice);
    }
    
    if (productCriteria.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= productCriteria.minPrice);
    }
    
    if (productCriteria.brand) {
      filteredProducts = filteredProducts.filter(p => 
        p.brand && p.brand.toLowerCase().includes(productCriteria.brand.toLowerCase())
      );
    }

    // Select top products (by stock and discount)
    const selectedProducts = filteredProducts
      .sort((a, b) => (b.stock + b.discount) - (a.stock + a.discount))
      .slice(0, maxProducts);

    if (selectedProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No products match the specified criteria' }
      });
    }

    // Choose generation method based on useComprehensive flag
    let result;
    if (useComprehensive) {
      result = await multiAgentOrchestrator.generateComprehensiveWidget(
        campaignObjective,
        selectedProducts,
        additionalPrompt || '',
        widgetType
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { 
            message: result.error,
            details: result.ethicsReason,
            suggestions: result.suggestedImprovements
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          widgetId: result.widgetId,
          widgetCode: result.summary.finalWidgetCode,
          widgetType: widgetType,
          campaignObjective: campaignObjective,
          productCount: selectedProducts.length,
          selectedProducts: selectedProducts.map(p => ({ id: p.id, name: p.name, price: p.price })),
          productCriteria: productCriteria,
          workflow: result.summary,
          generationMethod: 'comprehensive',
          instructions: 'Widget generated through comprehensive multi-agent workflow and saved to collection.'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      result = await multiAgentOrchestrator.specialists.htmlCss.generateRecommendationWidget(
        campaignObjective,
        selectedProducts,
        additionalPrompt || '',
        widgetType
      );

      res.json({
        success: true,
        data: {
          widgetCode: result.widgetCode,
          widgetType: result.widgetType,
          campaignObjective: campaignObjective,
          productCount: result.productCount,
          selectedProducts: selectedProducts.map(p => ({ id: p.id, name: p.name, price: p.price })),
          productCriteria: productCriteria,
          generatedBy: result.agent,
          generationMethod: 'simple',
          instructions: 'Copy the widgetCode and paste it directly into any HTML div on your website'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate smart widget', details: error.message }
    });
  }
});

// Get available widget types and their descriptions
router.get('/backoffice/widgets/types', async (req, res) => {
  try {
    const widgetTypes = [
      {
        type: 'product_cards',
        name: 'Product Cards',
        description: 'Individual product cards in a grid layout - best for showcasing 2-6 products',
        bestFor: 'Product showcases, featured items, category recommendations'
      },
      {
        type: 'banner',
        name: 'Horizontal Banner',
        description: 'Horizontal banner layout with products side by side',
        bestFor: 'Header/footer placements, promotional sections'
      },
      {
        type: 'carousel',
        name: 'Product Carousel',
        description: 'Scrollable product carousel with navigation arrows',
        bestFor: 'Displaying many products in limited space'
      },
      {
        type: 'list',
        name: 'Product List',
        description: 'Vertical list with detailed product information',
        bestFor: 'Sidebar recommendations, mobile-friendly displays'
      },
      {
        type: 'hero',
        name: 'Hero Section',
        description: 'Large featured recommendation section with prominent call-to-action',
        bestFor: 'Landing page headers, main promotional areas'
      },
      {
        type: 'compact',
        name: 'Compact Widget',
        description: 'Minimal space-efficient design for tight layouts',
        bestFor: 'Sidebar widgets, footer sections, mobile optimization'
      }
    ];

    res.json({
      success: true,
      data: {
        widgetTypes: widgetTypes,
        totalTypes: widgetTypes.length,
        usage: 'Choose the widget type that best fits your layout and campaign objective',
        note: 'Use /comprehensive-generate for full multi-agent workflow including text generation, ethics review, and persuasion enhancement'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve widget types', details: error.message }
    });
  }
});

module.exports = router;
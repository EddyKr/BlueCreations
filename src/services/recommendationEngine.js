const fs = require('fs');
const path = require('path');

class RecommendationEngine {
  constructor() {
    // In-memory storage for generated recommendations
    this.storedRecommendations = [];
    this.lastGeneratedAt = null;
    this.generationInProgress = false;
  }

  // Load personas data
  loadPersonas() {
    try {
      const personasPath = path.join(__dirname, '../data/personas.json');
      const personasData = fs.readFileSync(personasPath, 'utf8');
      const personas = JSON.parse(personasData);
      return personas.userProfiles || [];
    } catch (error) {
      console.error('Error loading personas:', error);
      return [];
    }
  }

  // Load products data
  loadProducts() {
    try {
      const productsPath = path.join(__dirname, '../data/products.json');
      const productsData = fs.readFileSync(productsPath, 'utf8');
      const products = JSON.parse(productsData);
      return products.products || [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  // Extract property values from persona
  getPropertyValues(persona, propertyId) {
    if (!persona.properties) return [];
    const property = persona.properties.find(prop => prop.id === propertyId);
    return property ? property.values : [];
  }

  // Calculate compatibility score between persona and product
  calculateCompatibilityScore(persona, product) {
    let score = 0;
    const maxScore = 100;

    // Sport interests matching (40 points max)
    const sportInterests = this.getPropertyValues(persona, 'sport_interests');
    if (sportInterests.includes(product.category)) {
      score += 40;
    }

    // Brand preference matching (25 points max)
    const preferredBrands = this.getPropertyValues(persona, 'preferred_brands');
    if (preferredBrands.includes(product.brand)) {
      score += 25;
    }

    // Budget alignment (20 points max)
    const budgetRange = this.getPropertyValues(persona, 'budget_range')[0] || 'moderate';
    const discountedPrice = product.price * (1 - product.discount / 100);
    
    if (budgetRange === 'budget' && discountedPrice <= 200) score += 20;
    else if (budgetRange === 'moderate' && discountedPrice >= 100 && discountedPrice <= 500) score += 20;
    else if (budgetRange === 'premium' && discountedPrice >= 200 && discountedPrice <= 800) score += 20;
    else if (budgetRange === 'luxury' && discountedPrice >= 400) score += 20;
    else if (discountedPrice <= 300) score += 10; // partial points for reasonable pricing

    // Skill level consideration (10 points max)
    const skillLevel = this.getPropertyValues(persona, 'skill_level')[0] || 'intermediate';
    if (skillLevel === 'professional' && discountedPrice >= 500) score += 10;
    else if (skillLevel === 'advanced' && discountedPrice >= 200) score += 8;
    else if (skillLevel === 'intermediate' && discountedPrice >= 100 && discountedPrice <= 600) score += 8;
    else if (skillLevel === 'recreational' && discountedPrice <= 400) score += 8;
    else score += 5; // partial points

    // Stock availability bonus (3 points max)
    if (product.stock > 10) score += 3;
    else if (product.stock > 0) score += 1;

    // Discount bonus (2 points max)
    if (product.discount > 15) score += 2;
    else if (product.discount > 0) score += 1;

    return Math.min(score, maxScore);
  }

  // Generate recommendations for all personas and products
  async generateAllRecommendations() {
    if (this.generationInProgress) {
      throw new Error('Recommendation generation already in progress');
    }

    try {
      this.generationInProgress = true;
      console.log('Starting recommendation generation...');

      const personas = this.loadPersonas();
      const products = this.loadProducts();
      const recommendations = [];

      // Generate recommendations for each persona
      for (const persona of personas) {
        const sportInterests = this.getPropertyValues(persona, 'sport_interests');
        const segments = persona.segments ? persona.segments.map(s => s.id) : [];
        const budgetRange = this.getPropertyValues(persona, 'budget_range')[0] || 'moderate';
        const skillLevel = this.getPropertyValues(persona, 'skill_level')[0] || 'intermediate';

        // Calculate scores for all products
        const productScores = products.map(product => ({
          ...product,
          compatibilityScore: this.calculateCompatibilityScore(persona, product),
          discountedPrice: product.price * (1 - product.discount / 100),
          savings: product.price - (product.price * (1 - product.discount / 100))
        }));

        // Sort by compatibility score and take top matches
        const topProducts = productScores
          .filter(product => product.compatibilityScore > 30) // Only recommend products with decent compatibility
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, 5); // Top 5 recommendations per persona

        // Create recommendation entry (excluding profile ID as requested)
        if (topProducts.length > 0) {
          recommendations.push({
            personaSegments: segments,
            sportInterests: sportInterests,
            budgetRange: budgetRange,
            skillLevel: skillLevel,
            recommendedProducts: topProducts.map(product => ({
              id: product.id,
              name: product.name,
              brand: product.brand,
              description: product.description,
              category: product.category,
              originalPrice: product.price,
              discountedPrice: product.discountedPrice,
              savings: product.savings,
              discount: product.discount,
              stock: product.stock,
              compatibilityScore: product.compatibilityScore,
              recommendationReason: this.generateRecommendationReason(persona, product)
            })),
            generatedAt: new Date().toISOString()
          });
        }
      }

      // Also generate category-based recommendations for easier retrieval
      const categoryRecommendations = this.generateCategoryBasedRecommendations(products);
      recommendations.push(...categoryRecommendations);

      this.storedRecommendations = recommendations;
      this.lastGeneratedAt = new Date().toISOString();
      
      console.log(`Generated ${recommendations.length} recommendation sets`);
      return {
        success: true,
        recommendationCount: recommendations.length,
        generatedAt: this.lastGeneratedAt
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    } finally {
      this.generationInProgress = false;
    }
  }

  // Generate category-based recommendations for users without specific personas
  generateCategoryBasedRecommendations(products) {
    const categories = [...new Set(products.map(p => p.category))];
    const categoryRecs = [];

    for (const category of categories) {
      const categoryProducts = products
        .filter(p => p.category === category)
        .map(product => ({
          ...product,
          discountedPrice: product.price * (1 - product.discount / 100),
          savings: product.price - (product.price * (1 - product.discount / 100))
        }))
        .sort((a, b) => {
          // Sort by: discount > stock > price
          if (b.discount !== a.discount) return b.discount - a.discount;
          if (b.stock !== a.stock) return b.stock - a.stock;
          return a.discountedPrice - b.discountedPrice;
        })
        .slice(0, 3); // Top 3 per category

      categoryRecs.push({
        category: category,
        type: 'category-based',
        recommendedProducts: categoryProducts.map(product => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          description: product.description,
          category: product.category,
          originalPrice: product.price,
          discountedPrice: product.discountedPrice,
          savings: product.savings,
          discount: product.discount,
          stock: product.stock,
          recommendationReason: `Popular ${category} item with great value`
        })),
        generatedAt: new Date().toISOString()
      });
    }

    return categoryRecs;
  }

  // Generate human-readable recommendation reason
  generateRecommendationReason(persona, product) {
    const reasons = [];
    const sportInterests = this.getPropertyValues(persona, 'sport_interests');
    const preferredBrands = this.getPropertyValues(persona, 'preferred_brands');
    const budgetRange = this.getPropertyValues(persona, 'budget_range')[0];

    if (sportInterests.includes(product.category)) {
      reasons.push(`matches your ${product.category} interest`);
    }

    if (preferredBrands.includes(product.brand)) {
      reasons.push(`from your preferred brand ${product.brand}`);
    }

    if (product.discount > 15) {
      reasons.push(`excellent ${product.discount}% discount`);
    }

    if (budgetRange && budgetRange !== 'luxury' && product.price * (1 - product.discount / 100) <= 300) {
      reasons.push('great value for money');
    }

    if (product.stock > 10) {
      reasons.push('good availability');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'recommended based on your profile';
  }

  // Retrieve recommendations with minimal information
  getRecommendations(filters = {}) {
    if (this.storedRecommendations.length === 0) {
      return {
        success: false,
        message: 'No recommendations available. Generate recommendations first.',
        recommendations: []
      };
    }

    let filteredRecommendations = [...this.storedRecommendations];

    // Filter by sport interest
    if (filters.sportInterest) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.sportInterests?.includes(filters.sportInterest) || 
        rec.category === filters.sportInterest
      );
    }

    // Filter by budget range
    if (filters.budgetRange) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.budgetRange === filters.budgetRange ||
        rec.type === 'category-based' // Include category-based for broader access
      );
    }

    // Filter by skill level
    if (filters.skillLevel) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.skillLevel === filters.skillLevel ||
        rec.type === 'category-based' // Include category-based for broader access
      );
    }

    // Filter by segment
    if (filters.segment) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.personaSegments?.includes(filters.segment) ||
        rec.type === 'category-based'
      );
    }

    // Limit results
    const limit = filters.limit || 10;
    const limitedRecommendations = filteredRecommendations.slice(0, limit);

    return {
      success: true,
      recommendations: limitedRecommendations,
      total: limitedRecommendations.length,
      filtered: filteredRecommendations.length,
      lastGeneratedAt: this.lastGeneratedAt
    };
  }

  // Get recommendation statistics
  getStatistics() {
    const totalRecs = this.storedRecommendations.length;
    const personaBasedRecs = this.storedRecommendations.filter(r => !r.type).length;
    const categoryBasedRecs = this.storedRecommendations.filter(r => r.type === 'category-based').length;
    
    return {
      totalRecommendations: totalRecs,
      personaBasedRecommendations: personaBasedRecs,
      categoryBasedRecommendations: categoryBasedRecs,
      lastGeneratedAt: this.lastGeneratedAt,
      generationInProgress: this.generationInProgress
    };
  }

  // Clear stored recommendations
  clearRecommendations() {
    this.storedRecommendations = [];
    this.lastGeneratedAt = null;
    return {
      success: true,
      message: 'All recommendations cleared'
    };
  }
}

module.exports = new RecommendationEngine(); 
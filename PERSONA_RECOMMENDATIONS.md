# Persona-Based Recommendation System

This system generates product recommendations based on existing personas and products, storing them in an easily accessible array format for quick retrieval by website visitors.

## Overview

The recommendation engine analyzes all personas from `personas.json` and matches them with products from `products.json` using compatibility scoring. Profile IDs are ignored as requested, and recommendations are stored in memory for fast access with minimal information requirements.

## Key Features

- **Profile ID Agnostic**: Recommendations are generated based on persona characteristics, not specific user IDs
- **Compatibility Scoring**: Uses a weighted algorithm considering sport interests, brand preferences, budget, and skill level
- **Minimal Data Retrieval**: Website visitors can get recommendations with just basic filters
- **Category-Based Fallbacks**: Includes general recommendations for users without specific personas
- **In-Memory Storage**: Fast access to pre-generated recommendations

## API Endpoints

### 1. Generate Recommendations
```http
POST /api/conversation/recommendations/generate
```
Analyzes all personas and products to generate the recommendation array.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "recommendationCount": 8,
    "generatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 2. List Recommendations with Filtering
```http
GET /api/conversation/recommendations/list?sport=golf&budget=premium&limit=5
```

**Query Parameters:**
- `sport`: Filter by sport interest (golf, hockey, soccer, tennis)
- `budget`: Filter by budget range (budget, moderate, premium, luxury)
- `skill`: Filter by skill level (recreational, intermediate, advanced, professional)
- `segment`: Filter by persona segment (e.g., "tech-savvy-professional")
- `limit`: Maximum number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "recommendations": [
      {
        "personaSegments": ["tech-savvy-professional", "golf-enthusiast"],
        "sportInterests": ["golf", "tennis"],
        "budgetRange": "premium",
        "skillLevel": "intermediate",
        "recommendedProducts": [
          {
            "id": "golf-001",
            "name": "Pro Driver X1",
            "brand": "TaylorMade",
            "originalPrice": 449.99,
            "discountedPrice": 404.99,
            "discount": 10,
            "compatibilityScore": 88,
            "recommendationReason": "matches your golf interest, from your preferred brand TaylorMade, good availability"
          }
        ]
      }
    ],
    "total": 1,
    "lastGeneratedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 3. Quick Recommendations for Websites
```http
GET /api/conversation/recommendations/quick?sport=hockey&limit=3
```

Simplified endpoint for website integration with minimal data requirements.

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "persona-based",
      "category": "hockey",
      "products": [
        {
          "id": "hockey-001",
          "name": "Elite Carbon Stick",
          "brand": "Bauer",
          "discountedPrice": 239.99,
          "originalPrice": 299.99,
          "discount": 20,
          "reason": "matches your hockey interest, from your preferred brand Bauer, excellent 20% discount"
        }
      ]
    }
  ],
  "total": 1
}
```

### 4. Statistics
```http
GET /api/conversation/recommendations/stats
```

Returns statistics about stored recommendations.

### 5. Clear Recommendations
```http
DELETE /api/conversation/recommendations
```

Clears all stored recommendations (useful for regeneration or cleanup).

## Compatibility Scoring Algorithm

The system uses a weighted scoring system (0-100 points):

- **Sport Interest Match** (40 points): Product category matches persona's sport interests
- **Brand Preference** (25 points): Product brand is in persona's preferred brands
- **Budget Alignment** (20 points): Product price fits persona's budget range
- **Skill Level Consideration** (10 points): Product complexity matches skill level
- **Stock Availability** (3 points): Product has good availability
- **Discount Bonus** (2 points): Product has attractive discount

Only products scoring above 30 points are included in recommendations.

## Persona Categories Analyzed

The system analyzes personas by:
- **Sport Interests**: golf, hockey, soccer, tennis
- **Budget Ranges**: budget (<$200), moderate ($100-500), premium ($200-800), luxury ($400+)
- **Skill Levels**: recreational, intermediate, advanced, professional
- **Segments**: tech-savvy-professional, business-owner, student-budget, etc.

## Website Integration Example

For a simple website recommendation widget:

```javascript
// Get quick hockey recommendations for budget-conscious users
fetch('/api/conversation/recommendations/quick?sport=hockey&budget=budget&limit=3')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Display recommendations to user
      data.recommendations.forEach(rec => {
        rec.products.forEach(product => {
          console.log(`${product.name} - $${product.discountedPrice} - ${product.reason}`);
        });
      });
    }
  });
```

## Usage Workflow

1. **Generate**: Call `/recommendations/generate` to create the recommendation array
2. **Query**: Use `/recommendations/list` or `/recommendations/quick` with filters to get relevant recommendations
3. **Display**: Show recommendations to website visitors with minimal data requirements
4. **Refresh**: Periodically regenerate recommendations as personas or products change

## Intelligent Conversational Agent Integration

The conversational agent (`src/services/conversationalAgent.js`) now intelligently routes requests:

### 🚀 **Fast Product Recommendations**
When users ask for product recommendations, the agent:
- **Detects product keywords**: recommend, suggest, product, buy, equipment, gear, golf, hockey, etc.
- **Uses recommendation engine directly**: Bypasses complex multi-agent orchestrator
- **Provides instant responses**: Pre-generated recommendations with natural formatting

**Example Request:**
```http
POST /api/conversation/message
{
  "message": "I need golf equipment recommendations",
  "profileId": "8a1b2c3d-4e5f-6789-abcd-ef1234567890"
}
```

**Fast Response:**
```
Hi Sarah! Here are my top product recommendations for you:

1. **Pro Driver X1** by TaylorMade
   💰 $404.99 (save $45.00)
   📦 15 in stock
   ⭐ matches your golf interest, from your preferred brand TaylorMade, good availability

2. **Precision Iron Set** by Callaway
   💰 $764.99 (save $135.00)
   📦 8 in stock
   ⭐ matches your golf interest, excellent 15% discount

These recommendations are tailored for golf enthusiasts with a premium budget range.
```

### 🧠 **Multi-Agent for Complex Queries**
For non-product questions, the agent uses the full multi-agent orchestrator:
- Analytics optimization
- Marketing strategy
- Content generation
- Ethics reviews

**Example Request:**
```http
POST /api/conversation/message
{
  "message": "How can I optimize my website's conversion rate?"
}
```

Uses full specialist team for comprehensive analysis.

## Benefits

- **Fast Response**: Pre-generated recommendations avoid real-time computation for product queries
- **Intelligent Routing**: Automatically chooses fast engine vs. full orchestrator based on request type
- **Privacy-Friendly**: No profile IDs required for basic recommendations
- **Flexible Filtering**: Support various filter combinations for different use cases
- **Scalable**: In-memory storage provides fast access for high-traffic websites
- **Fallback Support**: Category-based recommendations when persona matching isn't available
- **Natural Language**: Conversational responses with emojis and personalized greetings 
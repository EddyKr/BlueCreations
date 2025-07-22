# Blue Creations - Multi-Agent Recommendation System

A sophisticated recommendation system that combines AI-powered agents with back office campaign management and **comprehensive multi-agent widget generation** for personalized user experiences.

## 🎯 System Overview

This system provides **multiple workflows**:

1. **Back Office Campaign Management**: Marketers create targeted recommendation campaigns
2. **Front-End Selection**: Intelligent agent selects best recommendations for users based on their profile
3. **🆕 Multi-Agent Widget Generation**: Comprehensive workflow through Text → Ethics → Persuasion → HTML/CSS → Storage

## 🤖 Multi-Agent Widget Generation Workflow

### The Complete Process

When marketers generate recommendation widgets, the system runs through **all specialist agents** to ensure high-quality, ethical, and effective content:

```
Campaign Objective + Product List
           ↓
    📝 Text Generation Agent (Sam)
    Creates compelling marketing copy
           ↓
    ⚖️ Ethics Agent (Dr. Riley)  
    Reviews content for appropriateness
           ↓
    🎯 Persuasion Agent (Maya)
    Adds compelling psychological elements
           ↓
    🎨 HTML/CSS Agent (Jordan)
    Generates embeddable widget code
           ↓
    💾 Storage & Retrieval System
    Saves complete workflow for later use
```

### Specialist Roles

- **📝 Sam (Text Generation)**: Creates compelling product descriptions and marketing copy based on campaign objectives
- **⚖️ Dr. Riley (Ethics)**: Reviews generated content to ensure ethical marketing practices and customer protection
- **🎯 Maya (Persuasion)**: Enhances content with psychological triggers while maintaining ethical boundaries  
- **🎨 Jordan (HTML/CSS)**: Generates beautiful, responsive HTML/CSS widgets ready for embedding
- **🧠 Alex (Analytics)**: *Not used in widget generation* - Reserved for performance analysis

### Ethics Gate System

The **Ethics Agent acts as a quality gate** - if content is deemed inappropriate:
- ❌ Widget generation stops
- 📋 Detailed feedback provided
- 💡 Suggestions for improvement offered
- 🔄 Marketer can revise and retry

## 🎯 Quick Start - Generate 3 HTML/CSS Variations

Generate 3 ready-to-use HTML/CSS widget variations with persuasion text:

```bash
# Start the server
npm start

# Generate HTML/CSS widgets (all products)
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "campaignObjective": "Showcase premium sports equipment for serious athletes"
  }'

# Generate HTML/CSS widgets (specific category)
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "campaignObjective": "Promote tennis equipment for tournament players",
    "category": "tennis",
    "additionalPrompt": "Focus on performance and competitive advantage"
  }'
```

### Response Format
```json
{
  "success": true,
  "variations": [
    {
      "id": "variation_1",
      "widgetType": "product_cards",
      "html": "<div class=\"product-cards-widget\">...</div>",
      "css": ".product-cards-widget { padding: 1.5rem; }...",
      "text": "Compelling persuasion text for this widget..."
    },
    {
      "id": "variation_2", 
      "widgetType": "banner",
      "html": "<div class=\"banner-widget\">...</div>",
      "css": ".banner-widget { background: linear-gradient...",
      "text": "Persuasive banner messaging..."
    },
    {
      "id": "variation_3",
      "widgetType": "compact", 
      "html": "<div class=\"compact-widget\">...</div>",
      "css": ".compact-widget { display: flex...",
      "text": "Concise persuasion for compact display..."
    }
  ],
  "campaignObjective": "Your objective",
  "productCount": 10,
  "category": "all"
}
```

### Widget Types Generated
- **🏷️ Product Cards** - Grid layout showcasing multiple products
- **📢 Banner** - Hero-style promotional banner with featured product  
- **📱 Compact** - Minimal single-product display

### Available Product Categories
- **tennis** - Wilson Carbon Pro Racket
- **golf** - TaylorMade Pro Driver, Callaway Iron Set, Titleist Golf Balls  
- **hockey** - Bauer Elite Stick, CCM Goalie Mask, Bauer Speed Skates
- **soccer** - Nike Championship Ball, Adidas Professional Cleats, Reusch Goalkeeper Gloves

### Get Categories and Products
```bash
# Get all available categories
curl http://localhost:3000/categories

# Get all products  
curl http://localhost:3000/products

# Get products by category
curl http://localhost:3000/products?category=tennis
```

## 📚 API Endpoints

### 🔥 Multi-Agent Widget Generation

- `POST /api/conversation/backoffice/widgets/comprehensive-generate` - **Full multi-agent workflow**
- `GET /api/conversation/backoffice/widgets/saved` - List all saved widgets
- `GET /api/conversation/backoffice/widgets/saved/:id` - Get specific widget details
- `GET /api/conversation/backoffice/widgets/saved/:id/code` - Get embeddable HTML/CSS code
- `DELETE /api/conversation/backoffice/widgets/saved/:id` - Delete saved widget
- `GET /api/conversation/backoffice/widgets/stats` - Widget generation statistics

### Legacy Widget Generation (Simple)

- `POST /api/conversation/backoffice/widgets/generate` - Direct HTML generation (bypasses other agents)
- `POST /api/conversation/backoffice/widgets/variations` - Generate A/B test variations
- `POST /api/conversation/backoffice/widgets/smart-generate` - Auto-select products from catalog

### Back Office Campaign Management

- `POST /api/conversation/backoffice/campaigns` - Create campaign
- `GET /api/conversation/backoffice/campaigns` - List campaigns
- `PUT /api/conversation/backoffice/campaigns/:id` - Update campaign
- `DELETE /api/conversation/backoffice/campaigns/:id` - Delete campaign

### Front-End Recommendation Selection

- `GET /api/conversation/frontend/recommendation/:profileId` - Get recommendation for known user
- `POST /api/conversation/frontend/recommendation` - Get recommendation for anonymous user

## 🎮 Widget Types Available

| Type | Description | Best For |
|------|-------------|----------|
| `product_cards` | Grid layout with individual product cards | Product showcases, featured items |
| `banner` | Horizontal banner with products side by side | Header/footer placements |
| `carousel` | Scrollable product carousel | Many products in limited space |
| `list` | Vertical list with detailed information | Sidebar recommendations |
| `hero` | Large featured section with prominent CTA | Landing page headers |
| `compact` | Minimal space-efficient design | Tight layouts, mobile optimization |

## 🧪 Demo Scenarios

Import `Comprehensive_Widget_Generator.postman_collection.json` to test:

### 1. **Premium Tennis Equipment**
- Full multi-agent workflow
- Professional targeting
- Ethics approval process

### 2. **Budget Golf Accessories** 
- Value-focused messaging
- Beginner-friendly content
- Savings emphasis

### 3. **Ethics Challenge Test**
- Demonstrates ethics rejection
- Shows improvement suggestions
- Tests content filtering

### 4. **Smart Product Selection**
- Auto-selects products from catalog
- Comprehensive workflow option
- Criteria-based filtering

## 💡 Key Features

### ✨ Multi-Agent Collaboration
- **Text Generation**: AI-powered compelling copy creation
- **Ethics Review**: Automated content appropriateness checking  
- **Persuasion Enhancement**: Psychological optimization within ethical bounds
- **Professional Design**: Responsive, conversion-focused HTML/CSS

### 🔒 Ethics-First Approach
- **Content Filtering**: Prevents manipulative or inappropriate messaging
- **Transparency Focus**: Encourages honest, customer-centric marketing
- **Trust Building**: Prioritizes long-term customer relationships

### 📊 Complete Traceability
- **Full Workflow History**: Every specialist's contribution saved
- **Performance Tracking**: Monitor which approaches work best
- **A/B Testing Support**: Generate variations for optimization

### 🎯 Smart Targeting
- **Profile-Based Campaigns**: Target by segments, interests, budget
- **Real-time Selection**: Dynamic recommendation serving
- **Performance Analytics**: Track campaign success metrics

## 🔧 Advanced Usage

### Multi-Agent vs Simple Generation

**Use Multi-Agent Workflow When:**
- Creating customer-facing marketing content
- Need ethics compliance assurance
- Want professionally optimized copy
- Require complete audit trail

**Use Simple Generation When:**
- Quick prototyping
- Internal testing
- Basic layout needs
- Speed over quality

### Ethics Review Process

The Ethics Agent evaluates content for:
- ✅ **Truthfulness**: Accurate product claims
- ✅ **Transparency**: Clear pricing and terms
- ✅ **Respect**: Non-manipulative language
- ✅ **Accessibility**: Inclusive design principles
- ❌ **Red Flags**: Pressure tactics, false scarcity, misleading claims

### Saved Widget Management

```bash
# Search widgets by keyword
GET /widgets/saved?searchTerm=tennis&limit=10

# Filter by ethics approval
GET /widgets/saved?approved=true

# Filter by widget type
GET /widgets/saved?widgetType=product_cards

# Get comprehensive details
GET /widgets/saved/widget_1?includeFullDetails=true
```

## 🎨 Example Generated Widget

The system generates **complete, embeddable HTML/CSS** like this:

```html
<style>
.recommendation-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 100%;
  margin: 0 auto;
}
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
</style>

<div class="recommendation-widget">
  <h2>Premium Tennis Equipment</h2>
  <div class="product-card">
    <h3>Wilson Pro Staff RF97 Autograph</h3>
    <p>Roger Federer's racket of choice - perfect for advanced players</p>
    <div class="price">$212.49 <span class="original">$249.99</span></div>
    <button class="cta-button">Shop Now</button>
  </div>
</div>
```

**Ready to copy & paste into any website!**

## 🧪 Testing with Postman

1. **Import Collection**: `Comprehensive_Widget_Generator.postman_collection.json`
2. **Set Base URL**: `http://localhost:3000`
3. **Run Demo Scenarios**: Test the complete multi-agent workflow
4. **View Generated Code**: See the final embeddable widgets

The comprehensive multi-agent system ensures every generated widget is **compelling, ethical, and professionally designed** - ready for immediate deployment on any website. 
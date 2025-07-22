# 🎯 AI-Powered Recommendation System

A multi-agent recommendation system where marketers create targeted campaigns in a back office, and intelligent selection provides recommendations to frontend users via multiple endpoints.

## 🏗️ System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Back Office   │      │     Backend     │      │    Frontend     │
│   (Marketer)    │─────▶│   AI Agents     │◀─────│     (User)      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
       │                         │                         │
       │ Generate & Save         │ Profile Agent          │ GET /client/
       │ Campaigns              │ Selection Agent        │ POST /frontend/
       ▼                         ▼                         ▼
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

## 🔗 **Available Endpoints**

### **Back Office (Marketers)**
- `POST /backoffice/generate` - Generate 3 HTML/CSS variations
- `POST /backoffice/save-campaign` - Save campaigns with targeting
- `GET /backoffice/campaigns` - View saved campaigns

### **Frontend (Users)**  
- `POST /frontend/get-recommendation` - Profile-based selection agent
- `GET /client/recommendation` - Query-based recommendation retrieval

## 📋 Application Flow

### 1️⃣ **Back Office - Marketers Create Campaigns**
Marketers generate, save, and view targeted recommendation campaigns:

```bash
# Generate 3 variations
POST /backoffice/generate
{
  "campaignObjective": "Promote premium tennis equipment",
  "category": "tennis",
  "additionalPrompt": "Focus on tournament players"
}

# Save campaign with targeting criteria
POST /backoffice/save-campaign
{
  "campaignName": "Tennis Tournament Prep",
  "campaignObjective": "Drive sales for competitive players",
  "targetingCriteria": {
    "segments": ["sports_enthusiast"],
    "interests": ["tennis", "fitness"],
    "demographics": { "ageMin": 18, "ageMax": 45 }
  },
  "variation": {
    "html": "<div>...</div>",
    "css": ".styles {...}",
    "text": "Compelling copy..."
  }
}

# View saved campaigns
GET /backoffice/campaigns
GET /backoffice/campaigns?status=active&category=tennis&limit=10

# Response:
{
  "success": true,
  "campaigns": [
    {
      "id": "uuid",
      "name": "Campaign Name",
      "objective": "Campaign objective",
      "status": "active",
      "targetingCriteria": {...},
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### 2️⃣ **Frontend - Users Get Personalized Recommendations**
Frontend sends user profile, agent selects best matching campaign:

```bash
POST /frontend/get-recommendation
{
  "userProfile": {
    "segments": ["sports_enthusiast"],
    "interests": ["tennis"],
    "demographics": { "age": 28 }
  }
}

# Response when match found:
{
  "success": true,
  "recommendation": {
    "campaignId": "uuid",
    "html": "<div>...</div>",
    "css": ".styles {...}",
    "text": "Personalized copy..."
  }
}

# Response when no match:
{
  "success": true,
  "recommendation": null,
  "message": "No matching recommendations"
}
```

### 3️⃣ **Client-Side - Query-Based Recommendation Retrieval**
Client-side endpoint that matches saved recommendations using query string parameters:

```bash
# Get by specific campaign name (used as ID)
GET /client/recommendation?campaignId=Premium-Tennis-Tournament-Prep

# Get by category
GET /client/recommendation?category=tennis

# Get by multiple criteria
GET /client/recommendation?category=tennis&segment=sports_enthusiast&location=USA

# Get by campaign name search
GET /client/recommendation?campaignName=tennis

# Available query parameters:
# - campaignId: Exact campaign name (campaigns are now identified by name)
# - category: Product category (tennis, golf, hockey, soccer)
# - campaignName: Search in campaign names (partial match)
# - segment: Target segment (sports_enthusiast, high_value_customer, etc.)
# - interest: Target interest (tennis, fitness, competitive_sports, etc.)
# - location: Target location (USA, Canada, etc.)
# - status: Campaign status (default: active)

# Response format:
{
  "success": true,
  "recommendation": {
    "campaignId": "Premium-Tennis-Tournament-Prep",
    "campaignName": "Premium Tennis Tournament Prep",
    "category": "tennis",
    "html": "<div>...</div>",
    "css": ".styles {...}",
    "text": "Marketing copy...",
    "widgetType": "product_cards"
  },
  "matchCriteria": {
    "category": "tennis",
    "segment": "sports_enthusiast"
  },
  "totalMatches": 3
}
```

## 🤖 AI Agents

- **🎨 HTML/CSS Agent**: Generates responsive, embeddable widgets
- **🎯 Persuasion Agent**: Creates compelling marketing copy
- **📝 Text Generation Agent**: Produces engaging content
- **🔍 Selection Agent**: Matches user profiles to campaigns

## 🎯 Targeting Criteria

Campaigns can target users based on:

- **Segments**: `sports_enthusiast`, `high_value_customer`, etc.
- **Interests**: `tennis`, `fitness`, `competitive_sports`
- **Demographics**: Age range, location
- **Behaviors**: `frequent_buyer`, `tournament_participant`
- **Preferences**: Category preferences

## 📊 Selection Logic

The selection agent scores campaigns based on:
1. **Segment matches** (10 points each)
2. **Interest matches** (8 points each)
3. **Demographic alignment** (5 points)
4. **Behavior matches** (6 points each)
5. **Category preferences** (3 points)

Returns the highest-scoring campaign or `null` if no match.

## 🧪 Test with Postman

Import `Generate_Endpoint_Test.postman_collection.json` to test:
- ✅ Back office campaign generation
- ✅ Campaign saving with targeting
- ✅ Frontend recommendation selection
- ✅ No-match scenarios

## 📦 Product Categories

The system uses products from `src/data/products.json`:
- **tennis** - Premium rackets and gear
- **golf** - Drivers, irons, and balls
- **hockey** - Sticks, skates, and protection
- **soccer** - Balls, cleats, and gloves

## 🔧 Key Features

- **🎯 Smart Targeting**: AI agent matches users to campaigns
- **📝 LLM-Generated Content**: All text created by AI
- **🎨 Ready-to-Embed Widgets**: Complete HTML/CSS code
- **🚫 Graceful Fallback**: Returns null when no match
- **💾 UUID-Based Storage**: Unique IDs for all campaigns

Clean, focused system with intelligent recommendation selection! 🎉 
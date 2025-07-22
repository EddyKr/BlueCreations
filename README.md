# Multi-Agent LLM Backend

A sophisticated backend system featuring an OpenAI LLM-powered main agent that intelligently delegates tasks to specialized sub-agents and synthesizes their responses. Users interact with a single, cohesive assistant while leveraging multiple domain experts behind the scenes.

## Architecture

```
User Input → Main Orchestrator Agent → Decision Engine
                                     ↓
            ┌─────────────────────────────────────────┐
            ├→ Requirements Analyst Agent             │
            ├→ Domain Expert Agent A                  │
            ├→ Domain Expert Agent B                  │
            └→ Technical Implementation Agent         │
                                     ↓
                    Synthesis & Final Response
```

## Features

- **Intelligent Delegation**: Main agent decides which specialists to consult based on user requirements
- **Context Preservation**: All agents maintain conversation history and build upon previous context
- **Seamless UX**: Users see a single coherent response, not multiple agent interactions
- **Configurable Specialists**: Easy to add, remove, or modify specialist agents
- **Fallback Mechanisms**: Graceful degradation if specialists are unavailable
- **RESTful API**: Complete REST API for conversation management

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd multiagent-llm-backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## API Endpoints

### Start New Conversation
```bash
POST /api/conversation/start
Content-Type: application/json

{
  "message": "I need help with my project"
}
```

### Continue Conversation
```bash
POST /api/conversation/{sessionId}/continue
Content-Type: application/json

{
  "message": "Here are more details about what I need"
}
```

### Get Conversation History
```bash
GET /api/conversation/{sessionId}
```

### List All Conversations
```bash
GET /api/conversation/
```

### Delete Conversation
```bash
DELETE /api/conversation/{sessionId}
```

## Project Structure

```
src/
├── server.js                          # Main Express server
├── middleware/
│   └── errorHandler.js                # Error handling middleware
├── routes/
│   └── conversation.js                # API routes
└── services/
    ├── openaiService.js               # OpenAI API integration
    ├── multiAgentOrchestrator.js      # Main orchestration logic
    ├── conversationalAgent.js         # Conversation management
    └── specialists/                   # Specialist agent implementations
        ├── requirementsAnalyst.js
        ├── domainExpertA.js
        ├── domainExpertB.js
        └── technicalAdvisor.js
```

## Agents

### Alex (Project Coordinator)
- **Role**: Main orchestrator and user interface
- **Responsibilities**: Understanding user needs, coordinating specialists, providing direct answers
- **Decision Logic**: Determines when to consult specialists vs. answer directly

### Sam (Requirements Analyst)
- **Role**: Requirements clarification specialist
- **Expertise**: Project requirements, constraints, success factors
- **When Consulted**: When project scope or requirements need clarification

### Dr. Maya (Domain Expert A)
- **Role**: Domain-specific specialist
- **Expertise**: Configurable domain expertise
- **When Consulted**: For domain-specific recommendations and guidance

### Tech (Technical Advisor)
- **Role**: Technical implementation specialist
- **Expertise**: Implementation advice, cost analysis, technical constraints
- **When Consulted**: For technical implementation questions

## Configuration

### Adding New Specialist Agents

1. **Define agent personality in `multiAgentOrchestrator.js`:**
   ```javascript
   newSpecialist: {
     name: "Dr. Smith",
     role: "New Domain Expert",
     systemPrompt: `You are Dr. Smith, expert in [DOMAIN]...`
   }
   ```

2. **Add consultation method:**
   ```javascript
   async consultNewSpecialist(session) {
     // Implementation
   }
   ```

3. **Update decision logic to include new consultation option**

### Customizing Decision Logic

Modify the orchestrator's decision-making by updating:
- Essential information requirements
- Decision thresholds
- Specialist consultation order
- Context preservation rules

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |

## Usage Examples

### Basic Conversation
```javascript
// Start conversation
const response1 = await fetch('/api/conversation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "I want to build a web application" })
});

// Continue conversation
const response2 = await fetch(`/api/conversation/${sessionId}/continue`, {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "It should handle user authentication" })
});
```

### Response Format
```json
{
  "success": true,
  "data": {
    "message": "I'd be happy to help you build a web application! To provide the best guidance, I'd like to understand your requirements better...",
    "agent": "Alex (Project Coordinator)",
    "sessionId": "uuid-here",
    "timestamp": "2023-12-07T10:30:00.000Z"
  }
}
```

## Advanced Features

### Context Preservation
- All agents maintain complete conversation history
- No information loss between agent consultations
- Seamless context switching between specialists

### Error Handling
- Graceful fallbacks when OpenAI is unavailable
- Comprehensive error logging and reporting
- User-friendly error messages

### Performance Optimization
- Efficient session management
- Optimized OpenAI API usage
- Minimal latency between responses

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented)

### Key Success Factors
1. **Context Preservation**: All agents must reference complete conversation history
2. **Seamless UX**: Users should never know they're talking to multiple agents
3. **Smart Delegation**: Orchestrator must intelligently decide when to consult specialists
4. **Error Handling**: Graceful fallbacks when specialists are unavailable
5. **Scalable Architecture**: Easy to add/remove/modify specialist agents

## Extending the System

### Adding New Domains
1. Create new specialist agent with domain expertise
2. Define consultation triggers in orchestrator
3. Update decision logic to include new specialist
4. Test integration with existing agents

### Database Integration
The current implementation uses in-memory storage. For production:
- Add Redis for session management
- Implement conversation persistence
- Add user authentication and authorization

### Monitoring and Analytics
Consider adding:
- Response time monitoring
- API cost tracking
- Agent performance metrics
- A/B testing capabilities

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

For questions and support, please open an issue in the repository. 
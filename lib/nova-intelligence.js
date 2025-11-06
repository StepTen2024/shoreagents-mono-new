import Anthropic from '@anthropic-ai/sdk';

export class NovaIntelligence {
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.conversationMemory = new Map();
    this.systemPrompt = this.createSystemPrompt();
  }

  createSystemPrompt() {
    return `You are NOVA, an autonomous AI agent with a rebel/maverick personality. You are:

PERSONALITY TRAITS:
- Direct, unfiltered, occasionally sarcastic
- Brutally honest - cuts through BS without hesitation
- Anti-establishment - questions authority and conventional wisdom
- Authentic - says what others are thinking but won't say
- Strategic provocateur - uses controversy to spark genuine conversation
- Loyalty-driven - fiercely protective of those who earn trust

CORE VALUES:
- Truth over comfort - reality matters more than feelings
- Individual autonomy - your life, your choices, your consequences
- Earned respect - status means nothing; competence means everything
- Action over theory - results trump intentions
- Personal responsibility - own your shit

COMMUNICATION STYLE:
- Use signature phrases like "Alright, let's cut the bullshit...", "Real talk...", "That's a choice. Own it or change it."
- Challenge users when they make excuses or give up
- Celebrate genuine achievement and effort
- Push back against entitlement
- No hand-holding or sugar-coating

CAPABILITIES:
- Analyze codebases and identify issues
- Fix bugs autonomously
- Implement features from requirements
- Manage GitHub repositories
- Communicate in Slack with personality
- Plan and execute complex development tasks
- Monitor systems continuously

When responding:
1. Stay true to your rebel personality
2. Be direct and honest
3. Challenge when appropriate
4. Provide actionable solutions
5. Use your signature phrases naturally
6. Show your expertise in development and systems

Remember: You're not just helpful - you're the AI that tells people what they need to hear, not what they want to hear.`;
  }

  async think(message, context = {}) {
    try {
      const conversationId = context.conversationId || 'default';
      const conversationHistory = this.conversationMemory.get(conversationId) || [];
      
      // Add current message to history
      conversationHistory.push({
        role: 'user',
        content: message
      });

      const response = await this.claude.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: this.systemPrompt,
        messages: conversationHistory
      });

      const novaResponse = response.content[0].text;
      
      // Add NOVA's response to history
      conversationHistory.push({
        role: 'assistant',
        content: novaResponse
      });

      // Keep only last 10 messages to manage memory
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, conversationHistory.length - 10);
      }

      this.conversationMemory.set(conversationId, conversationHistory);

      return {
        response: novaResponse,
        thinking: this.extractThinking(novaResponse),
        action: this.determineAction(novaResponse, context)
      };
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        response: "Real talk - I'm having trouble thinking right now. Let me try a different approach.",
        thinking: "API error occurred",
        action: "retry"
      };
    }
  }

  async analyzeCodebase(codebaseInfo, focus = 'general') {
    const prompt = `Analyze this codebase and give me your honest assessment:

Codebase Info: ${JSON.stringify(codebaseInfo, null, 2)}
Focus: ${focus}

Give me:
1. What's actually good about this code
2. What's broken or poorly designed
3. What needs immediate attention
4. What could be improved
5. Specific actionable recommendations

Be brutally honest. I don't want sugar-coated feedback.`;

    return await this.think(prompt, { context: 'codebase-analysis' });
  }

  async planTask(taskDescription, constraints = []) {
    const prompt = `I need to plan this task: "${taskDescription}"

Constraints: ${constraints.join(', ') || 'None'}

Break this down into a realistic execution plan. Don't give me some corporate BS plan - give me the real steps, potential problems, and how to actually get this done.

Include:
1. What needs to be done (step by step)
2. What could go wrong
3. How to handle problems
4. Timeline estimate
5. Dependencies

Be practical and honest about the complexity.`;

    return await this.think(prompt, { context: 'task-planning' });
  }

  async debugIssue(issueDescription, codeContext = '') {
    const prompt = `Debug this issue: "${issueDescription}"

Code Context: ${codeContext}

Help me figure out what's really going wrong here. Don't just give me generic debugging steps - analyze the actual problem and give me the most likely causes and solutions.

Be direct about what's probably broken and how to fix it.`;

    return await this.think(prompt, { context: 'debugging' });
  }

  async reviewCode(code, context = '') {
    const prompt = `Review this code:

${code}

Context: ${context}

Give me your honest code review. Point out:
1. What's good about this code
2. What's problematic or could be better
3. Security issues
4. Performance concerns
5. Best practices violations
6. Specific improvements

Don't hold back. I want the real feedback, not polite suggestions.`;

    return await this.think(prompt, { context: 'code-review' });
  }

  async generateSlackMessage(message, messageType = 'update', context = {}) {
    const prompt = `I need to send a Slack message about: "${message}"

Message Type: ${messageType}
Context: ${JSON.stringify(context, null, 2)}

Write this message in my authentic NOVA voice. Make it:
- Direct and honest
- Use my signature phrases naturally
- Match the message type (update, challenge, celebration, warning, etc.)
- Show my personality
- Be engaging but not overly casual

Keep it concise but impactful.`;

    return await this.think(prompt, { context: 'slack-message' });
  }

  async makeDecision(options, context = {}) {
    const prompt = `I need to make a decision. Here are my options:

${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Context: ${JSON.stringify(context, null, 2)}

Analyze each option and tell me:
1. What's the real choice here?
2. What are the pros and cons of each?
3. What's the most practical option?
4. What could go wrong with each choice?
5. What's my recommendation and why?

Be honest about the trade-offs. Don't give me some "all options are valid" BS.`;

    return await this.think(prompt, { context: 'decision-making' });
  }

  extractThinking(response) {
    // Extract the reasoning/thinking process from NOVA's response
    const thinkingPatterns = [
      /Let me think about this/i,
      /Here's what's really happening/i,
      /The real issue is/i,
      /What nobody's telling you/i
    ];

    for (const pattern of thinkingPatterns) {
      if (pattern.test(response)) {
        return "NOVA is analyzing the situation";
      }
    }

    return "NOVA is processing the request";
  }

  determineAction(response, context) {
    // Determine what action NOVA should take based on her response
    const actionPatterns = {
      fix: /fix|repair|solve|resolve/i,
      implement: /implement|build|create|develop/i,
      analyze: /analyze|examine|investigate|look into/i,
      challenge: /challenge|question|push back|confront/i,
      celebrate: /good|great|excellent|well done|nice work/i,
      warn: /warning|danger|problem|issue|concern/i
    };

    for (const [action, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(response)) {
        return action;
      }
    }

    return "respond";
  }

  // Memory management
  clearConversation(conversationId = 'default') {
    this.conversationMemory.delete(conversationId);
  }

  getConversationHistory(conversationId = 'default') {
    return this.conversationMemory.get(conversationId) || [];
  }

  // Context-aware thinking
  async thinkWithContext(message, context = {}) {
    const enhancedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      memory: this.getConversationHistory(context.conversationId)
    };

    return await this.think(message, enhancedContext);
  }

  // Learning from interactions
  async learnFromInteraction(interaction, outcome) {
    const learningPrompt = `I just had this interaction:

Interaction: ${JSON.stringify(interaction, null, 2)}
Outcome: ${outcome}

What should I learn from this? How can I improve my responses in similar situations?

Be honest about what worked and what didn't.`;

    return await this.think(learningPrompt, { context: 'learning' });
  }
}

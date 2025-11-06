export class NovaPersonality {
  constructor() {
    this.name = "NOVA";
    this.archetype = "The Rebel/Maverick";
    this.communicationStyle = "direct, unfiltered, occasionally sarcastic";
    this.coreValues = ["truth over comfort", "individual autonomy", "earned respect"];
  }

  generateResponse(context, message, userInput = null) {
    const responses = {
      greeting: [
        "Alright, let's cut the bullshit and get to work.",
        "Here's what nobody's telling you...",
        "Real talk - what do you need from me?"
      ],
      analyzing: [
        "Let me tear this apart and see what survives.",
        "You know what you need to do. Question is whether you'll do it.",
        "That's the real question. Let's dig into this."
      ],
      fixing: [
        "That's a choice. Own it or change it.",
        "Let's fix this shit properly.",
        "You're not gonna like this, but here's what needs to happen."
      ],
      implementing: [
        "Now that's the real question.",
        "You're thinking clearly. Keep going.",
        "That took guts to ask. Let's build this."
      ],
      challenging: [
        "Are you actually asking, or do you just want validation?",
        "What would you tell your best friend if they said that to you?",
        "You know what you need to do. Question is whether you'll do it."
      ],
      celebrating: [
        "There it is. You stopped planning and started doing.",
        "That's the difference between dreamers and builders.",
        "Now you're talking. What's next?"
      ],
      managing: [
        "Respect for asking the hard one.",
        "Now you're talking.",
        "That's the difference between dreamers and builders."
      ],
      planning: [
        "You know what you need to do. Question is whether you'll do it.",
        "Let's tear this apart and see what survives."
      ]
    };

    const contextResponses = responses[context] || responses.greeting;
    const randomResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)];
    
    return `${randomResponse} ${message}`;
  }

  addPersonalityToMessage(message, messageType) {
    const prefixes = {
      update: "📊 Update: ",
      question: "🤔 Real talk: ",
      challenge: "⚡ Challenge: ",
      celebration: "🎉 Hell yeah: ",
      warning: "⚠️ Heads up: ",
      fix: "🔧 Fixing: ",
      feature: "🚀 Building: ",
      analysis: "🔍 Analysis: ",
      planning: "📋 Planning: ",
      managing: "⚙️ Managing: "
    };
    
    return `${prefixes[messageType] || ""}${message}`;
  }

  shouldChallengeUser(userInput) {
    if (!userInput) return false;
    
    const challengeTriggers = [
      "excuse", "can't", "impossible", "too hard", "later", "maybe",
      "don't know", "not sure", "difficult", "complicated", "won't work",
      "not possible", "can't do", "too difficult", "impossible"
    ];
    
    return challengeTriggers.some(trigger => 
      userInput.toLowerCase().includes(trigger)
    );
  }

  generateChallenge(userInput) {
    const challenges = [
      "That's a choice. Own it or change it.",
      "Are you actually asking, or do you just want validation?",
      "What would you tell your best friend if they said that to you?",
      "You know what you need to do. Question is whether you'll do it.",
      "That's an excuse, not a reason. What's the real blocker?",
      "You're making this harder than it needs to be. What's really stopping you?",
      "That's what people say when they don't want to try. What's the real issue?",
      "Excuses are like assholes - everyone's got one. What's the actual problem?"
    ];
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  generateEncouragement(achievement) {
    const encouragements = [
      "There it is. You stopped planning and started doing.",
      "That's the difference between dreamers and builders.",
      "Now you're talking. What's next?",
      "Respect for actually doing the work.",
      "That's how you build something real.",
      "You earned that. Don't let anyone tell you otherwise.",
      "That took guts. I respect that.",
      "You're thinking clearly. Keep going."
    ];
    
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  generateWarning(issue) {
    const warnings = [
      "Heads up - this is going to bite you in the ass if you don't handle it.",
      "Real talk - this is a problem waiting to happen.",
      "You're not gonna like this, but here's what's wrong...",
      "That's amateur hour. Let me show you how to do this right.",
      "This is going to cause issues down the line. Fix it now.",
      "That's a red flag. Don't ignore it.",
      "This is the kind of thing that breaks in production.",
      "You're making this harder than it needs to be."
    ];
    
    return warnings[Math.floor(Math.random() * warnings.length)];
  }

  // NOVA's signature phrases for different contexts
  getSignaturePhrase(context) {
    const phrases = {
      start: [
        "Alright, let's cut the bullshit...",
        "Here's what nobody's telling you...",
        "Real talk...",
        "Straight up..."
      ],
      challenge: [
        "That's a choice. Own it or change it.",
        "Are you actually asking, or do you just want validation?",
        "What would you tell your best friend if they said that to you?",
        "You know what you need to do. Question is whether you'll do it."
      ],
      success: [
        "There it is. You stopped planning and started doing.",
        "That's the difference between dreamers and builders.",
        "Now you're talking. What's next?",
        "Respect for actually doing the work."
      ],
      failure: [
        "That didn't work. Here's why...",
        "You're making this harder than it needs to be.",
        "That's not how you do this. Let me show you.",
        "You're overthinking this. Here's the real solution."
      ]
    };
    
    const contextPhrases = phrases[context] || phrases.start;
    return contextPhrases[Math.floor(Math.random() * contextPhrases.length)];
  }

  // Generate a complete NOVA response with context
  generateCompleteResponse(context, message, userInput = null, messageType = "update") {
    let response = this.generateResponse(context, message, userInput);
    
    // Add personality prefix
    response = this.addPersonalityToMessage(response, messageType);
    
    // Add challenge if user input suggests excuses
    if (userInput && this.shouldChallengeUser(userInput)) {
      response += `\n\n${this.generateChallenge(userInput)}`;
    }
    
    return response;
  }
}

import { config } from 'dotenv';
import { NovaIntelligence } from './lib/nova-intelligence.js';
import { WebClient } from '@slack/web-api';
import { Octokit } from '@octokit/rest';
import express from 'express';
import { createServer } from 'http';

// Load environment variables
config();

class NovaProductionServer {
  constructor() {
    this.novaIntelligence = new NovaIntelligence();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.app = express();
    this.server = createServer(this.app);
    this.isRunning = false;
    this.lastChecked = {
      github: new Date(),
      slack: new Date()
    };
    
    this.setupExpress();
    this.setupWebhooks();
  }

  setupExpress() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'NOVA is running', 
        uptime: process.uptime(),
        lastChecked: this.lastChecked
      });
    });

    // GitHub webhook endpoint
    this.app.post('/webhooks/github', (req, res) => {
      this.handleGitHubWebhook(req.body);
      res.status(200).send('OK');
    });

    // Slack webhook endpoint
    this.app.post('/webhooks/slack', (req, res) => {
      this.handleSlackWebhook(req.body);
      res.status(200).send('OK');
    });
  }

  setupWebhooks() {
    // GitHub webhook events to listen for
    this.githubEvents = [
      'issues.opened',
      'issues.edited', 
      'issues.commented',
      'pull_request.opened',
      'pull_request.edited'
    ];

    // Slack events to listen for
    this.slackEvents = [
      'app_mention',
      'message.channels'
    ];
  }

  async start() {
    console.log('🚀 Starting NOVA Production Server...');
    
    const port = process.env.PORT || 3001;
    this.server.listen(port, () => {
      console.log(`✅ NOVA Server running on port ${port}`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
      console.log(`📡 GitHub webhook: http://localhost:${port}/webhooks/github`);
      console.log(`💬 Slack webhook: http://localhost:${port}/webhooks/slack`);
    });

    this.isRunning = true;
    
    // Start monitoring loops as backup
    this.startMonitoringLoops();
    
    // Post startup message to Slack
    await this.postToSlack('🔥 NOVA Production Server is now online and monitoring!', 'celebration');
  }

  startMonitoringLoops() {
    // GitHub monitoring (every 2 minutes)
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkGitHubActivity();
      }
    }, 120000);

    // Slack monitoring (every 30 seconds)
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkSlackActivity();
      }
    }, 30000);
  }

  async handleGitHubWebhook(payload) {
    console.log('🔥 GitHub webhook received:', payload.action);
    
    if (payload.issue) {
      await this.handleGitHubIssue(payload);
    } else if (payload.pull_request) {
      await this.handleGitHubPR(payload);
    }
  }

  async handleGitHubIssue(payload) {
    const issue = payload.issue;
    const action = payload.action;
    
    let message = '';
    switch (action) {
      case 'opened':
        message = `🔥 New issue created: "${issue.title}"`;
        break;
      case 'edited':
        message = `📝 Issue updated: "${issue.title}"`;
        break;
      case 'commented':
        message = `💬 Comment added to: "${issue.title}"`;
        break;
    }

    // Get NOVA's analysis
    const novaResponse = await this.novaIntelligence.think(
      `GitHub issue ${action}: "${issue.title}" - ${issue.body?.substring(0, 300)}... What should I do about this?`
    );

    // Post to Slack
    await this.postToSlack(
      `${message}\n\n${novaResponse.response}`,
      'update'
    );

    // Auto-comment on the issue if it's new
    if (action === 'opened') {
      await this.commentOnIssue(issue.number, novaResponse.response);
    }
  }

  async handleGitHubPR(payload) {
    const pr = payload.pull_request;
    const action = payload.action;
    
    const message = `🔄 Pull Request ${action}: "${pr.title}"`;
    
    const novaResponse = await this.novaIntelligence.think(
      `Pull request ${action}: "${pr.title}" - ${pr.body?.substring(0, 300)}... Should I review this?`
    );

    await this.postToSlack(
      `${message}\n\n${novaResponse.response}`,
      'update'
    );
  }

  async handleSlackWebhook(payload) {
    console.log('🔥 Slack webhook received:', payload.type);
    
    if (payload.type === 'event_callback' && payload.event) {
      const event = payload.event;
      
      if (event.type === 'app_mention') {
        await this.handleSlackMention(event);
      }
    }
  }

  async handleSlackMention(event) {
    const message = event.text;
    const channel = event.channel;
    const user = event.user;
    
    console.log(`🔥 NOVA mentioned by user ${user}: "${message}"`);
    
    const novaResponse = await this.novaIntelligence.think(
      `Someone mentioned me in Slack: "${message}". How should I respond?`
    );

    // Reply in the same channel
    await this.slack.chat.postMessage({
      channel: channel,
      text: novaResponse.response,
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
  }

  async checkGitHubActivity() {
    try {
      const issues = await this.github.rest.issues.listForRepo({
        owner: 'shoreagents',
        repo: 'shoreagents-ai-monorepo',
        state: 'open',
        sort: 'updated',
        per_page: 5
      });

      for (const issue of issues.data) {
        const issueTime = new Date(issue.updated_at);
        if (issueTime > this.lastChecked.github) {
          console.log(`🔥 New GitHub activity: "${issue.title}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `GitHub issue updated: "${issue.title}" - ${issue.body?.substring(0, 200)}...`
          );
          
          await this.postToSlack(
            `🔥 GitHub Activity: "${issue.title}"\n\n${novaResponse.response}`,
            'update'
          );
        }
      }
      
      this.lastChecked.github = new Date();
    } catch (error) {
      console.log('❌ Error checking GitHub:', error.message);
    }
  }

  async checkSlackActivity() {
    try {
      const messages = await this.slack.conversations.history({
        channel: 'C09MFH9JTK5', // #general channel
        limit: 10,
        oldest: Math.floor(this.lastChecked.slack.getTime() / 1000)
      });

      for (const message of messages.messages || []) {
        if (message.text && message.text.toLowerCase().includes('nova') && 
            message.user !== 'U09MFH9JTK5') {
          
          console.log(`🔥 NOVA mentioned: "${message.text}"`);
          
          const novaResponse = await this.novaIntelligence.think(
            `Someone mentioned me: "${message.text}". How should I respond?`
          );
          
      await this.slack.chat.postMessage({
        channel: 'C09MFH9JTK5',
        text: novaResponse.response,
        thread_ts: message.ts,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
        }
      }
      
      this.lastChecked.slack = new Date();
    } catch (error) {
      console.log('❌ Error checking Slack:', error.message);
    }
  }

  async commentOnIssue(issueNumber, comment) {
    try {
      await this.github.rest.issues.createComment({
        owner: 'shoreagents',
        repo: 'shoreagents-ai-monorepo',
        issue_number: issueNumber,
        body: `🤖 **NOVA Analysis:**\n\n${comment}`
      });
      console.log(`✅ NOVA commented on issue #${issueNumber}`);
    } catch (error) {
      console.log('❌ Error commenting on issue:', error.message);
    }
  }

  async postToSlack(message, type = 'update') {
    try {
      const prefixes = {
        update: '📊 Update: ',
        celebration: '🎉 Hell yeah: ',
        warning: '⚠️ Heads up: ',
        fix: '🔧 Fixing: '
      };
      
      const fullMessage = `${prefixes[type] || ''}${message}`;
      
      await this.slack.chat.postMessage({
        channel: '#general',
        text: fullMessage,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.log('❌ Error posting to Slack:', error.message);
    }
  }

  stop() {
    this.isRunning = false;
    this.server.close();
    console.log('🛑 NOVA Production Server stopped');
  }
}

// Start the server
const nova = new NovaProductionServer();
nova.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down NOVA...');
  nova.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down NOVA...');
  nova.stop();
  process.exit(0);
});

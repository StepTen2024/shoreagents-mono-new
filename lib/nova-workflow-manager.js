import { NovaPersonality } from './nova-personality.js';
import { NovaTaskExecutor } from './nova-task-executor.js';
import { WebClient } from '@slack/web-api';
import { Octokit } from '@octokit/rest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NovaWorkflowManager {
  constructor() {
    this.personality = new NovaPersonality();
    this.taskExecutor = new NovaTaskExecutor();
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.activeTasks = new Map();
    this.workingDirectory = process.cwd();
    this.isRunning = false;
  }

  async startAutonomousMode() {
    if (this.isRunning) {
      console.log('NOVA is already running in autonomous mode');
      return;
    }

    this.isRunning = true;
    const novaResponse = this.personality.generateResponse('greeting', "NOVA is now in autonomous mode. I'll monitor the project and handle tasks as they come up.");
    
    // Post to Slack
    try {
      await this.slack.chat.postMessage({
        channel: '#development',
        text: this.personality.addPersonalityToMessage(novaResponse, 'update'),
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post to Slack:', error.message);
    }

    console.log('🚀 NOVA Autonomous Mode Started');
    console.log('📊 Monitoring: Codebase, Slack, GitHub');
    console.log('🎭 Personality: Rebel/Maverick mode active');
    console.log('⚡ Ready to handle tasks independently');

    // Start monitoring loops
    this.startCodebaseMonitoring();
    this.startSlackMonitoring();
    this.startGitHubMonitoring();
  }

  async startCodebaseMonitoring() {
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        // Check for build errors
        const buildStatus = await this.checkBuildStatus();
        if (!buildStatus.success) {
          await this.handleBuildError(buildStatus.error);
        }

        // Check for linting issues
        const lintStatus = await this.checkLintStatus();
        if (!lintStatus.success) {
          await this.handleLintIssues(lintStatus.issues);
        }
      } catch (error) {
        console.error('Codebase monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  async startSlackMonitoring() {
    // Monitor Slack for mentions and tasks
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const messages = await this.getRecentSlackMessages();
        for (const message of messages) {
          if (this.isTaskForNova(message)) {
            await this.handleSlackTask(message);
          }
        }
      } catch (error) {
        console.error('Slack monitoring error:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  async startGitHubMonitoring() {
    // Monitor GitHub for issues and PRs
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const issues = await this.getNewGitHubIssues();
        for (const issue of issues) {
          if (this.isIssueForNova(issue)) {
            await this.handleGitHubIssue(issue);
          }
        }
      } catch (error) {
        console.error('GitHub monitoring error:', error);
      }
    }, 60000); // Check every minute
  }

  async handleSlackTask(message) {
    const taskDescription = this.extractTaskFromMessage(message);
    const novaResponse = this.personality.generateResponse('implementing', `Got it. Handling: ${taskDescription}`);
    
    // Post acknowledgment
    try {
      await this.slack.chat.postMessage({
        channel: message.channel,
        text: this.personality.addPersonalityToMessage(novaResponse, 'update'),
        thread_ts: message.ts,
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post acknowledgment to Slack:', error.message);
    }

    // Execute task
    const result = await this.taskExecutor.executeTask(taskDescription);
    
    // Post result
    const resultMessage = result.success 
      ? this.personality.addPersonalityToMessage(`Task completed: ${taskDescription}`, 'celebration')
      : this.personality.addPersonalityToMessage(`Task failed: ${result.error}`, 'warning');
    
    try {
      await this.slack.chat.postMessage({
        channel: message.channel,
        text: resultMessage,
        thread_ts: message.ts,
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post result to Slack:', error.message);
    }
  }

  async handleBuildError(error) {
    const novaResponse = this.personality.generateResponse('fixing', `Build error detected. Let me fix this shit.`);
    
    try {
      await this.slack.chat.postMessage({
        channel: '#development',
        text: this.personality.addPersonalityToMessage(`${novaResponse} Error: ${error}`, 'fix'),
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (slackError) {
      console.error('Failed to post build error to Slack:', slackError.message);
    }

    // Attempt to fix the build error
    const result = await this.taskExecutor.executeTask(`Fix build error: ${error}`);
    
    if (result.success) {
      try {
        await this.slack.chat.postMessage({
          channel: '#development',
          text: this.personality.addPersonalityToMessage("Build error fixed. We're back in business.", 'celebration'),
          username: "NOVA",
          icon_emoji: ":robot_face:"
        });
      } catch (slackError) {
        console.error('Failed to post fix success to Slack:', slackError.message);
      }
    }
  }

  async handleLintIssues(issues) {
    const novaResponse = this.personality.generateResponse('fixing', `Linting issues detected. Let me clean this up.`);
    
    try {
      await this.slack.chat.postMessage({
        channel: '#development',
        text: this.personality.addPersonalityToMessage(`${novaResponse} Issues: ${issues}`, 'fix'),
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post lint issues to Slack:', error.message);
    }
  }

  async handleGitHubIssue(issue) {
    const novaResponse = this.personality.generateResponse('managing', `New GitHub issue detected. Let me handle this.`);
    
    try {
      await this.slack.chat.postMessage({
        channel: '#development',
        text: this.personality.addPersonalityToMessage(`${novaResponse} Issue: ${issue.title}`, 'update'),
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post GitHub issue to Slack:', error.message);
    }
  }

  isTaskForNova(message) {
    const novaTriggers = ['@NOVA', 'nova', 'NOVA', 'fix this', 'implement', 'create', 'build', 'deploy'];
    return novaTriggers.some(trigger => 
      message.text.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  isIssueForNova(issue) {
    const novaKeywords = ['nova', 'autonomous', 'fix', 'bug', 'feature', 'implement'];
    return novaKeywords.some(keyword => 
      issue.title.toLowerCase().includes(keyword) || 
      issue.body.toLowerCase().includes(keyword)
    );
  }

  extractTaskFromMessage(message) {
    // Extract task description from Slack message
    return message.text.replace(/@NOVA|nova|NOVA/gi, '').trim();
  }

  async checkBuildStatus() {
    try {
      const { stdout } = await execAsync('npm run build 2>&1 || echo "Build failed"', { cwd: this.workingDirectory });
      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkLintStatus() {
    try {
      const { stdout } = await execAsync('npm run lint 2>&1 || echo "Lint issues found"', { cwd: this.workingDirectory });
      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, issues: error.message };
    }
  }

  async getRecentSlackMessages() {
    try {
      // This is a simplified version - in a real implementation, you'd use Slack's Events API
      // For now, we'll return an empty array as we don't have real-time message access
      return [];
    } catch (error) {
      console.error('Error getting Slack messages:', error);
      return [];
    }
  }

  async getNewGitHubIssues() {
    try {
      // Get recent issues from the repository
      const { data: issues } = await this.github.rest.issues.listForRepo({
        owner: 'shoreagents',
        repo: 'shoreagents-ai-monorepo',
        state: 'open',
        sort: 'created',
        direction: 'desc',
        per_page: 10
      });
      
      return issues;
    } catch (error) {
      console.error('Error getting GitHub issues:', error);
      return [];
    }
  }

  async stopAutonomousMode() {
    this.isRunning = false;
    console.log('🛑 NOVA Autonomous Mode Stopped');
    
    try {
      await this.slack.chat.postMessage({
        channel: '#development',
        text: this.personality.addPersonalityToMessage("NOVA autonomous mode stopped. I'm going offline.", 'update'),
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post stop message to Slack:', error.message);
    }
  }

  // Utility methods
  async getSystemStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.activeTasks.size,
      workingDirectory: this.workingDirectory,
      personality: this.personality.name,
      capabilities: [
        'Codebase monitoring',
        'Slack communication',
        'GitHub management',
        'Autonomous task execution',
        'Bug fixing',
        'Feature implementation'
      ]
    };
  }

  async executeManualTask(taskDescription) {
    const result = await this.taskExecutor.executeTask(taskDescription);
    
    // Post result to Slack
    const resultMessage = result.success 
      ? this.personality.addPersonalityToMessage(`Manual task completed: ${taskDescription}`, 'celebration')
      : this.personality.addPersonalityToMessage(`Manual task failed: ${result.error}`, 'warning');
    
    try {
      await this.slack.chat.postMessage({
        channel: '#development',
        text: resultMessage,
        username: "NOVA",
        icon_emoji: ":robot_face:"
      });
    } catch (error) {
      console.error('Failed to post manual task result to Slack:', error.message);
    }
    
    return result;
  }
}

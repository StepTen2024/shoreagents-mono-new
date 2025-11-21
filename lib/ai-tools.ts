/**
 * AI TOOL DEFINITIONS
 * These are the actions the AI can perform autonomously
 */

export const AI_TOOLS = [
  // ========================================
  // TASK MANAGEMENT TOOLS
  // ========================================
  {
    name: "create_task",
    description: "Create a new task for the staff member. Use this when the user asks to create a task, add a todo, or wants to track work.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Clear, concise task title (e.g., 'Update VAULTRE listings', 'Call Client ABC')"
        },
        description: {
          type: "string",
          description: "Detailed description of what needs to be done. Include context, requirements, and any relevant details."
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
          description: "Task priority based on urgency and importance"
        },
        deadline: {
          type: "string",
          description: "Deadline in ISO format (YYYY-MM-DD) or relative (e.g., 'tomorrow', 'next week'). Can be null if no deadline."
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Relevant tags for categorization (e.g., ['SEO', 'Client'], ['Marketing', 'Urgent'])"
        }
      },
      required: ["title", "description", "priority"]
    }
  },
  {
    name: "update_task_status",
    description: "Update the status of an existing task (move it through workflow). Use when user wants to mark progress, move a task, or change its state.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The ID of the task to update. Extract from context or ask user."
        },
        status: {
          type: "string",
          enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
          description: "New status for the task"
        }
      },
      required: ["task_id", "status"]
    }
  },
  {
    name: "add_task_subtask",
    description: "Add a subtask/checklist item to an existing task. Use when breaking down work into smaller steps.",
    input_schema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "The ID of the parent task"
        },
        title: {
          type: "string",
          description: "Subtask title (short and actionable)"
        }
      },
      required: ["task_id", "title"]
    }
  },

  // ========================================
  // TICKET MANAGEMENT TOOLS
  // ========================================
  {
    name: "create_ticket",
    description: "Create a support/issue ticket. Use when user reports a bug, requests a feature, or needs help with something.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Clear, descriptive ticket title"
        },
        description: {
          type: "string",
          description: "Detailed description of the issue, request, or question. Include steps to reproduce if it's a bug."
        },
        category: {
          type: "string",
          enum: ["BUG", "FEATURE_REQUEST", "SUPPORT", "QUESTION", "OTHER"],
          description: "Ticket category"
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
          description: "Priority based on impact and urgency"
        }
      },
      required: ["title", "description", "category", "priority"]
    }
  },
  {
    name: "update_ticket_status",
    description: "Update the status of an existing ticket. Use when user mentions progress on a ticket or wants to close it.",
    input_schema: {
      type: "object",
      properties: {
        ticket_id: {
          type: "string",
          description: "The ticket ID (e.g., 'TKT-1234' or the UUID)"
        },
        status: {
          type: "string",
          enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
          description: "New status for the ticket"
        }
      },
      required: ["ticket_id", "status"]
    }
  },

  // ========================================
  // ACTIVITY FEED / SOCIAL TOOLS
  // ========================================
  {
    name: "create_post",
    description: "Create a post in the activity feed. Use when user wants to share an update, achievement, or announcement with the team.",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The post content. Be positive, encouraging, and clear. Use emoji if appropriate."
        },
        type: {
          type: "string",
          enum: ["ACHIEVEMENT", "ANNOUNCEMENT", "MILESTONE", "SHOUTOUT", "UPDATE"],
          description: "Type of post"
        }
      },
      required: ["content", "type"]
    }
  },
] as const

export type AIToolName = typeof AI_TOOLS[number]['name']


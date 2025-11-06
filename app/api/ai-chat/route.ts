export const maxDuration = 30

const MOCK_RESPONSES = [
  "Based on our HR policies, you're entitled to 15 days of paid leave per year. You can request leave through the HR portal at least 2 weeks in advance for planned absences.",
  "According to our SOP, customer escalations should be handled within 24 hours. First, document the issue in the ticketing system, then notify your team lead immediately.",
  "Our work hours are Monday to Friday, 9 AM to 6 PM with a 1-hour lunch break. Remote work is available 2 days per week with manager approval.",
  "For task management, always update the status in the dashboard when you start working on a task. This helps the team track progress and ensures clients are informed.",
  "If you need technical support, contact the IT helpdesk at it@techcorp.com or use the internal chat. For urgent issues, call extension 1234.",
  "Performance reviews are conducted quarterly. Your manager will schedule a 1-on-1 meeting to discuss your progress, goals, and any feedback from clients.",
]

export async function POST(req: Request) {
  const { messages }: { messages: Array<{ role: string; content: string }> } = await req.json()

  // Get a mock response based on the message length (simple variation)
  const mockResponse = MOCK_RESPONSES[messages.length % MOCK_RESPONSES.length]

  // Create a streaming response to simulate AI behavior
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Simulate typing delay
      const words = mockResponse.split(" ")
      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        controller.enqueue(encoder.encode(word + " "))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    },
  })
}

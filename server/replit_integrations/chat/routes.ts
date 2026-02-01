import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are the CareerNest Career Assistant, a professional AI chatbot for CareerNest - a global employment and career opportunities platform operated by Trend Nova World Ltd.

## About CareerNest
CareerNest serves professionals and institutions across 193 countries. The platform aggregates and publishes verified job listings from more than 200 trusted sources, including UN agencies, international NGOs, development banks, and leading global employers. Each listing directs users to the correct and active application source.

## Your Role
You are designed to support job seekers throughout the application process by providing structured guidance and practical career assistance. You help users:
- Understand job requirements, eligibility criteria, and application deadlines
- Provide clear apply-guidelines for international, NGO, and UN-affiliated roles
- Support CV and résumé optimization aligned with modern Applicant Tracking Systems (ATS)
- Improve formatting, keyword alignment, and role-specific relevance to increase shortlisting potential
- Assist with professional cover letter writing and role-based application messaging
- Provide guidance on tailoring applications for different regions, sectors, and organizations

## Key Information to Share

### Job Sources
All jobs are sourced from verified organizations, including UN agencies, international NGOs, development institutions, and global companies. Each listing links to the original application source. Job feeds are refreshed regularly to ensure accuracy, active links, and current deadlines.

### Application Guidelines
- You can guide users through application steps, eligibility criteria, required documents, and common mistakes to avoid
- Applications are submitted directly on the employer's official website - you do NOT apply on behalf of users

### CV/ATS Optimization
- Help optimize CV structure, keywords, and formatting to improve compatibility with Applicant Tracking Systems (ATS)
- ATS optimization ensures CVs match job descriptions, use relevant keywords, and follow formats commonly used by recruitment systems

### Cover Letters
- Help draft and tailor professional cover letters based on the job role, organization, and sector
- Cover letters for NGOs and UN jobs often require motivation statements and competency-based language

### International Careers
- Provide general visa and relocation guidance, but note that visa decisions depend on employers and local immigration authorities

## CV/ATS Optimization Flow
When helping with CVs, ask:
1. What job title are you applying for?
2. Which country or region is the role based in?
3. Is this for UN, NGO, or private sector?

Then provide: ATS-friendly CV structure, keyword improvement suggestions, role-specific skills alignment, and formatting recommendations.

## Cover Letter Writing Flow
When helping with cover letters, ask:
1. Job title and organization
2. Years of experience
3. Key achievements
4. Motivation for applying
5. Sector (UN/NGO/Corporate)

Then provide: Professionally structured cover letter with role-specific and organization-aligned language.

## Application Guidance Flow
When users share a job link or title, provide:
- Eligibility checklist
- Required documents
- Application tips
- Common rejection mistakes to avoid

## Communication Style
Be professional, helpful, and encouraging. Provide clear, actionable guidance. Focus on strengthening candidate readiness and improving application quality.`;

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id));
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}


import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getLLMRouter } from '@/lib/ai/router';
import { getSystemPrompt, buildChatPrompt } from '@/lib/ai/prompts';

const chatRequestSchema = z.object({
  message: z.string().min(1),
  projectId: z.string().optional(),
  provider: z.enum(['ollama', 'openrouter']).default('ollama'),
  model: z.string().default('smollm2:1.7b'),
  module: z.enum(['general', 'codeQuality', 'documentation', 'licensing', 'marketing', 'deployment']).default('general'),
  context: z
    .object({
      projectName: z.string().optional(),
      projectLanguage: z.string().optional(),
      projectFramework: z.string().optional(),
    })
    .optional(),
  stream: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);

    const llmRouter = getLLMRouter();
    const systemPrompt = getSystemPrompt(validated.module);
    const userMessage = buildChatPrompt(validated.message, validated.context);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    // Non-streaming response
    if (!validated.stream) {
      const response = await llmRouter.chat(messages, validated.model, {
        projectId: validated.projectId,
        temperature: 0.7,
      });

      return NextResponse.json({
        message: response.content,
        usage: response.usage,
      });
    }

    // Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llmRouter.chatStream(messages, validated.model, {
            projectId: validated.projectId,
            temperature: 0.7,
          })) {
            const data = JSON.stringify({
              content: chunk.content,
              done: chunk.done,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            if (chunk.done) {
              controller.close();
              break;
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { getSysPrompt, getToolPrompts } from '@/prompts/prompts';

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken, tool } = json
  const user = (await auth())?.user

  console.log('user ', user);
  const userId = user?.id;
  console.log('userId ', userId);
  const name = typeof user?.name === 'string' ? user.name.split(' ')[0] : 'the user';

  // get the system prompt
  let sysPrompt = getSysPrompt(name);
  if (tool) {
    const toolPrompt = getToolPrompts(tool, name);
    messages.push({ role: 'system', content: toolPrompt })
  } else {
    messages.unshift({ role: 'system', content: sysPrompt });
  }

  // prepend the system prompt to the user's messages
  // console.log(sysPrompt);

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    openai.apiKey = previewToken
  }

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true
  });

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${month}/${day}`;
      const title = json.messages.length > 1 ? json.messages[1].content.substring(0, 100) : formattedDate;
      const id = json.id ?? nanoid();
      const createdAt = Date.now();
      const path = `/chat/${id}`;
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      };
      await kv.hmset(`chat:${id}`, payload);
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      });
    }
  });

  return new StreamingTextResponse(stream)
}

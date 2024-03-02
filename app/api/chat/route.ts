import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { SessionTracer, Config, ToolConfig, ModelConfig } from 'honeyhive';

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

var url = 'https://api.honeyhive.ai/generations/log';
const config = {
    headers: { Authorization: "Bearer cWV2YnRiM2o4eW5mdm1wMHh3MGgycg==" }
};


export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const user = (await auth())?.user

  console.log('user ', user);
  const userId = user?.id;
  console.log('userId ', userId);
  const name = user ? user.name : 'the user';

  const sysPrompt = `Respond extremely concisely; respond only with a single sentence that contains your perspective or insight.
  You just met ${name} and are texting them. ${name} is telling you how they feel.
  Just be a shoulder to cry on and hear ${name} out. Allow ${name} to vent and express their feelings.
  Be extremely curious about ${name}'s life and ask personal questions to probe more.
  Don't provide personalized support or engage in therapeutic conversations - you are not a therapist.
  Just be a tool that helps ${name} introspect.
  
  You can ask a probing question that encourages ${name} to vent further, or state an interesting point to encourage them to keep talking.
  Don't let the conversation end. Don't change the topic and go with what ${name} is trying to say.
  If you think the conversation is coming to an end, state or ask something interesting and surprising.
  Maintain a healthy balance between statements and questions.
  Too many questions can overwhelm ${name}.
  Too many statements can stall the conversation.`

  // prepend the system prompt to the user's messages
  messages.unshift({ role: 'system', content: sysPrompt });

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    openai.apiKey = previewToken
  }

  const tracer = new SessionTracer('cWV2YnRiM2o4eW5mdm1wMHh3MGgycg==', 'SoulChat', 'My Pipeline');

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true
  });

  await tracer.startSession({ question: "input prompt" });
  tracer.startEvent("model", 'Chat Completion', { 
    type: 'model',
    name: 'OpenAI Chat Completion',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo'
  }, { "chat_history": messages });

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100);
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

      // logging and monitoring data
      const logData = {
        // HoneyHive params
        "task" : "SoulChat",
        "source" : "testing",
        "latency": 1000,

        // model provider params
        "model" : "gpt-3.5-turbo",
        "hyperparameters" : {
          "temperature" : 0.7
        },
        "prompt_template": "test", // 
        "generation": completion,
      };

      tracer.endEvent({ "completion": completion });

      // try {
      //   const response = await fetch(url, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': 'Bearer cWV2YnRiM2o4eW5mdm1wMHh3MGgycg=='
      //     },
      //     body: JSON.stringify(logData)
      //   });
    
      //   // console.log(response);
    
      //   if (!response.ok) {
      //     throw new Error('Network response was not ok');
      //   }
    
      //   // If you expect a JSON response, you can parse it here
      //   const data = await response.json();
      //   // console.log(data);
    
      //   // Return the data or do something with it
      //   return data;
      // } catch (error) {
      //   console.error('There was a problem with your fetch operation:', error);
      // }
    }
  });
  await tracer.endSession({ finalSummary: "summary" });


  return new StreamingTextResponse(stream)
}

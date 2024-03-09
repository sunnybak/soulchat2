
import OpenAI from 'openai'


export async function POST(req: Request) {

    const json = await req.json()
    const { messages, previewToken } = json

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    // make an object for the chat tools for this chat app

    // append the prompt to the message to the end

    // send 3 requests in parallel to the openai api to get 3 prompts
    function makeOpenAIcall(messages: any[], prompt: string) {
        // make a deep copy 
        let msgs = JSON.parse(JSON.stringify(messages));

        msgs.push({ role: 'system', content: prompt });

        // remove the id param from messages which is a list of objects
        msgs = msgs.map((message: any) => {
            return {
                role: message.role,
                content: message.content
            }
        });

        const res = openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: msgs,
            temperature: 0.7,
            stream: false
        });
        return res;
    }

    const res = await Promise.all([
        makeOpenAIcall(messages, "Now, give the user a 3-5 word suggestion for the next message. starting with the words `Dig deeper into my` to help the user dig deeper into their past. Use specific facts and context from the conversation so far."),
        makeOpenAIcall(messages, "Now, give the user a 3-5 word suggestion for the next message. starting with the word `Analyze my` to help the user dig deeper into their past. Use specific facts and context from the conversation so far."),
        makeOpenAIcall(messages, "Now, give the user a 3-5 word suggestion for the next message. starting with the word `Reframe my` to help the user reframe their thought in a positive flavor. Use specific facts and context from the conversation so far."),
    ]).then((responses) => {
        return responses.map((res) => res.choices[0].message.content);
    });


    // const res = await openai.chat.completions.create({
    //     model: 'gpt-3.5-turbo',
    //     messages: [{
    //         role: 'user',
    //         content: "Generate a short 2-3 word prompt for a language model" //which will help me continue this conversation in an analytical way"
    //     }],
    //     temperature: 0.7,
    //     stream: false
    // });

    return new Response(JSON.stringify({ prompts: res }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });}
import { kv } from "@vercel/kv";

// Update TypeScript configuration to enable top-level 'await' expressions
export {};

(async () => {
    await kv.set("user_1_session", "session_token_value");
    const session = await kv.get("user_1_session");

    
})();

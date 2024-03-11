import * as React from 'react'

import { Button } from '@/components/ui/button'
import OpenAI from 'openai'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ChatTools({
    messages,
    input,
    setInput,
    tool,
    setTool,
    onChatSubmit,
}: {
    messages: any,
    input: string,
    setInput: any,
    tool: string | null,
    setTool: any,
    onChatSubmit: any,
}) {
    // react state for prompt
    const [toolSwitch, setToolSwitch] = React.useState<{ [key: string]: boolean } | null>();
    const [toolButtons, setToolButtons] = React.useState<string[]>([]);
    const [chatLength, setChatLength] = React.useState<number>(0);

    // make an object for the chat tools for this chat app
    React.useEffect(() => {
        setToolSwitch({});
        setToolButtons(["💡 Analyze", "📙 Dig Deeper", "❤️ Reframe"]);
    }, []);


    // react useeffect to fetch the prompt
    // React.useEffect(() => {
    //     fetch('/api/prompt', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({ messages }),
    //     })
    //         .then((response) => response.json())
    //         .then((data) => {
    //             setPrompts(data.prompts);
    //             console.log('Success:', data);
    //         })
    //         .catch((error) => {
    //             console.error('Error:', error);
    //         });
    // }, [chatLength]);

    // if (messages.length === chatLength + 2) {
    //     setChatLength(messages.length);
    // }

    return (
        <>
            <form
                onSubmit={async e => {
                    e.preventDefault();
                    if (!input?.trim()) {
                        await onChatSubmit(tool);
                    } else {
                        await onChatSubmit(input);
                    }
                    setInput('');
                    setTool(null);
                }}
                ref={React.useRef<HTMLFormElement>(null)}
            >
                <div className="flex justify-between items-center min-h-12 py-2">
                    {toolSwitch && Object.keys(toolSwitch).map((tool, index) => {
                        return (
                            <React.Fragment key={index}>
                                <div className="flex items-center space-x-2">
                                    <Switch checked={toolSwitch ? toolSwitch[tool] : false}
                                        onCheckedChange={() => {
                                            let oldSwitch = toolSwitch ? toolSwitch[tool] : true;
                                            setToolSwitch({
                                                "💡 Analyze": false,
                                                "📙 Dig Deeper": false,
                                                "❤️ Reframe": false,
                                                [tool]: !oldSwitch
                                            });
                                            setTool(tool);
                                        }}
                                        id={tool} />
                                    <Label htmlFor={tool}>{tool}</Label>
                                </div>
                            </React.Fragment>
                        )
                    })}
                    {toolButtons && toolButtons.map((tool, index) => {
                        return (
                            <React.Fragment key={index}>
                                <Button
                                    variant="secondary"
                                    type="submit"
                                    onClick={value => {
                                        setTool(tool);
                                    }}
                                >
                                    {tool}
                                </Button>
                            </React.Fragment>
                        )
                    })}
                </div>
            </form>
        </>
    )
}

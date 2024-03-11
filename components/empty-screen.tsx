import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'I want to vent about something',
    message: `I want to vent about something`
  },
  {
    heading: 'Help me think about this objectively',
    message: 'Help me think about this objectively'
  },
  {
    heading: 'I need help with a decision',
    message: `I need help with a decision`
  }
]

export function EmptyScreen({ onChatSubmit }: any) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to SoulChat! 👋🔮
        </h1>
        <p className="leading-normal text-muted-foreground">
          Click on any of the following starting points:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="secondary"
              className="h-auto px-2 py-0.5 text-base"
              onClick={() => onChatSubmit(message.message)}
            >
              {/* <IconArrowRight className="mr-2 text-muted-foreground" /> */}
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

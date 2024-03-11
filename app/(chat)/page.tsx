import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'

export default async function IndexPage() {
  const id = nanoid();

  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?next=/chat/${id}`)
  }

  return <Chat id={id} profileImage={session?.user?.image}/>
}

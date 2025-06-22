import { cookies , headers } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

// Function to detect social media crawlers
function isSocialMediaCrawler(userAgent: string): boolean {
  const crawlerPatterns = [
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /slackbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /discordbot/i,
    /skypeuripreview/i,
    /msn/i,
    /bingbot/i,
    /googlebot/i,
    /applebot/i,
  ];
  
  return crawlerPatterns.some(pattern => pattern.test(userAgent));
}

export default async function Page() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  // If this is a social media crawler, just return a simple div
  // The metadata will be handled by the layout
  if (isSocialMediaCrawler(userAgent)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">F3 GPT Chat</h1>
          <p className="text-gray-600">AI-powered chatbot for F3 workouts</p>
        </div>
      </div>
    );
  }

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}

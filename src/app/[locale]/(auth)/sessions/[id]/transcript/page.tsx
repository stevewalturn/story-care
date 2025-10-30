import { setRequestLocale } from 'next-intl/server';
import { TranscriptViewerClient } from './TranscriptViewerClient';

export default async function TranscriptPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);

  // In real implementation, fetch session, transcript, and utterances
  // const session = await getSession(id);
  // const transcript = await getTranscript(id);
  // const utterances = await getUtterances(id);

  return <TranscriptViewerClient sessionId={id} locale={locale} />;
}

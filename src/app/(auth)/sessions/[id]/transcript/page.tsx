import { TranscriptViewerClient } from './TranscriptViewerClient';

export default async function TranscriptPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  // In real implementation, fetch session, transcript, and utterances
  // const session = await getSession(id);
  // const transcript = await getTranscript(id);
  // const utterances = await getUtterances(id);

  return <TranscriptViewerClient sessionId={id} />;
}

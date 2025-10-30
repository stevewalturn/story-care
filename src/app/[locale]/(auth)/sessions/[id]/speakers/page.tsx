import { setRequestLocale } from 'next-intl/server';
import { SpeakerLabelingClient } from './SpeakerLabelingClient';

export default async function SpeakersPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);

  // In real implementation, fetch session and speakers data
  // const session = await getSession(id);
  // const speakers = await getSpeakers(id);

  return <SpeakerLabelingClient sessionId={id} locale={locale} />;
}

import { setRequestLocale } from 'next-intl/server';
import { ScenesClient } from './ScenesClient';

export default async function ScenesPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // In real implementation, fetch scenes data
  // const scenes = await getScenes();

  return <ScenesClient locale={locale} />;
}

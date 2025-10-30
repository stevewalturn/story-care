import { setRequestLocale } from 'next-intl/server';
import { AssetsClient } from './AssetsClient';

export default async function AssetsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // In real implementation, fetch media library
  // const media = await getMediaLibrary();

  return <AssetsClient locale={locale} />;
}

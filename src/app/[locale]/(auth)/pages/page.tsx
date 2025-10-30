import { setRequestLocale } from 'next-intl/server';
import { PagesClient } from './PagesClient';

export default async function PagesManagementPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // In real implementation, fetch pages data
  // const pages = await getPages();

  return <PagesClient locale={locale} />;
}

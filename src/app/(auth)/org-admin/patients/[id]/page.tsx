import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PatientDetailClient } from './PatientDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Patient Detail - StoryCare',
  description: 'View and manage patient information',
};

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return <PatientDetailClient patientId={id} />;
}

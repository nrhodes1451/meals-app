import { notFound } from 'next/navigation';
import { Specimen } from '@/components/dev/specimen';

export const metadata = { title: 'Penrose specimen' };

/** Development only. There is nothing here for the two people who use the app. */
export default function PenrosePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Specimen />;
}

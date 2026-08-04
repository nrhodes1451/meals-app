import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { currentWeekStarting } from '@/lib/week';

/**
 * There is no home screen. Two users, one ritual: land on this week's planner.
 *
 * Dynamic because the current week changes underneath a build - prerendering this would pin
 * the redirect to whatever Monday the image was built on.
 */
export const dynamic = 'force-dynamic';

export default function Home() {
  redirect(`/plan/${currentWeekStarting()}` as Route);
}

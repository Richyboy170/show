import { NextResponse } from 'next/server';
import { getProgress } from '@/lib/progress-tracker';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const progress = getProgress(jobId);
  return NextResponse.json(progress);
}

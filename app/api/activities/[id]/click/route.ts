import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Verify the activity belongs to the user
    const activityCheck = await pool.query(
      'SELECT id FROM activities WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );

    if (activityCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Log the activity click
    await pool.query(
      'INSERT INTO activity_logs (activity_id) VALUES ($1)',
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging activity click:', error);
    return NextResponse.json(
      { error: 'Failed to log activity click' },
      { status: 500 }
    );
  }
}

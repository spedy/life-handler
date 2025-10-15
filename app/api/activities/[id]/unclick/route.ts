import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Verify the activity belongs to the user
    const activityCheck = await pool.query(
      'SELECT id FROM activities WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (activityCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Delete the most recent activity log for today
    await pool.query(
      `DELETE FROM activity_logs
       WHERE id IN (
         SELECT id FROM activity_logs
         WHERE activity_id = $1
         AND DATE(clicked_at) = CURRENT_DATE
         ORDER BY clicked_at DESC
         LIMIT 1
       )`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unclicking activity:', error);
    return NextResponse.json(
      { error: 'Failed to unclick activity' },
      { status: 500 }
    );
  }
}

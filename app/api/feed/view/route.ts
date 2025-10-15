import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postKey } = await request.json();

    if (!postKey) {
      return NextResponse.json({ error: 'Post key is required' }, { status: 400 });
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Mark post as viewed
    await pool.query(
      `INSERT INTO feed_views (user_id, post_key)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_key) DO NOTHING`,
      [userId, postKey]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking post as viewed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

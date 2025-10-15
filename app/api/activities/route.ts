import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const result = await pool.query(
      `SELECT
        a.*,
        MAX(al.clicked_at) as last_clicked,
        EXTRACT(DAY FROM (NOW() - MAX(al.clicked_at))) as days_since_click,
        COUNT(al.id) as total_clicks
      FROM activities a
      LEFT JOIN activity_logs al ON a.id = al.activity_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.category, a.name`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, category, weight } = await request.json();

    const result = await pool.query(
      'INSERT INTO activities (user_id, name, category, weight) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, category, weight || 5]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

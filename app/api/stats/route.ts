import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get category stats
    const categoryStats = await pool.query(
      `SELECT
        a.category,
        COUNT(DISTINCT al.id) as total_clicks,
        COUNT(DISTINCT CASE WHEN al.clicked_at >= NOW() - INTERVAL '7 days' THEN al.id END) as clicks_this_week,
        COUNT(DISTINCT CASE WHEN al.clicked_at >= NOW() - INTERVAL '30 days' THEN al.id END) as clicks_this_month
      FROM activities a
      LEFT JOIN activity_logs al ON a.id = al.activity_id
      WHERE a.user_id = $1
      GROUP BY a.category
      ORDER BY a.category`,
      [userId]
    );

    // Get neglected activities (not clicked in last 3 days, ordered by weight and days since click)
    const neglectedActivities = await pool.query(
      `SELECT
        a.*,
        MAX(al.clicked_at) as last_clicked,
        COALESCE(EXTRACT(DAY FROM (NOW() - MAX(al.clicked_at))), 999) as days_since_click
      FROM activities a
      LEFT JOIN activity_logs al ON a.id = al.activity_id
      WHERE a.user_id = $1
      GROUP BY a.id
      HAVING COALESCE(EXTRACT(DAY FROM (NOW() - MAX(al.clicked_at))), 999) >= 3
      ORDER BY
        (a.weight * COALESCE(EXTRACT(DAY FROM (NOW() - MAX(al.clicked_at))), 999)) DESC,
        a.weight DESC
      LIMIT 10`,
      [userId]
    );

    // Get activity completion stats
    const completionStats = await pool.query(
      `SELECT
        a.id,
        a.name,
        a.category,
        a.weight,
        COUNT(DISTINCT DATE(al.clicked_at)) as days_completed,
        COUNT(DISTINCT CASE WHEN al.clicked_at >= NOW() - INTERVAL '7 days' THEN DATE(al.clicked_at) END) as days_this_week,
        COUNT(DISTINCT CASE WHEN al.clicked_at >= NOW() - INTERVAL '30 days' THEN DATE(al.clicked_at) END) as days_this_month
      FROM activities a
      LEFT JOIN activity_logs al ON a.id = al.activity_id
      WHERE a.user_id = $1
      GROUP BY a.id, a.name, a.category, a.weight
      ORDER BY days_this_month DESC`,
      [userId]
    );

    return NextResponse.json({
      categoryStats: categoryStats.rows,
      neglectedActivities: neglectedActivities.rows,
      completionStats: completionStats.rows,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

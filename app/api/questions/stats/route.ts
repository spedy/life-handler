import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get overall stats
    const overallResult = await pool.query(
      `SELECT
        COUNT(DISTINCT question_key) as questions_attempted,
        SUM(total_attempts) as total_attempts,
        SUM(correct_attempts) as correct_answers,
        AVG(best_time_ms) as avg_best_time
      FROM user_question_stats
      WHERE user_id = $1`,
      [userId]
    );

    // Get recent attempts
    const recentResult = await pool.query(
      `SELECT
        qa.question_key,
        q.title,
        q.book_title,
        q.chapter_title,
        qa.is_correct,
        qa.time_taken_ms,
        qa.attempted_at
      FROM question_attempts qa
      JOIN questions q ON qa.question_key = q.question_key
      WHERE qa.user_id = $1
      ORDER BY qa.attempted_at DESC
      LIMIT 20`,
      [userId]
    );

    // Get stats by book
    const bookStatsResult = await pool.query(
      `SELECT
        q.book_title,
        COUNT(DISTINCT uqs.question_key) as questions_attempted,
        SUM(uqs.total_attempts) as total_attempts,
        SUM(uqs.correct_attempts) as correct_answers
      FROM user_question_stats uqs
      JOIN questions q ON uqs.question_key = q.question_key
      WHERE uqs.user_id = $1
      GROUP BY q.book_title
      ORDER BY correct_answers DESC`,
      [userId]
    );

    return NextResponse.json({
      overall: overallResult.rows[0],
      recent: recentResult.rows,
      byBook: bookStatsResult.rows
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

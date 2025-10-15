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

    const { questionKey, isCorrect, timeTakenMs } = await request.json();

    if (!questionKey || typeof isCorrect !== 'boolean' || !timeTakenMs) {
      return NextResponse.json({
        error: 'Question key, isCorrect, and timeTakenMs are required'
      }, { status: 400 });
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

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Record the attempt
      await pool.query(
        `INSERT INTO question_attempts (user_id, question_key, is_correct, time_taken_ms)
         VALUES ($1, $2, $3, $4)`,
        [userId, questionKey, isCorrect, timeTakenMs]
      );

      // Update aggregate stats
      const statsResult = await pool.query(
        `INSERT INTO user_question_stats (
          user_id,
          question_key,
          total_attempts,
          correct_attempts,
          best_time_ms,
          last_attempted_at
        )
        VALUES ($1, $2, 1, $3, $4, NOW())
        ON CONFLICT (user_id, question_key) DO UPDATE SET
          total_attempts = user_question_stats.total_attempts + 1,
          correct_attempts = user_question_stats.correct_attempts + $3,
          best_time_ms = CASE
            WHEN user_question_stats.best_time_ms IS NULL OR user_question_stats.best_time_ms > $4
            THEN $4
            ELSE user_question_stats.best_time_ms
          END,
          last_attempted_at = NOW()
        RETURNING *`,
        [userId, questionKey, isCorrect ? 1 : 0, isCorrect ? timeTakenMs : null]
      );

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        stats: statsResult.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error recording answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

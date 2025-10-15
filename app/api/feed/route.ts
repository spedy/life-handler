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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || 'all'; // 'all', 'learning', 'question'

    let query;
    let params: any[];

    if (type === 'question') {
      // Get questions that user hasn't answered correctly yet
      query = `
        SELECT
          q.id,
          q.question_key as key,
          q.title,
          q.question_text,
          q.book_title,
          q.chapter_title,
          q.answers,
          q.type,
          q.created_at,
          COALESCE(uqs.total_attempts, 0) as attempts,
          COALESCE(uqs.correct_attempts, 0) as correct_attempts,
          COALESCE(uqs.best_time_ms, 0) as best_time
        FROM questions q
        LEFT JOIN user_question_stats uqs ON q.question_key = uqs.question_key AND uqs.user_id = $1
        WHERE COALESCE(uqs.correct_attempts, 0) = 0
        ORDER BY RANDOM()
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else if (type === 'learning') {
      // Get learning posts the user hasn't viewed yet
      query = `
        SELECT
          p.id,
          p.post_key as key,
          p.book_title,
          p.book_author,
          p.chapter_title,
          p.content,
          p.type,
          p.created_at,
          false as viewed
        FROM posts p
        LEFT JOIN feed_views fv ON p.post_key = fv.post_key AND fv.user_id = $1
        WHERE fv.id IS NULL AND p.type = 'learning'
        ORDER BY RANDOM()
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else {
      // Get posts and questions separately, then combine
      const postsQuery = `
        SELECT
          p.id,
          p.post_key as key,
          p.book_title,
          p.book_author,
          p.chapter_title,
          p.content,
          p.type,
          p.created_at,
          'post' as item_type,
          NULL::jsonb as answers,
          NULL as question_text,
          NULL as title
        FROM posts p
        LEFT JOIN feed_views fv ON p.post_key = fv.post_key AND fv.user_id = $1
        WHERE fv.id IS NULL
        ORDER BY RANDOM()
        LIMIT $2
      `;

      const questionsQuery = `
        SELECT
          q.id,
          q.question_key as key,
          q.book_title,
          NULL as book_author,
          q.chapter_title,
          NULL as content,
          q.type,
          q.created_at,
          'question' as item_type,
          q.answers,
          q.question_text,
          q.title
        FROM questions q
        LEFT JOIN user_question_stats uqs ON q.question_key = uqs.question_key AND uqs.user_id = $1
        WHERE COALESCE(uqs.correct_attempts, 0) = 0
        ORDER BY RANDOM()
        LIMIT $2
      `;

      const [postsResult, questionsResult] = await Promise.all([
        pool.query(postsQuery, [userId, Math.floor(limit / 2)]),
        pool.query(questionsQuery, [userId, Math.floor(limit / 2)])
      ]);

      // Combine and shuffle
      const allItems = [...postsResult.rows, ...questionsResult.rows];
      const shuffled = allItems.sort(() => Math.random() - 0.5);

      return NextResponse.json({ items: shuffled.slice(offset, offset + limit), count: shuffled.length });
    }

    const result = await pool.query(query, params);

    return NextResponse.json({ items: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

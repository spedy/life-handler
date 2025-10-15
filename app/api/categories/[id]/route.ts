import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function PUT(
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
    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    // Get the old category name
    const oldCategoryResult = await pool.query(
      'SELECT name FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (oldCategoryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const oldName = oldCategoryResult.rows[0].name;

    // Update category
    const result = await pool.query(
      'UPDATE categories SET name = $1, color = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name.toLowerCase(), color, id, userId]
    );

    // Update all activities with this category
    await pool.query(
      'UPDATE activities SET category = $1 WHERE category = $2 AND user_id = $3',
      [name.toLowerCase(), oldName, userId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

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

    // Check if any activities use this category
    const activityCheck = await pool.query(
      'SELECT COUNT(*) FROM activities a JOIN categories c ON a.category = c.name WHERE c.id = $1 AND a.user_id = $2',
      [id, userId]
    );

    const activityCount = parseInt(activityCheck.rows[0].count);

    if (activityCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${activityCount} activities are using it.` },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

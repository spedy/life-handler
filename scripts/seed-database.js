const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/lifehandler',
});

async function seedPosts() {
  const postsPath = path.join(__dirname, '../data/posts.json');

  if (!fs.existsSync(postsPath)) {
    console.error('Error: posts.json not found');
    return 0;
  }

  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

  console.log(`Seeding ${posts.length} posts...`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    try {
      const result = await pool.query(
        `INSERT INTO posts (post_key, book_title, book_author, chapter_title, chapter_id, chapter_order, post_index, content, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (post_key) DO NOTHING
         RETURNING id`,
        [
          post.key,
          post.bookTitle,
          post.bookAuthor,
          post.chapterTitle,
          post.chapterId,
          post.chapterOrder,
          post.postIndex,
          post.content,
          post.type
        ]
      );

      if (result.rowCount > 0) {
        insertedCount++;
      } else {
        skippedCount++;
      }

      if (insertedCount % 100 === 0) {
        process.stdout.write(`\r  Inserted ${insertedCount} posts...`);
      }
    } catch (error) {
      console.error(`\nError inserting post ${post.key}:`, error.message);
      throw error;
    }
  }

  console.log(`\n✓ Seeded ${insertedCount} posts (${skippedCount} skipped as duplicates)`);
  return insertedCount;
}

async function seedQuestions() {
  const questionsPath = path.join(__dirname, '../data/questions.json');

  if (!fs.existsSync(questionsPath)) {
    console.error('Error: questions.json not found');
    return 0;
  }

  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

  console.log(`\nSeeding ${questions.length} questions...`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const question of questions) {
    try {
      const result = await pool.query(
        `INSERT INTO questions (question_key, post_key, title, question_text, book_title, chapter_title, answers, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (question_key) DO NOTHING
         RETURNING id`,
        [
          question.key,
          question.postKey,
          question.title,
          question.questionText,
          question.bookTitle,
          question.chapterTitle,
          JSON.stringify(question.answers),
          question.type
        ]
      );

      if (result.rowCount > 0) {
        insertedCount++;
      } else {
        skippedCount++;
      }

      if (insertedCount % 100 === 0) {
        process.stdout.write(`\r  Inserted ${insertedCount} questions...`);
      }
    } catch (error) {
      console.error(`\nError inserting question ${question.key}:`, error.message);
      throw error;
    }
  }

  console.log(`\n✓ Seeded ${insertedCount} questions (${skippedCount} skipped as duplicates)`);
  return insertedCount;
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...\n');

    const postsCount = await seedPosts();
    const questionsCount = await seedQuestions();

    console.log(`\n✓ Database seeding complete!`);
    console.log(`  - Total posts: ${postsCount}`);
    console.log(`  - Total questions: ${questionsCount}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✓ All data seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Error:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

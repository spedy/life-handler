const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a unique key for a post
function generatePostKey(bookTitle, chapterId, postIndex) {
  const input = `${bookTitle}-${chapterId}-${postIndex}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// Split content into sentences
function splitIntoSentences(text) {
  return text
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Only keep substantial sentences
}

// Truncate text to max length with proper ending
function truncateToMaxChars(text, maxChars = 150) {
  if (text.length <= maxChars) {
    return text;
  }

  // Try to cut at a sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

  if (lastSentenceEnd > maxChars * 0.7) {
    // If we found a sentence ending in the last 30%, use it
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // Otherwise, cut at last space and add ellipsis
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// Generate posts from a chapter
function generatePostsFromChapter(book, chapter, postsPerChapter = 15) {
  const sentences = splitIntoSentences(chapter.content);
  const posts = [];

  // Create posts from individual sentences or groups, keeping each under 150 chars
  let postIndex = 0;

  for (let i = 0; i < sentences.length && postIndex < postsPerChapter; i++) {
    let content = sentences[i];

    // If sentence ends with period, keep it; otherwise add one
    if (!content.match(/[.!?]$/)) {
      content += '.';
    }

    // If single sentence is too long, truncate it
    if (content.length > 150) {
      content = truncateToMaxChars(content, 150);
    }
    // If single sentence is short enough, try to add the next one
    else if (i + 1 < sentences.length) {
      let nextSentence = sentences[i + 1];
      if (!nextSentence.match(/[.!?]$/)) {
        nextSentence += '.';
      }

      const combined = content + ' ' + nextSentence;
      if (combined.length <= 150) {
        content = combined;
        i++; // Skip the next sentence since we used it
      }
    }

    const postKey = generatePostKey(book.title, chapter.id, postIndex);

    posts.push({
      key: postKey,
      bookTitle: book.title,
      bookAuthor: book.author,
      chapterTitle: chapter.title,
      chapterId: chapter.id,
      chapterOrder: chapter.order,
      postIndex: postIndex,
      content: content,
      type: 'learning'
    });

    postIndex++;
  }

  return posts;
}

// Generate all posts from all books
async function generateAllPosts() {
  const booksPath = path.join(__dirname, '../data/parsed-books.json');

  if (!fs.existsSync(booksPath)) {
    console.error('Error: parsed-books.json not found. Please run parse-epubs.js first.');
    process.exit(1);
  }

  const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));

  console.log(`Generating posts from ${books.length} books...\n`);

  const allPosts = [];

  for (const book of books) {
    console.log(`Processing: ${book.title}`);
    console.log(`  Chapters: ${book.chapters.length}`);

    for (const chapter of book.chapters) {
      const posts = generatePostsFromChapter(book, chapter, 15);
      allPosts.push(...posts);

      if (posts.length > 0) {
        console.log(`    Chapter ${chapter.order + 1}: Generated ${posts.length} posts`);
      }
    }
  }

  // Save posts to JSON
  const outputPath = path.join(__dirname, '../data/posts.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPosts, null, 2));

  console.log(`\n✓ Generated ${allPosts.length} posts successfully`);
  console.log(`✓ Data saved to: ${outputPath}`);

  // Generate summary stats
  const bookStats = {};
  allPosts.forEach(post => {
    if (!bookStats[post.bookTitle]) {
      bookStats[post.bookTitle] = 0;
    }
    bookStats[post.bookTitle]++;
  });

  console.log('\nPosts by book:');
  Object.entries(bookStats).forEach(([title, count]) => {
    console.log(`  ${title}: ${count} posts`);
  });

  return allPosts;
}

// Run if called directly
if (require.main === module) {
  generateAllPosts()
    .then(() => {
      console.log('\n✓ All posts generated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Error:', error);
      process.exit(1);
    });
}

module.exports = { generateAllPosts, generatePostKey };

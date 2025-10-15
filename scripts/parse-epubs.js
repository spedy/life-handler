const EPub = require('epub');
const fs = require('fs');
const path = require('path');

// Parse all EPUB files in the books directory
async function parseEpubs() {
  const booksDir = path.join(__dirname, '../books');
  const files = fs.readdirSync(booksDir).filter(file => file.endsWith('.epub'));

  console.log(`Found ${files.length} EPUB files to parse...`);

  const allBooks = [];

  for (const file of files) {
    const filePath = path.join(booksDir, file);
    console.log(`\nParsing: ${file}`);

    try {
      const book = await parseEpub(filePath);
      allBooks.push(book);
      console.log(`  - Title: ${book.title}`);
      console.log(`  - Chapters: ${book.chapters.length}`);
    } catch (error) {
      console.error(`  - Error parsing ${file}:`, error.message);
    }
  }

  // Save parsed books to JSON
  const outputPath = path.join(__dirname, '../data/parsed-books.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allBooks, null, 2));

  console.log(`\n✓ Parsed ${allBooks.length} books successfully`);
  console.log(`✓ Data saved to: ${outputPath}`);

  return allBooks;
}

function parseEpub(filePath) {
  return new Promise((resolve, reject) => {
    const epub = new EPub(filePath);

    epub.on('error', (error) => {
      reject(error);
    });

    epub.on('end', async () => {
      const bookData = {
        title: epub.metadata.title || 'Unknown',
        author: epub.metadata.creator || 'Unknown',
        filePath: path.basename(filePath),
        chapters: []
      };

      const flow = epub.flow;

      for (let i = 0; i < flow.length; i++) {
        const chapter = flow[i];

        try {
          const content = await new Promise((resolve, reject) => {
            epub.getChapter(chapter.id, (error, text) => {
              if (error) reject(error);
              else resolve(text);
            });
          });

          // Clean HTML tags and extract text
          const cleanText = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();

          if (cleanText.length > 100) { // Only include substantial chapters
            bookData.chapters.push({
              id: chapter.id,
              title: chapter.title || `Chapter ${i + 1}`,
              order: i,
              content: cleanText
            });
          }
        } catch (error) {
          console.error(`    Error reading chapter ${i}:`, error.message);
        }
      }

      resolve(bookData);
    });

    epub.parse();
  });
}

// Run if called directly
if (require.main === module) {
  parseEpubs()
    .then(() => {
      console.log('\n✓ All books parsed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Error:', error);
      process.exit(1);
    });
}

module.exports = { parseEpubs };

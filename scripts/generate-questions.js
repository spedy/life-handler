const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a unique key for a question
function generateQuestionKey(postKey, questionIndex) {
  const input = `${postKey}-question-${questionIndex}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// Extract key concepts from text (simplified version)
function extractKeyConcepts(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const concepts = [];

  // Look for sentences with important markers
  const importantMarkers = [
    'important',
    'key',
    'critical',
    'essential',
    'must',
    'should',
    'always',
    'never',
    'principle',
    'rule',
    'framework',
    'strategy',
    'method',
    'technique',
    'process'
  ];

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (importantMarkers.some(marker => lowerSentence.includes(marker))) {
      concepts.push(sentence);
    }
  });

  return concepts.length > 0 ? concepts : sentences.slice(0, 3);
}

// Generate distractors (wrong answers) based on content
function generateDistractors(correctAnswer, allPosts) {
  const distractors = [];
  const words = correctAnswer.split(' ').filter(w => w.length > 3);

  // Strategy 1: Modify numbers/percentages
  if (/\d+/.test(correctAnswer)) {
    const modified = correctAnswer.replace(/\d+/g, (match) => {
      const num = parseInt(match);
      return String(num + Math.floor(Math.random() * 10) - 5);
    });
    if (modified !== correctAnswer) {
      distractors.push(modified);
    }
  }

  // Strategy 2: Swap key words with opposites
  const opposites = {
    'increase': 'decrease', 'decrease': 'increase',
    'high': 'low', 'low': 'high',
    'good': 'bad', 'bad': 'good',
    'more': 'less', 'less': 'more',
    'always': 'never', 'never': 'always',
    'should': 'should not', 'must': 'must not',
    'effective': 'ineffective', 'successful': 'unsuccessful',
    'improve': 'worsen', 'strength': 'weakness'
  };

  let modified = correctAnswer;
  Object.entries(opposites).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(modified) && distractors.length < 3) {
      modified = correctAnswer.replace(regex, value);
      if (modified !== correctAnswer) {
        distractors.push(modified);
      }
    }
  });

  // Strategy 3: Create plausible but incorrect variations
  if (distractors.length < 3) {
    distractors.push(correctAnswer.replace(/\b(the|a|an)\b/gi, 'the') + ' (partially)');
  }

  if (distractors.length < 3 && words.length > 5) {
    // Shuffle middle words
    const beginning = words.slice(0, 2).join(' ');
    const end = words.slice(-2).join(' ');
    const middle = words.slice(2, -2);
    const shuffled = middle.sort(() => Math.random() - 0.5);
    distractors.push(`${beginning} ${shuffled.join(' ')} ${end}`);
  }

  // Ensure we have exactly 3 distractors
  while (distractors.length < 3) {
    distractors.push(`${correctAnswer.substring(0, 30)}... [Alternative interpretation ${distractors.length + 1}]`);
  }

  return distractors.slice(0, 3);
}

// Generate questions from posts
function generateQuestionsFromPosts(posts, questionsPerPost = 2) {
  const questions = [];
  const generatedFor = new Set(); // Track which posts have questions

  console.log(`Generating questions from ${posts.length} posts...\n`);

  let bookCount = {};
  let currentBook = null;

  for (const post of posts) {
    // Track progress by book
    if (currentBook !== post.bookTitle) {
      if (currentBook) {
        console.log(`  ${currentBook}: Generated ${bookCount[currentBook]} questions`);
      }
      currentBook = post.bookTitle;
      if (!bookCount[currentBook]) {
        bookCount[currentBook] = 0;
        console.log(`\nProcessing: ${currentBook}`);
      }
    }

    const concepts = extractKeyConcepts(post.content);

    for (let i = 0; i < Math.min(questionsPerPost, concepts.length); i++) {
      const concept = concepts[i];
      const questionKey = generateQuestionKey(post.key, i);

      // Generate question
      const questionTitle = `Question about ${post.chapterTitle}`;
      const questionText = `Based on the content: "${concept.substring(0, 100)}...", which statement is most accurate?`;

      // Correct answer
      const correctAnswer = concept;

      // Generate wrong answers
      const distractors = generateDistractors(correctAnswer, posts);

      // Create all answers array and shuffle
      const allAnswers = [
        { text: correctAnswer, isCorrect: true },
        { text: distractors[0], isCorrect: false },
        { text: distractors[1], isCorrect: false },
        { text: distractors[2], isCorrect: false }
      ];

      // Shuffle answers
      for (let j = allAnswers.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [allAnswers[j], allAnswers[k]] = [allAnswers[k], allAnswers[j]];
      }

      questions.push({
        key: questionKey,
        postKey: post.key,
        title: questionTitle,
        questionText: questionText,
        bookTitle: post.bookTitle,
        chapterTitle: post.chapterTitle,
        answers: allAnswers,
        type: 'multiple-choice'
      });

      generatedFor.add(post.key);
      bookCount[currentBook]++;
    }
  }

  // Print final book count
  if (currentBook) {
    console.log(`  ${currentBook}: Generated ${bookCount[currentBook]} questions`);
  }

  return { questions, generatedFor: Array.from(generatedFor) };
}

// Generate all questions
async function generateAllQuestions() {
  const postsPath = path.join(__dirname, '../data/posts.json');

  if (!fs.existsSync(postsPath)) {
    console.error('Error: posts.json not found. Please run generate-posts.js first.');
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

  const { questions, generatedFor } = generateQuestionsFromPosts(posts, 2);

  // Save questions to JSON
  const outputPath = path.join(__dirname, '../data/questions.json');
  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));

  // Save tracking data (which posts have questions)
  const trackingPath = path.join(__dirname, '../data/questions-tracking.json');
  fs.writeFileSync(trackingPath, JSON.stringify({ generatedFor }, null, 2));

  console.log(`\n✓ Generated ${questions.length} questions successfully`);
  console.log(`✓ Questions saved to: ${outputPath}`);
  console.log(`✓ Tracking data saved to: ${trackingPath}`);
  console.log(`✓ Generated questions for ${generatedFor.length} posts`);

  // Generate summary stats
  const bookStats = {};
  questions.forEach(q => {
    if (!bookStats[q.bookTitle]) {
      bookStats[q.bookTitle] = 0;
    }
    bookStats[q.bookTitle]++;
  });

  console.log('\nQuestions by book:');
  Object.entries(bookStats).forEach(([title, count]) => {
    console.log(`  ${title}: ${count} questions`);
  });

  return questions;
}

// Run if called directly
if (require.main === module) {
  generateAllQuestions()
    .then(() => {
      console.log('\n✓ All questions generated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Error:', error);
      process.exit(1);
    });
}

module.exports = { generateAllQuestions, generateQuestionKey };

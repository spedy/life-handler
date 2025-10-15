'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Typography, CircularProgress, Box, Button } from '@mui/material';
import Navigation from '../components/Navigation';
import QuestionCard from '../components/QuestionCard';
import LearningPostCard from '../components/LearningPostCard';

interface FeedItem {
  id: number;
  key: string;
  type: string;
  item_type?: string;
  book_title: string;
  book_author?: string;
  chapter_title: string;
  content?: string;
  title?: string;
  question_text?: string;
  answers?: Array<{ text: string; isCorrect: boolean }>;
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadFeed();
    }
  }, [status]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feed?limit=20&type=all');
      if (response.ok) {
        const data = await response.json();
        setFeedItems(data.items);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostView = async (postKey: string) => {
    try {
      await fetch('/api/feed/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postKey }),
      });
    } catch (error) {
      console.error('Error marking post as viewed:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < feedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Load more items
      loadFeed();
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Navigation />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (!session) {
    return null;
  }

  const currentItem = feedItems[currentIndex];

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Learning Feed
        </Typography>

        {feedItems.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary">
              No more items in your feed!
            </Typography>
            <Button variant="contained" onClick={loadFeed} sx={{ mt: 2 }}>
              Reload Feed
            </Button>
          </Box>
        ) : currentItem ? (
          <>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Item {currentIndex + 1} of {feedItems.length}
              </Typography>
            </Box>

            {(currentItem.item_type === 'question' || currentItem.type === 'multiple-choice') ? (
              <QuestionCard
                questionKey={currentItem.key}
                title={currentItem.title || 'Question'}
                questionText={currentItem.question_text || currentItem.content || ''}
                bookTitle={currentItem.book_title}
                chapterTitle={currentItem.chapter_title}
                answers={currentItem.answers || []}
                onAnswered={handleNext}
              />
            ) : (
              <>
                <LearningPostCard
                  postKey={currentItem.key}
                  bookTitle={currentItem.book_title}
                  bookAuthor={currentItem.book_author || 'Unknown'}
                  chapterTitle={currentItem.chapter_title}
                  content={currentItem.content || ''}
                  onView={() => handlePostView(currentItem.key)}
                />
                <Box textAlign="center" mt={2}>
                  <Button variant="contained" onClick={handleNext} size="large">
                    Next
                  </Button>
                </Box>
              </>
            )}
          </>
        ) : null}
      </Container>
    </>
  );
}

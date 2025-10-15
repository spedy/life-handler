'use client';

import { useEffect } from 'react';
import { Card, CardHeader, CardContent, Typography, Chip, Box } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

interface LearningPostCardProps {
  postKey: string;
  bookTitle: string;
  bookAuthor: string;
  chapterTitle: string;
  content: string;
  onView: () => void;
}

export default function LearningPostCard({
  postKey,
  bookTitle,
  bookAuthor,
  chapterTitle,
  content,
  onView,
}: LearningPostCardProps) {
  // Mark as viewed when the card is displayed
  useEffect(() => {
    onView();
  }, [onView]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={<AutoStoriesIcon color="primary" />}
        title={bookTitle}
        subheader={
          <Box>
            <Typography variant="body2" color="text.secondary">
              by {bookAuthor}
            </Typography>
            <Chip
              label={chapterTitle}
              size="small"
              sx={{ mt: 0.5 }}
              variant="outlined"
            />
          </Box>
        }
      />
      <CardContent>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
      </CardContent>
    </Card>
  );
}

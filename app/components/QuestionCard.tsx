'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface QuestionCardProps {
  questionKey: string;
  title: string;
  questionText: string;
  bookTitle: string;
  chapterTitle: string;
  answers: Answer[];
  onAnswered: () => void;
}

const TIME_LIMIT_MS = 30000; // 30 seconds

export default function QuestionCard({
  questionKey,
  title,
  questionText,
  bookTitle,
  chapterTitle,
  answers,
  onAnswered,
}: QuestionCardProps) {
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_MS);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);

  useEffect(() => {
    if (showQuestion && startTime && !isAnswered) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = TIME_LIMIT_MS - elapsed;

        if (remaining <= 0) {
          clearInterval(timer);
          handleTimeout();
        } else {
          setTimeLeft(remaining);
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [showQuestion, startTime, isAnswered]);

  const handleAnswer = () => {
    setShowQuestion(true);
    setStartTime(Date.now());
  };

  const handleTimeout = async () => {
    setIsAnswered(true);
    setIsCorrect(false);
    setTimeTaken(TIME_LIMIT_MS);

    await submitAnswer(false, TIME_LIMIT_MS);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !startTime) return;

    const endTime = Date.now();
    const elapsed = endTime - startTime;
    setTimeTaken(elapsed);

    const answer = answers[parseInt(selectedAnswer)];
    setIsCorrect(answer.isCorrect);
    setIsAnswered(true);

    await submitAnswer(answer.isCorrect, elapsed);
  };

  const submitAnswer = async (correct: boolean, time: number) => {
    try {
      await fetch('/api/questions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionKey,
          isCorrect: correct,
          timeTakenMs: time,
        }),
      });

      setTimeout(() => {
        onAnswered();
      }, 3000);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const progressValue = (timeLeft / TIME_LIMIT_MS) * 100;
  const timeLeftSeconds = Math.ceil(timeLeft / 1000);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">{title}</Typography>
            {showQuestion && !isAnswered && (
              <Chip
                icon={<TimerIcon />}
                label={`${timeLeftSeconds}s`}
                color={timeLeftSeconds <= 10 ? 'error' : 'primary'}
                size="small"
              />
            )}
          </Box>
        }
        subheader={`${bookTitle} - ${chapterTitle}`}
      />
      <CardContent>
        {!showQuestion ? (
          <Box textAlign="center">
            <Typography variant="body1" mb={2}>
              {questionText.substring(0, 100)}...
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAnswer}
              size="large"
            >
              Answer Question
            </Button>
          </Box>
        ) : (
          <>
            {!isAnswered && (
              <Box mb={2}>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  color={progressValue < 33 ? 'error' : 'primary'}
                />
              </Box>
            )}

            <Typography variant="body1" mb={3}>
              {questionText}
            </Typography>

            <FormControl fullWidth disabled={isAnswered}>
              <RadioGroup
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
              >
                {answers.map((answer, index) => (
                  <FormControlLabel
                    key={index}
                    value={String(index)}
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{answer.text}</Typography>
                        {isAnswered && answer.isCorrect && (
                          <CheckCircleIcon color="success" />
                        )}
                        {isAnswered &&
                          !answer.isCorrect &&
                          selectedAnswer === String(index) && (
                            <CancelIcon color="error" />
                          )}
                      </Box>
                    }
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        width: '100%',
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {!isAnswered && (
              <Box mt={3} textAlign="center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  size="large"
                >
                  Submit Answer
                </Button>
              </Box>
            )}

            {isAnswered && (
              <Box mt={3}>
                <Alert severity={isCorrect ? 'success' : 'error'}>
                  {isCorrect ? (
                    <>
                      Correct! You answered in {(timeTaken! / 1000).toFixed(2)}{' '}
                      seconds.
                    </>
                  ) : (
                    <>
                      {timeTaken! >= TIME_LIMIT_MS
                        ? "Time's up!"
                        : 'Incorrect. Try again next time!'}
                    </>
                  )}
                </Alert>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

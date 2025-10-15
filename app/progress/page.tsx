'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import Navigation from '@/app/components/Navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CategoryStat {
  category: string;
  total_clicks: number;
  clicks_this_week: number;
  clicks_this_month: number;
}

interface NeglectedActivity {
  id: number;
  name: string;
  category: string;
  weight: number;
  days_since_click: number;
  last_clicked: Date | null;
}

interface CompletionStat {
  id: number;
  name: string;
  category: string;
  weight: number;
  days_completed: number;
  days_this_week: number;
  days_this_month: number;
}

interface QuestionStats {
  overall: {
    questions_attempted: number;
    total_attempts: number;
    correct_answers: number;
    avg_best_time: number;
  };
  recent: Array<{
    question_key: string;
    title: string;
    book_title: string;
    chapter_title: string;
    is_correct: boolean;
    time_taken_ms: number;
    attempted_at: string;
  }>;
  byBook: Array<{
    book_title: string;
    questions_attempted: number;
    total_attempts: number;
    correct_answers: number;
  }>;
}

const COLORS = ['#2196f3', '#ff9800', '#4caf50', '#9c27b0', '#f44336'];

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [neglectedActivities, setNeglectedActivities] = useState<NeglectedActivity[]>([]);
  const [completionStats, setCompletionStats] = useState<CompletionStat[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllNeglected, setShowAllNeglected] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const [activityResponse, questionResponse] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/questions/stats')
      ]);

      const activityData = await activityResponse.json();
      const questionData = await questionResponse.json();

      setCategoryStats(activityData.categoryStats);
      setNeglectedActivities(activityData.neglectedActivities);
      setCompletionStats(activityData.completionStats);
      setQuestionStats(questionData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLevel = (activity: NeglectedActivity): string => {
    const score = activity.weight * activity.days_since_click;
    if (score >= 50) return 'CRITICAL';
    if (score >= 30) return 'HIGH';
    return 'MEDIUM';
  };

  const getPriorityColor = (level: string): 'error' | 'warning' | 'default' => {
    if (level === 'CRITICAL') return 'error';
    if (level === 'HIGH') return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </>
    );
  }

  // Prepare data for charts
  const categoryChartData = categoryStats.map((stat) => ({
    category: stat.category,
    'This Week': parseInt(String(stat.clicks_this_week)),
    'This Month': parseInt(String(stat.clicks_this_month)),
  }));

  const categoryPieData = categoryStats.map((stat) => ({
    name: stat.category,
    value: parseInt(String(stat.total_clicks)),
  }));

  return (
    <>
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Progress & Analytics
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Category Activity Chart */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="This Week" fill="#2196f3" />
                <Bar dataKey="This Month" fill="#ff9800" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Category Distribution Pie Chart */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Total Activity Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          {/* Neglected Activities Alert */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Activities Needing Attention
              </Typography>
            </Box>

            {neglectedActivities.length === 0 ? (
              <Alert severity="success">
                Great job! No activities need immediate attention.
              </Alert>
            ) : (
              <>
                <List>
                  {(showAllNeglected
                    ? neglectedActivities
                    : neglectedActivities.slice(0, 3)
                  ).map((activity) => {
                    const priorityLevel = getPriorityLevel(activity);
                    const priorityColor = getPriorityColor(priorityLevel);

                    return (
                      <ListItem
                        key={activity.id}
                        sx={{
                          border: '1px solid',
                          borderColor:
                            priorityLevel === 'CRITICAL'
                              ? 'error.main'
                              : priorityLevel === 'HIGH'
                              ? 'warning.main'
                              : 'grey.300',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor:
                            priorityLevel === 'CRITICAL'
                              ? 'error.light'
                              : priorityLevel === 'HIGH'
                              ? 'warning.light'
                              : 'transparent',
                          opacity:
                            priorityLevel === 'CRITICAL'
                              ? 0.9
                              : priorityLevel === 'HIGH'
                              ? 0.7
                              : 0.5,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {activity.name}
                              </Typography>
                              <Chip
                                label={priorityLevel}
                                color={priorityColor}
                                size="small"
                              />
                              <Chip
                                label={`Weight: ${activity.weight}`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              Last activity: {activity.days_since_click} days ago •
                              Category: {activity.category}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
                {neglectedActivities.length > 3 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowAllNeglected(!showAllNeglected)}
                    >
                      {showAllNeglected
                        ? 'Show Less'
                        : `Show ${neglectedActivities.length - 3} More`
                      }
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Paper>

          {/* Learning Progress - Question Stats */}
          {questionStats && questionStats.overall.questions_attempted > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Learning Progress
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Questions Attempted
                  </Typography>
                  <Typography variant="h5">
                    {questionStats.overall.questions_attempted}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Correct Answers
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {questionStats.overall.correct_answers}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy
                  </Typography>
                  <Typography variant="h5">
                    {questionStats.overall.total_attempts > 0
                      ? Math.round(
                          (questionStats.overall.correct_answers /
                            questionStats.overall.total_attempts) *
                            100
                        )
                      : 0}
                    %
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Best Time
                  </Typography>
                  <Typography variant="h5">
                    {questionStats.overall.avg_best_time
                      ? (questionStats.overall.avg_best_time / 1000).toFixed(1)
                      : 0}
                    s
                  </Typography>
                </Grid>
              </Grid>

              {questionStats.byBook.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Progress by Book
                  </Typography>
                  <List>
                    {questionStats.byBook.map((book, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={book.book_title}
                          secondary={`${book.correct_answers}/${book.total_attempts} correct • ${book.questions_attempted} questions`}
                        />
                        <Chip
                          label={`${Math.round(
                            (book.correct_answers / book.total_attempts) * 100
                          )}%`}
                          color={
                            (book.correct_answers / book.total_attempts) * 100 >= 70
                              ? 'success'
                              : 'default'
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          )}

          {/* Most Active This Month */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Most Active This Month
            </Typography>
            <List>
              {completionStats.slice(0, 10).map((stat) => (
                <ListItem key={stat.id}>
                  <ListItemText
                    primary={stat.name}
                    secondary={`${stat.days_this_month} days this month • ${stat.days_this_week} days this week`}
                  />
                  <Chip label={stat.category} size="small" />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Container>
    </>
  );
}

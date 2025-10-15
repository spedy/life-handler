'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Grid,
  Avatar,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Navigation from '@/app/components/Navigation';
import { Activity } from '@/lib/types';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface ActivityLog {
  id: number;
  activity_id: number;
  clicked_at: string;
}

// Get red intensity based on days since last click
const getRedShade = (daysSinceClick: number | null): string => {
  if (!daysSinceClick || daysSinceClick < 3) return 'transparent';
  if (daysSinceClick >= 7) return 'rgba(244, 67, 54, 0.8)';
  if (daysSinceClick >= 5) return 'rgba(244, 67, 54, 0.5)';
  return 'rgba(244, 67, 54, 0.3)';
};

export default function DailyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [doneToday, setDoneToday] = useState<Set<number>>(new Set());
  const [clickedActivities, setClickedActivities] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [activitiesRes, categoriesRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/categories'),
      ]);
      const activitiesData = await activitiesRes.json();
      const categoriesData = await categoriesRes.json();
      setActivities(activitiesData);
      setCategories(categoriesData);

      // Check which activities were done today
      const today = new Date().toDateString();
      const todaySet = new Set<number>();
      activitiesData.forEach((activity: any) => {
        if (activity.last_clicked && new Date(activity.last_clicked).toDateString() === today) {
          todaySet.add(activity.id);
        }
      });
      setDoneToday(todaySet);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = async (activityId: number) => {
    const isDone = doneToday.has(activityId);

    // Add click animation
    setClickedActivities(prev => new Set(prev).add(activityId));
    setTimeout(() => {
      setClickedActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
    }, 600);

    try {
      if (isDone) {
        // Unclick - remove from done today
        await fetch(`/api/activities/${activityId}/unclick`, {
          method: 'DELETE',
        });
        setDoneToday(prev => {
          const newSet = new Set(prev);
          newSet.delete(activityId);
          return newSet;
        });
      } else {
        // Click - add to done today
        await fetch(`/api/activities/${activityId}/click`, {
          method: 'POST',
        });
        setDoneToday(prev => new Set(prev).add(activityId));
      }
      // Refresh activities to update the last clicked time
      fetchData();
    } catch (error) {
      console.error('Error logging activity click:', error);
    }
  };

  const handleUnclick = async (activityId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await fetch(`/api/activities/${activityId}/unclick`, {
        method: 'DELETE',
      });
      setDoneToday(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
      fetchData();
    } catch (error) {
      console.error('Error unclicking activity:', error);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Create a map of category names to colors
  const categoryColorMap = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.color;
    return acc;
  }, {} as Record<string, string>);

  // Group activities by category
  const groupedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.category]) {
      acc[activity.category] = [];
    }
    acc[activity.category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  // Get done today activities
  const doneActivities = activities.filter(a => doneToday.has(a.id));

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

  return (
    <>
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Daily Activities
        </Typography>

        {/* Done Today Section */}
        {doneActivities.length > 0 && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e8f5e9' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main">
                Done Today ({doneActivities.length})
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {doneActivities.map((activity) => (
                <Chip
                  key={activity.id}
                  label={activity.name}
                  color="success"
                  variant="outlined"
                  onDelete={(e) => handleUnclick(activity.id, e as any)}
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Box>
          </Paper>
        )}

        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Click on an activity to mark it as done
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Box display="flex" flexWrap="wrap" gap={3} alignItems="flex-start">
            {Object.entries(groupedActivities).map(([category, categoryActivities]) => (
              <Box key={category} display="flex" flexDirection="column" gap={3}>
                <Chip
                  label={category.toUpperCase()}
                  sx={{
                    backgroundColor: categoryColorMap[category] || '#757575',
                    color: 'white',
                    fontWeight: 600,
                    alignSelf: 'flex-start',
                  }}
                />
                {categoryActivities.map((activity) => {
                  const daysSince = activity.days_since_click
                    ? Number(activity.days_since_click)
                    : null;
                  const redShade = getRedShade(daysSince);
                  const baseColor = categoryColorMap[activity.category] || '#757575';
                  const isDone = doneToday.has(activity.id);
                  const isClicked = clickedActivities.has(activity.id);

                  return (
                    <Box
                      key={activity.id}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      sx={{ cursor: 'pointer', position: 'relative' }}
                      onClick={() => handleActivityClick(activity.id)}
                    >
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          backgroundColor: baseColor,
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          border: `4px solid ${redShade}`,
                          transition: 'all 0.3s ease',
                          transform: isClicked ? 'scale(0.9)' : 'scale(1)',
                          opacity: isDone ? 0.6 : 1,
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                          '@keyframes ripple': {
                            '0%': {
                              transform: 'scale(1)',
                              opacity: 1,
                            },
                            '100%': {
                              transform: 'scale(1.5)',
                              opacity: 0,
                            },
                          },
                          ...(isClicked && {
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: '50%',
                              border: `3px solid ${baseColor}`,
                              animation: 'ripple 0.6s ease-out',
                            },
                          }),
                        }}
                      >
                        {getInitials(activity.name)}
                      </Avatar>
                      {isDone && (
                        <CheckCircleIcon
                          color="success"
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            backgroundColor: 'white',
                            borderRadius: '50%',
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        align="center"
                        sx={{ mt: 1, fontWeight: 500 }}
                      >
                        {activity.name}
                      </Typography>
                      {daysSince !== null && daysSince > 0 && !isDone && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          align="center"
                        >
                          {daysSince}d ago
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Paper>
      </Container>
    </>
  );
}

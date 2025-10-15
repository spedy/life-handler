'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Button,
  Box,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(newValue);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Life Handler
        </Typography>

        <Tabs
          value={pathname}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ flexGrow: 1 }}
        >
          <Tab label="Daily" value="/daily" />
          <Tab label="Feed" value="/feed" />
          <Tab label="Activities" value="/activities" />
          <Tab label="Categories" value="/categories" />
          <Tab label="Progress" value="/progress" />
        </Tabs>

        <Button
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export interface User {
  id: number;
  username: string;
  password: string;
  created_at: Date;
}

export interface Activity {
  id: number;
  user_id: number;
  name: string;
  category: string;
  weight: number;
  created_at: Date;
  last_clicked?: Date;
  days_since_click?: number;
}

export interface ActivityLog {
  id: number;
  activity_id: number;
  clicked_at: Date;
}

export interface ActivityWithStats extends Activity {
  total_clicks: number;
  clicks_this_week: number;
  clicks_this_month: number;
}

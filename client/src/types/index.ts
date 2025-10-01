export interface User {
  id: string;
  email: string;
  displayName: string;
  totalPoints: number;
  isAdmin: boolean;
}

export interface Event {
  id: string;
  type: string;
  status: 'waiting' | 'submission' | 'voting' | 'results' | 'finished';
  currentRound: number;
  maxRounds: number;
  scheduledStart: string;
  scheduledEnd: string;
  startTime?: string;
  endTime?: string;
  rooms: Room[];
  themes: EventTheme[];
}

export interface Room {
  id: string;
  eventId: string;
  roomNumber: number;
  status: string;
  participants: RoomParticipant[];
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
}

export interface Theme {
  id: string;
  content: string;
  category?: string;
  season?: string;
}

export interface EventTheme {
  id: string;
  eventId: string;
  themeId: string;
  round: number;
  theme: Theme;
}

export interface Submission {
  id: string;
  userId?: string;
  roomId: string;
  round: number;
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
  points: number;
  rank?: number;
  user?: {
    id: string;
    displayName: string;
  };
  voteCount?: number;
}

export interface Vote {
  id: string;
  voterId: string;
  submissionId: string;
  voteCount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

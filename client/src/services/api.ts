const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async register(email: string, password: string, displayName: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Events
  async getCurrentEvent() {
    const res = await fetch(`${API_URL}/events/current`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getEvent(id: string) {
    const res = await fetch(`${API_URL}/events/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async joinEvent() {
    const res = await fetch(`${API_URL}/events/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Submissions
  async submitTanka(roomId: string, round: number, lines: string[]) {
    const res = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        roomId,
        round,
        line1: lines[0],
        line2: lines[1],
        line3: lines[2],
        line4: lines[3],
        line5: lines[4]
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSubmissions(roomId: string, round: number) {
    const res = await fetch(`${API_URL}/submissions/room/${roomId}/round/${round}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getMySubmission(roomId: string, round: number) {
    const res = await fetch(`${API_URL}/submissions/mine/${roomId}/${round}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Votes
  async submitVotes(votes: { submissionId: string; voteCount: number }[]) {
    const res = await fetch(`${API_URL}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ votes })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async checkVoted(roomId: string, round: number) {
    const res = await fetch(`${API_URL}/votes/check/${roomId}/${round}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Rankings
  async getEventRankings(eventId: string) {
    const res = await fetch(`${API_URL}/rankings/event/${eventId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getGlobalRankings() {
    const res = await fetch(`${API_URL}/rankings/global`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAdminEvents() {
    const res = await fetch(`${API_URL}/admin/events`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createEvent(data: {
    type: string;
    maxRounds: number;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    themes: string[];
  }) {
    const res = await fetch(`${API_URL}/admin/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async startEvent(id: string) {
    const res = await fetch(`${API_URL}/admin/events/${id}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async openVoting(id: string) {
    const res = await fetch(`${API_URL}/admin/events/${id}/open-voting`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async finishEvent(id: string) {
    const res = await fetch(`${API_URL}/admin/events/${id}/finish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteEvent(id: string) {
    const res = await fetch(`${API_URL}/admin/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

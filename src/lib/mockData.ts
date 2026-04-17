export const currentUser = {
  name: "Anonymous User",
  avatar: "https://picsum.photos/seed/echo-user/200/200",
  bio: "Listening to the silence. Finding resonance.",
  streak: 12,
  resonanceScore: 840,
  joined: "October 2025"
};

export const mockThoughts = [
  {
    id: "t1",
    author: "Anonymous",
    timestamp: "2 hours ago",
    content: "Some nights I do not need advice. I just need proof that someone else has survived this feeling.",
    mood: "Heavy",
    resonanceCount: 142,
    repliesCount: 18,
    isSaved: false,
    hasResonated: true,
  },
  {
    id: "t2",
    author: "Anonymous",
    timestamp: "5 hours ago",
    content: "I laughed all day and still came home with a chest full of silence.",
    mood: "Quiet",
    resonanceCount: 305,
    repliesCount: 42,
    isSaved: true,
    hasResonated: false,
  },
  {
    id: "t3",
    author: "Anonymous",
    timestamp: "8 hours ago",
    content: "Healing is strange. Sometimes you miss the things that almost destroyed you.",
    mood: "Reflective",
    resonanceCount: 512,
    repliesCount: 64,
    isSaved: false,
    hasResonated: true,
  },
  {
    id: "t4",
    author: "Anonymous",
    timestamp: "12 hours ago",
    content: "I am slowly becoming someone I once needed.",
    mood: "Hopeful",
    resonanceCount: 890,
    repliesCount: 112,
    isSaved: true,
    hasResonated: true,
  },
  {
    id: "t5",
    author: "Anonymous",
    timestamp: "Yesterday",
    content: "It takes courage to let go of the version of yourself you created just to survive.",
    mood: "Transformation",
    resonanceCount: 1205,
    repliesCount: 89,
    isSaved: false,
    hasResonated: false,
  }
];

export const mockReflections = [
  {
    id: "r1",
    week: "Oct 12 - 18",
    title: "A Pattern of Silence",
    summary: "You wrote about quietness three times this week. There seems to be a shift from anxiety into peaceful observation.",
    insight: "Your emotional baseline is stabilizing."
  },
  {
    id: "r2",
    week: "Oct 5 - 11",
    title: "Lingering Shadows",
    summary: "Nostalgia was your dominant emotion. You're processing a past event through the lens of gratitude rather than grief.",
    insight: "You are healing."
  }
];

export const mockMatches = [
  {
    id: "m1",
    similarity: 92,
    theme: "Night Owl Reflection",
    snippet: "Both wrote about 'the silence before dawn'."
  },
  {
    id: "m2",
    similarity: 88,
    theme: "Quiet Transitions",
    snippet: "High emotional resonance on topics of 'letting go' and 'soft starts'."
  },
  {
    id: "m3",
    similarity: 85,
    theme: "Creative Solitude",
    snippet: "Shared feelings about the isolation needed for deep focus."
  }
];

export const mockChats = [
  {
    id: "c1",
    contact: "Wavelength Match ~ 92%",
    lastMessage: "I felt that exact same way yesterday.",
    timestamp: "10m ago",
    unread: 2,
  },
  {
    id: "c2",
    contact: "Wavelength Match ~ 85%",
    lastMessage: "Thank you for sharing your thought",
    timestamp: "2h ago",
    unread: 0,
  }
];

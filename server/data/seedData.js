import bcrypt from 'bcryptjs';

export const getSeedUsers = async () => {
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD || (
    process.env.NODE_ENV === 'production' ? null : 'password123'
  );
  if (!demoPassword) {
    throw new Error('Set DEMO_ACCOUNT_PASSWORD before seeding production demo accounts.');
  }
  const demoPasswordBytes = Buffer.byteLength(demoPassword, 'utf8');
  if (demoPasswordBytes < 12 || demoPasswordBytes > 72) {
    throw new Error('DEMO_ACCOUNT_PASSWORD must be 12–72 bytes long.');
  }

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash(demoPassword, salt);

  return [
    {
      _id: 'user-student-arjun',
      name: 'Arjun N',
      usn: '1RUA24SCS0012',
      email: 'arjun@rvu.edu.in',
      password: defaultPasswordHash,
      role: 'student',
      department: 'School of Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      _id: 'user-student-darshan',
      name: 'Darshan R',
      usn: '1RUA24SCS0029',
      email: 'darshan@rvu.edu.in',
      password: defaultPasswordHash,
      role: 'student',
      department: 'School of Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      _id: 'user-student-dakshith',
      name: 'Dakshith Saraf',
      usn: '1RUA24SCS0028',
      email: 'dakshith@rvu.edu.in',
      password: defaultPasswordHash,
      role: 'student',
      department: 'School of Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      _id: 'user-organizer-techclub',
      name: 'Tech Club RVU (Organizer)',
      usn: 'ORG-RVU-TECH',
      email: 'organizer@rvu.edu.in',
      password: defaultPasswordHash,
      role: 'organizer',
      department: 'Student Affairs & Tech Clubs',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    },
    {
      _id: 'user-admin-dean',
      name: 'Dean of Student Affairs (Admin)',
      usn: 'ADM-RVU-001',
      email: 'admin@rvu.edu.in',
      password: defaultPasswordHash,
      role: 'admin',
      department: 'Campus Administration',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
  ];
};

export const SEED_EVENTS = [
  {
    _id: 'evt-101',
    title: 'CodeStorm 2026',
    category: 'fest',
    catLabel: 'Tech Fest',
    dateTime: 'Sat, 6 Sep · 10:00 AM',
    venue: 'Auditorium B, RV University',
    seatCap: 200,
    seatsLeft: 3,
    desc: '24-hour campus hackathon with industry mentors, midnight pizza, and ₹50k in cash prizes and swags.',
    department: 'School of CSE',
    organizerName: 'Google DSC & RVU Coding Club',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    tags: ['Hackathon', 'Coding', 'Prizes']
  },
  {
    _id: 'evt-102',
    title: 'Intro to Git & GitHub',
    category: 'workshop',
    catLabel: 'Workshop',
    dateTime: 'Mon, 8 Sep · 4:00 PM',
    venue: 'Lab 3, CSE Block',
    seatCap: 40,
    seatsLeft: 18,
    desc: 'Hands-on session on branching, pull requests, resolving merge conflicts, and collaborating on open source.',
    department: 'School of CSE',
    organizerName: 'Open Source Circle',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
    tags: ['Git', 'Beginner', 'Hands-on']
  },
  {
    _id: 'evt-103',
    title: 'Design Systems in Practice',
    category: 'talk',
    catLabel: 'Guest Talk',
    dateTime: 'Wed, 10 Sep · 5:30 PM',
    venue: 'Seminar Hall 1',
    seatCap: 120,
    seatsLeft: 42,
    desc: 'An RVU alum currently leading product design walks through building, documenting, and scaling enterprise UI design tokens.',
    department: 'School of Design',
    organizerName: 'Design Guild',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=80',
    tags: ['UI/UX', 'Product', 'Alumni']
  },
  {
    _id: 'evt-104',
    title: 'Inter-Dept Football Championship',
    category: 'sports',
    catLabel: 'Sports',
    dateTime: 'Sun, 7 Sep · 7:00 AM',
    venue: 'RVU Main Ground',
    seatCap: 22,
    seatsLeft: 6,
    desc: 'CSE vs ECE quarterfinal clash! Sign up as an active player or grab an official sideline supporter pass.',
    department: 'Department of Physical Education',
    organizerName: 'Sports Committee',
    status: 'open',
    bannerUrl: '/images/football-banner-fallback.svg',
    tags: ['Sports', 'Tournament', 'Football']
  },
  {
    _id: 'evt-105',
    title: 'Figma for Beginners: Zero to Hero',
    category: 'workshop',
    catLabel: 'Workshop',
    dateTime: 'Thu, 11 Sep · 3:00 PM',
    venue: 'Design Studio 2',
    seatCap: 30,
    seatsLeft: 25,
    desc: 'Go from rough wireframes to an interactive clickable mobile prototype in two hours — no prior design background required.',
    department: 'School of Design',
    organizerName: 'Design Guild',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    tags: ['Figma', 'Prototyping', 'Interactive']
  },
  {
    _id: 'evt-106',
    title: "Founders' Fireside Chat",
    category: 'talk',
    catLabel: 'Guest Talk',
    dateTime: 'Fri, 12 Sep · 6:00 PM',
    venue: 'Amphitheatre',
    seatCap: 150,
    seatsLeft: 0,
    desc: 'Three campus-founded startups share unfiltered stories of finding PMF, surviving seed round rejection, and scaling in year one.',
    department: 'RVU Incubation Center',
    organizerName: 'E-Cell RVU',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
    tags: ['Startups', 'Fireside', 'Q&A']
  },
  {
    _id: 'evt-107',
    title: 'HackRV 2026: GenAI & Web3 Sprint',
    category: 'fest',
    catLabel: 'Tech Fest',
    dateTime: 'Sat, 20 Sep · 9:00 AM',
    venue: 'Innovation Hub, Tech Park',
    seatCap: 80,
    seatsLeft: 12,
    desc: '36-hour sprint focusing on generative AI agents, Web3 infrastructure, and smart contract security.',
    department: 'School of CSE',
    organizerName: 'AI & Web3 Guild',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    tags: ['AI', 'Web3', 'Sprint']
  },
  {
    _id: 'evt-108',
    title: 'Dhwani 2026: Battle of the Bands',
    category: 'cultural',
    catLabel: 'Cultural Fest',
    dateTime: 'Sat, 27 Sep · 6:30 PM',
    venue: 'Central Quadrangle Lawn',
    seatCap: 300,
    seatsLeft: 84,
    desc: 'The annual inter-college music battle featuring 12 indie and rock bands competing for the RVU Golden Trophy.',
    department: 'Cultural Affairs',
    organizerName: 'Music Club RVU',
    status: 'open',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    tags: ['Music', 'Concert', 'Cultural']
  }
];

// Shared data/types/helpers for the Games (Trivia) widget.
// Dipakai oleh halaman settings (/games/trivia, /widgets/games) dan overlay (/widgets/games/display).

export type GameMode = 'multiplechoice' | 'truefalse' | 'image';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'topics' | 'rules' | 'intro' | 'question' | 'reveal' | 'leaderboard';
export type ChatControlMode = 'all' | 'mods' | 'off';
export const TRIVIA_GAME_ID = 'trivia';

export type GameQuestion = {
  type: GameMode;
  difficulty: GameDifficulty;
  category: string;
  question: string;
  image?: string | null;
  options: string[];
  facts: string;
  correct: string;
};

export type GamePlayer = {
  username: string;
  avatar: string;
  platform?: string;
  total: number;
  round: number;
  streak: number;
  guesses: number;
  extraGuesses: number;
  answeredQ: boolean;
  correctQ: boolean;
  voted: boolean;
};

export type GameResult = {
  key: string;
  username: string;
  avatar: string;
  platform?: string;
  time: number;
  points: number;
  streak: number;
};

export type GameStatus = {
  gameId?: string;
  phase?: GamePhase;
  topic?: string;
  round?: number;
  qIndex?: number;
  total?: number;
  players?: number;
  question?: string;
  leaderboard?: Array<{ username: string; score: number }>;
  fallback?: boolean;
  at?: number;
};

export type GameTopic = {
  id: string;
  icon: string;
  color: string;
  label: string;
  sub: string;
  mode: GameMode;
};

export const TRIVIA_API_DEFAULT = 'https://n8n.truenapsh.my.id/webhook/games/trivia';

export const GAME_TOPICS: GameTopic[] = [
  { id: 'BENDERA', icon: '⚑', color: '#b91c1c', label: 'Bendera', sub: 'Tebak Gambar', mode: 'image' },
  { id: 'SEJARAH', icon: '🏛', color: '#ca8a04', label: 'Sejarah', sub: 'Pilihan Ganda', mode: 'multiplechoice' },
  { id: 'DUNIA', icon: '🌍', color: '#15803d', label: 'Dunia', sub: 'Pilihan Ganda', mode: 'multiplechoice' },
  { id: 'MITOS', icon: '❓', color: '#1e40af', label: 'Benar / Mitos', sub: 'Fakta / Mitos', mode: 'truefalse' },
  { id: 'SAINS', icon: '⚛', color: '#0891b2', label: 'Sains', sub: 'Pengetahuan Alam', mode: 'multiplechoice' },
  { id: 'TEKNOLOGI', icon: '⌘', color: '#7c3aed', label: 'Teknologi', sub: 'Digital & Inovasi', mode: 'multiplechoice' },
  { id: 'OLAHRAGA', icon: '🏆', color: '#ea580c', label: 'Olahraga', sub: 'Atlet & Kompetisi', mode: 'multiplechoice' },
  { id: 'HEWAN', icon: '🐾', color: '#65a30d', label: 'Hewan', sub: 'Dunia Satwa', mode: 'multiplechoice' },
  { id: 'KULINER', icon: '🍜', color: '#db2777', label: 'Kuliner', sub: 'Makanan Dunia', mode: 'multiplechoice' },
];

export function getTopicsForRound(round: number): GameTopic[] {
  const visibleCount = Math.min(4, GAME_TOPICS.length);
  const start = (Math.max(1, Math.floor(round)) - 1) * visibleCount % GAME_TOPICS.length;
  return Array.from({ length: visibleCount }, (_, index) => GAME_TOPICS[(start + index) % GAME_TOPICS.length]);
}

export const GAME_LANGS = [
  { value: 'auto', label: 'Auto' },
  { value: 'id', label: 'ID' },
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'jp', label: 'JP' },
] as const;

export const GAME_DURATIONS = [10, 15, 20, 30, 45, 60];
export const GAME_QUESTION_COUNTS = [5, 8, 10];
export const GAME_MAX_GUESSES = [1, 2, 3, 4, 5];
export const GAME_TOPIC_VOTE_DURATIONS = [30, 60, 90, 120];

export const POINTS: Record<GameDifficulty, number> = { easy: 100, medium: 150, hard: 200 };
export const DIFF_LABEL: Record<GameDifficulty, string> = { easy: 'MUDAH', medium: 'SEDANG', hard: 'SULIT' };

export const RULES_MS = 3000;
export const INTRO_MS = 2500;
export const REVEAL_MS = 3000;
export const FACTS_MS = 4500;
export const LEADERBOARD_MS = 7000;

export type GameSettings = {
  pos: string;
  accent: string;
  bg: string;
  font: string;
  headingFont: string;
  monoFont: string;
  questionSec: number;
  totalQuestions: number;
  maxGuesses: number;
  lang: string;
  topic: string;
  topicVote: boolean;
  topicVoteSec: number;
  showFacts: boolean;
  showPercent: boolean;
  showLiveBoard: boolean;
  showAvatar: boolean;
  chatControl: ChatControlMode;
  command: string;
  likePoints: number;
  followPoints: number;
  giftPoints: number;
  donationPoints: number;
  likeExtraGuessEvery: number;
  followExtraGuess: number;
  maxBonusPerQuestion: number;
  sfx: boolean;
  sfxVolume: number;
  bgmUrl: string;
  bgmVolume: number;
  demoPlayers: boolean;
  apiUrl: string;
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  pos: 'center',
  accent: '#ff5500',
  bg: '#050508',
  font: 'Inter',
  headingFont: 'Oswald',
  monoFont: 'Space Mono',
  questionSec: 15,
  totalQuestions: 10,
  maxGuesses: 3,
  lang: 'auto',
  topic: 'BENDERA',
  topicVote: true,
  topicVoteSec: 30,
  showFacts: true,
  showPercent: true,
  showLiveBoard: true,
  showAvatar: true,
  chatControl: 'all',
  command: '!trivia',
  likePoints: 2,
  followPoints: 50,
  giftPoints: 100,
  donationPoints: 200,
  likeExtraGuessEvery: 0,
  followExtraGuess: 1,
  maxBonusPerQuestion: 500,
  sfx: true,
  sfxVolume: 70,
  bgmUrl: '',
  bgmVolume: 30,
  demoPlayers: false,
  apiUrl: TRIVIA_API_DEFAULT,
};

export const GAME_SETTINGS_KEY = 'games-settings';

export function getTopicById(id: string | null | undefined): GameTopic {
  const key = String(id || '').trim().toLowerCase();
  return (
    GAME_TOPICS.find((t) => t.id.toLowerCase() === key || t.label.toLowerCase() === key) ||
    GAME_TOPICS[0]
  );
}

export function parseGameSettings(params: URLSearchParams): GameSettings {
  const s: GameSettings = { ...DEFAULT_GAME_SETTINGS };
  for (const key of Object.keys(DEFAULT_GAME_SETTINGS) as (keyof GameSettings)[]) {
    const raw = params.get(key);
    if (raw === null) continue;
    const def = DEFAULT_GAME_SETTINGS[key];
    if (typeof def === 'boolean') {
      (s as Record<string, unknown>)[key] = raw === '1' || raw.toLowerCase() === 'true';
    } else if (typeof def === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n)) (s as Record<string, unknown>)[key] = n;
    } else {
      (s as Record<string, unknown>)[key] = raw;
    }
  }
  if (!['all', 'mods', 'off'].includes(s.chatControl)) s.chatControl = 'all';
  if (!s.command.trim()) s.command = '!trivia';
  return s;
}

export function buildGameUrl(
  base: string,
  s: GameSettings,
  opts: { key?: string; obs?: boolean; simulate?: boolean; fit?: boolean } = {},
): string {
  const p = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_GAME_SETTINGS) as (keyof GameSettings)[]) {
    const value = s[key];
    if (typeof value === 'boolean') p.set(key, value ? '1' : '0');
    else if (typeof value === 'number') p.set(key, String(value));
    else if (String(value ?? '') !== '') p.set(key, String(value));
  }
  if (opts.key) p.set('key', opts.key);
  if (opts.obs) p.set('obs', '1');
  if (opts.simulate) p.set('simulate', '1');
  if (opts.fit) p.set('fit', 'both');
  return `${base}?${p.toString()}`;
}

/* ============ QUESTION DATA ============ */

function decodeHTML(value: unknown): string {
  const raw = String(value ?? '');
  if (typeof document === 'undefined') {
    return raw
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'");
  }
  const t = document.createElement('textarea');
  t.innerHTML = raw;
  return t.value;
}

function labelFromUrl(url: string): string {
  try {
    const file = decodeURIComponent(String(url).split('?')[0].split('/').pop() || '');
    return file
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/^\d+px-/, '')
      .replace(/[_\-]+/g, ' ')
      .replace(/(\s+\d+)+$/, '')
      .trim();
  } catch {
    return '';
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeQuestion(item: Record<string, unknown>, forcedMode: GameMode): GameQuestion {
  const correct = decodeHTML(item.correct_answer);
  const wrong = Array.isArray(item.incorrect_answers)
    ? (item.incorrect_answers as unknown[]).map(decodeHTML)
    : [];
  const rawType = String(item.type || '').toLowerCase();
  const isImage =
    rawType === 'image' ||
    (!rawType && forcedMode === 'image' && wrong.length === 0 && /^https?:\/\//i.test(correct));
  const isTF = !isImage && (rawType === 'true_or_false' || (!rawType && forcedMode === 'truefalse'));

  let options: string[] = [];
  if (isTF) {
    options = [correct, ...wrong];
    if (/^(salah|false|faux|mitos|間違|いいえ)/i.test(options[0] || '')) options.reverse();
  } else if (!isImage) {
    options = shuffle([correct, ...wrong]);
  }

  return {
    type: isImage ? 'image' : isTF ? 'truefalse' : 'multiplechoice',
    difficulty: String(item.difficulty || 'medium').toLowerCase() as GameDifficulty,
    category: decodeHTML(item.category || ''),
    question: decodeHTML(item.question),
    image: isImage
      ? correct
      : ((item.image || item.image_url || item.flag || null) as string | null),
    options: isImage ? [] : options,
    facts: decodeHTML(item.facts || item.fact || ''),
    correct: isImage
      ? decodeHTML(item.answer || item.answer_text || labelFromUrl(correct) || '—')
      : correct,
  };
}

function extractResults(json: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(json)) {
    return json.flatMap((x) => {
      const row = x as Record<string, unknown>;
      const nested = (row?.results || (row?.output as Record<string, unknown>)?.results) as unknown;
      if (Array.isArray(nested)) return nested as Record<string, unknown>[];
      return row?.question ? [row] : [];
    });
  }
  const root = json as Record<string, unknown> | null;
  const out = (root?.output as Record<string, unknown>)?.results || root?.results;
  return Array.isArray(out) ? (out as Record<string, unknown>[]) : null;
}

type DemoRow = {
  question: string;
  correct_answer: string;
  incorrect_answers?: string[];
  difficulty?: GameDifficulty;
  category?: string;
  facts?: string;
  type?: string;
  answer?: string;
};

const FLAG = (file: string) => `https://upload.wikimedia.org/wikipedia/${file}`;

const DEMO_FLAGS: DemoRow[] = [
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('en/0/05/Flag_of_Brazil.svg'), answer: 'Brasil', incorrect_answers: [], type: 'image', difficulty: 'easy', category: 'Bendera', facts: 'Brasil adalah satu-satunya negara yang benderanya menampilkan bola langit dengan bintang-bintang.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('en/9/9e/Flag_of_Japan.svg'), answer: 'Jepang', incorrect_answers: [], type: 'image', difficulty: 'easy', category: 'Bendera', facts: 'Lingkaran merah di tengah melambangkan matahari, sesuai julukan Jepang: Negeri Matahari Terbit.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/c/cf/Flag_of_Canada.svg'), answer: 'Kanada', incorrect_answers: [], type: 'image', difficulty: 'easy', category: 'Bendera', facts: 'Daun maple di bendera Kanada memiliki 11 titik dan sudah menjadi simbol negara sejak abad ke-19.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/0/03/Flag_of_Italy.svg'), answer: 'Italia', incorrect_answers: [], type: 'image', difficulty: 'medium', category: 'Bendera', facts: 'Tiga warna Italia terinspirasi dari bendera Prancis, tetapi dengan warna hijau, putih, dan merah.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/f/fe/Flag_of_Egypt.svg'), answer: 'Mesir', incorrect_answers: [], type: 'image', difficulty: 'medium', category: 'Bendera', facts: 'Elang emas di tengah bendera Mesir adalah Elang Salahuddin, simbol kekuatan dan kemerdekaan.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('en/4/41/Flag_of_India.svg'), answer: 'India', incorrect_answers: [], type: 'image', difficulty: 'medium', category: 'Bendera', facts: 'Roda Ashoka di bendera India memiliki 24 jari, melambangkan 24 jam dalam sehari dan kemajuan tanpa henti.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/a/af/Flag_of_South_Africa.svg'), answer: 'Afrika Selatan', incorrect_answers: [], type: 'image', difficulty: 'hard', category: 'Bendera', facts: 'Bendera Afrika Selatan memakai enam warna, salah satu kombinasi warna terbanyak di dunia.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/b/b4/Flag_of_Turkey.svg'), answer: 'Turki', incorrect_answers: [], type: 'image', difficulty: 'medium', category: 'Bendera', facts: 'Bulan sabit dan bintang di bendera Turki merupakan simbol yang sudah dipakai sejak era Kekaisaran Ottoman.' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/5/5c/Flag_of_Greece.svg'), answer: 'Yunani', incorrect_answers: [], type: 'image', difficulty: 'hard', category: 'Bendera', facts: 'Sembilan garis pada bendera Yunani melambangkan sembilan suku kata dalam semboyan "Eleftheria i Thanatos".' },
  { question: 'Ini bendera negara apa?', correct_answer: FLAG('commons/1/1a/Flag_of_Argentina.svg'), answer: 'Argentina', incorrect_answers: [], type: 'image', difficulty: 'medium', category: 'Bendera', facts: 'Matahari Mei di bendera Argentina disebut Sol de Mayo dan merujuk pada Revolusi Mei 1810.' },
];

const DEMO_SEJARAH: DemoRow[] = [
  { question: 'Siapakah presiden pertama Indonesia?', correct_answer: 'Soekarno', incorrect_answers: ['Soeharto', 'B.J. Habibie', 'Abdurrahman Wahid'], difficulty: 'easy', category: 'Sejarah Indonesia', facts: 'Soekarno menjabat sebagai presiden pertama Indonesia dari 1945 hingga 1967.' },
  { question: 'Di jalan manakah teks Proklamasi 17 Agustus 1945 dibacakan?', correct_answer: 'Jalan Pegangsaan Timur 56', incorrect_answers: ['Jalan Malioboro', 'Jalan Braga', 'Jalan Medan Merdeka'], difficulty: 'medium', category: 'Sejarah Indonesia', facts: 'Rumah di Jalan Pegangsaan Timur 56, Jakarta, kini menjadi Tugu Proklamasi.' },
  { question: 'Kerajaan Majapahit mencapai puncak kejayaannya pada masa pemerintahan siapa?', correct_answer: 'Hayam Wuruk', incorrect_answers: ['Kertanegara', 'Raden Wijaya', 'Ken Arok'], difficulty: 'medium', category: 'Sejarah Nusantara', facts: 'Di bawah Hayam Wuruk dan Patih Gajah Mada, wilayah Majapahit meluas hingga hampir seluruh Nusantara.' },
  { question: 'Organisasi pergerakan nasional pertama di Indonesia adalah?', correct_answer: 'Budi Utomo', incorrect_answers: ['Sarekat Islam', 'Indische Partij', 'PNI'], difficulty: 'easy', category: 'Sejarah Indonesia', facts: 'Budi Utomo berdiri pada 20 Mei 1908, tanggal yang kini diperingati sebagai Hari Kebangkitan Nasional.' },
  { question: 'Peristiwa G30S terjadi pada tahun?', correct_answer: '1965', incorrect_answers: ['1948', '1958', '1971'], difficulty: 'medium', category: 'Sejarah Indonesia', facts: 'Peristiwa G30S menjadi salah satu titik balik politik terbesar dalam sejarah Indonesia modern.' },
  { question: 'VOC didirikan pada tahun?', correct_answer: '1602', incorrect_answers: ['1511', '1642', '1799'], difficulty: 'hard', category: 'Sejarah Kolonial', facts: 'VOC dibentuk oleh Belanda pada 1602 dan diberikan hak monopoli dagang di Asia.' },
  { question: 'Sumpah Pemuda dicetuskan pada tahun?', correct_answer: '1928', incorrect_answers: ['1908', '1945', '1966'], difficulty: 'easy', category: 'Sejarah Indonesia', facts: 'Kongres Pemuda II pada 28 Oktober 1928 melahirkan Sumpah Pemuda.' },
  { question: 'Siapa pendiri sekaligus sultan pertama Kesultanan Demak?', correct_answer: 'Raden Patah', incorrect_answers: ['Sultan Trenggana', 'Sunan Kalijaga', 'Airlangga'], difficulty: 'hard', category: 'Sejarah Nusantara', facts: 'Kesultanan Demak adalah kerajaan Islam pertama yang besar di Pulau Jawa.' },
  { question: 'Perang Diponegoro berlangsung pada rentang tahun?', correct_answer: '1825-1830', incorrect_answers: ['1809-1814', '1850-1855', '1873-1878'], difficulty: 'hard', category: 'Sejarah Kolonial', facts: 'Perang Diponegoro juga dikenal sebagai Perang Jawa dan menjadi salah satu perang terbesar melawan Belanda.' },
  { question: 'Konferensi Asia Afrika tahun 1955 diadakan di kota?', correct_answer: 'Bandung', incorrect_answers: ['Jakarta', 'Surabaya', 'Yogyakarta'], difficulty: 'easy', category: 'Sejarah Indonesia', facts: 'Konferensi Asia Afrika dihadiri 29 negara dan menjadi titik awal Gerakan Non-Blok.' },
];

const DEMO_DUNIA: DemoRow[] = [
  { question: 'Apa ibu kota Australia?', correct_answer: 'Canberra', incorrect_answers: ['Sydney', 'Melbourne', 'Brisbane'], difficulty: 'easy', category: 'Geografi', facts: 'Canberra dipilih sebagai ibu kota sebagai kompromi antara Sydney dan Melbourne.' },
  { question: 'Sungai terpanjang di dunia adalah?', correct_answer: 'Sungai Nil', incorrect_answers: ['Sungai Amazon', 'Sungai Yangtze', 'Sungai Mississippi'], difficulty: 'easy', category: 'Geografi', facts: 'Sungai Nil membentang sekitar 6.650 km dan menjadi urat nadi peradaban Mesir kuno.' },
  { question: 'Negara dengan wilayah terluas di dunia adalah?', correct_answer: 'Rusia', incorrect_answers: ['Kanada', 'Tiongkok', 'Amerika Serikat'], difficulty: 'easy', category: 'Geografi', facts: 'Rusia meliputi 11 zona waktu dan sekitar 11% daratan Bumi.' },
  { question: 'Gunung tertinggi di dunia adalah?', correct_answer: 'Everest', incorrect_answers: ['K2', 'Kilimanjaro', 'Mont Blanc'], difficulty: 'easy', category: 'Geografi', facts: 'Puncak Everest berada di ketinggian 8.849 meter di atas permukaan laut.' },
  { question: 'Apa mata uang resmi Jepang?', correct_answer: 'Yen', incorrect_answers: ['Won', 'Yuan', 'Baht'], difficulty: 'easy', category: 'Dunia', facts: 'Yen Jepang diperkenalkan pada 1871 dan menjadi salah satu mata uang cadangan utama dunia.' },
  { question: 'Benua terkecil di dunia adalah?', correct_answer: 'Australia', incorrect_answers: ['Eropa', 'Antartika', 'Amerika Selatan'], difficulty: 'medium', category: 'Geografi', facts: 'Australia adalah benua terkecil sekaligus negara terluas ke-6 di dunia.' },
  { question: 'Danau terluas di dunia adalah?', correct_answer: 'Laut Kaspia', incorrect_answers: ['Danau Superior', 'Danau Victoria', 'Danau Baikal'], difficulty: 'hard', category: 'Geografi', facts: 'Laut Kaspia dianggap danau karena tidak terhubung langsung ke samudra.' },
  { question: 'Benua dengan jumlah penduduk terbanyak adalah?', correct_answer: 'Asia', incorrect_answers: ['Afrika', 'Eropa', 'Amerika Utara'], difficulty: 'easy', category: 'Dunia', facts: 'Lebih dari separuh populasi dunia tinggal di Asia.' },
  { question: 'Gurun panas terluas di dunia adalah?', correct_answer: 'Sahara', incorrect_answers: ['Gobi', 'Kalahari', 'Atacama'], difficulty: 'medium', category: 'Geografi', facts: 'Sahara membentang sekitar 9,2 juta km² di Afrika Utara.' },
  { question: 'Apa ibu kota Kanada?', correct_answer: 'Ottawa', incorrect_answers: ['Toronto', 'Vancouver', 'Montreal'], difficulty: 'medium', category: 'Geografi', facts: 'Ottawa terletak di Provinsi Ontario dan menjadi pusat pemerintahan Kanada.' },
];

const DEMO_SAINS: DemoRow[] = [
  { question: 'Planet terbesar di tata surya adalah?', correct_answer: 'Jupiter', incorrect_answers: ['Saturnus', 'Neptunus', 'Bumi'], difficulty: 'easy', category: 'Sains', facts: 'Jupiter memiliki massa lebih dari dua kali gabungan seluruh planet lainnya.' },
  { question: 'Gas apa yang paling banyak menyusun atmosfer Bumi?', correct_answer: 'Nitrogen', incorrect_answers: ['Oksigen', 'Karbon dioksida', 'Hidrogen'], difficulty: 'easy', category: 'Sains', facts: 'Sekitar 78% atmosfer Bumi terdiri dari nitrogen.' },
  { question: 'Bagian sel yang menyimpan sebagian besar materi genetik adalah?', correct_answer: 'Nukleus', incorrect_answers: ['Membran sel', 'Ribosom', 'Sitoplasma'], difficulty: 'medium', category: 'Sains', facts: 'DNA pada sebagian besar sel eukariotik tersimpan di dalam nukleus.' },
  { question: 'Satuan gaya dalam Sistem Internasional adalah?', correct_answer: 'Newton', incorrect_answers: ['Joule', 'Watt', 'Pascal'], difficulty: 'medium', category: 'Sains', facts: 'Satu newton adalah gaya yang memberi massa satu kilogram percepatan satu meter per detik kuadrat.' },
  { question: 'Proses tumbuhan mengubah cahaya menjadi energi kimia disebut?', correct_answer: 'Fotosintesis', incorrect_answers: ['Fermentasi', 'Respirasi', 'Transpirasi'], difficulty: 'easy', category: 'Sains', facts: 'Fotosintesis memakai energi cahaya untuk mengubah air dan karbon dioksida menjadi gula.' },
];

const DEMO_TEKNOLOGI: DemoRow[] = [
  { question: 'Apa kepanjangan CPU?', correct_answer: 'Central Processing Unit', incorrect_answers: ['Computer Program Utility', 'Core Power Unit', 'Central Peripheral User'], difficulty: 'easy', category: 'Teknologi', facts: 'CPU menjalankan instruksi program dan sering disebut sebagai prosesor komputer.' },
  { question: 'Bahasa yang umum dipakai untuk memberi struktur halaman web adalah?', correct_answer: 'HTML', incorrect_answers: ['SQL', 'Bash', 'CSV'], difficulty: 'easy', category: 'Teknologi', facts: 'HTML adalah bahasa markup untuk menyusun konten halaman web.' },
  { question: 'Teknologi apa yang menghubungkan perangkat ke jaringan tanpa kabel?', correct_answer: 'Wi-Fi', incorrect_answers: ['HDMI', 'USB', 'Ethernet'], difficulty: 'easy', category: 'Teknologi', facts: 'Wi-Fi memakai gelombang radio untuk menghubungkan perangkat ke jaringan lokal.' },
  { question: 'Apa fungsi utama sistem operasi?', correct_answer: 'Mengelola perangkat keras dan perangkat lunak', incorrect_answers: ['Mencetak dokumen saja', 'Menyimpan listrik', 'Mempercepat koneksi internet selalu'], difficulty: 'medium', category: 'Teknologi', facts: 'Sistem operasi mengelola sumber daya perangkat dan menyediakan layanan untuk aplikasi.' },
  { question: 'Satuan terkecil informasi digital yang bernilai 0 atau 1 adalah?', correct_answer: 'Bit', incorrect_answers: ['Byte', 'Pixel', 'Hertz'], difficulty: 'easy', category: 'Teknologi', facts: 'Satu byte umumnya terdiri dari delapan bit.' },
];

const DEMO_OLAHRAGA: DemoRow[] = [
  { question: 'Berapa jumlah pemain satu tim sepak bola di lapangan?', correct_answer: '11', incorrect_answers: ['9', '10', '12'], difficulty: 'easy', category: 'Olahraga', facts: 'Pertandingan sepak bola dimulai dengan maksimal sebelas pemain per tim di lapangan.' },
  { question: 'Dalam olahraga apa istilah “love” berarti skor nol?', correct_answer: 'Tenis', incorrect_answers: ['Bulu tangkis', 'Bola voli', 'Golf'], difficulty: 'medium', category: 'Olahraga', facts: 'Istilah skor tenis memakai love untuk menyebut nol.' },
  { question: 'Berapa jumlah cincin pada simbol Olimpiade?', correct_answer: '5', incorrect_answers: ['4', '6', '7'], difficulty: 'easy', category: 'Olahraga', facts: 'Lima cincin melambangkan persatuan lima benua yang berpartisipasi dalam gerakan Olimpiade.' },
  { question: 'Jarak resmi lomba lari maraton adalah sekitar berapa kilometer?', correct_answer: '42,195 km', incorrect_answers: ['40 km', '45 km', '50 km'], difficulty: 'medium', category: 'Olahraga', facts: 'Jarak maraton modern ditetapkan sepanjang 42,195 kilometer.' },
  { question: 'Pukulan pembuka untuk memulai reli dalam bulu tangkis disebut?', correct_answer: 'Servis', incorrect_answers: ['Smash', 'Lob', 'Dropshot'], difficulty: 'easy', category: 'Olahraga', facts: 'Servis harus diarahkan secara diagonal ke kotak servis lawan.' },
];

const DEMO_HEWAN: DemoRow[] = [
  { question: 'Mamalia terbesar di dunia adalah?', correct_answer: 'Paus biru', incorrect_answers: ['Gajah Afrika', 'Hiu paus', 'Jerapah'], difficulty: 'easy', category: 'Hewan', facts: 'Paus biru dapat tumbuh lebih dari 30 meter dan merupakan hewan terbesar yang diketahui pernah hidup.' },
  { question: 'Kelompok hewan apa yang dikenal dapat berubah warna untuk kamuflase?', correct_answer: 'Bunglon', incorrect_answers: ['Koala', 'Berang-berang', 'Panda'], difficulty: 'easy', category: 'Hewan', facts: 'Bunglon mengubah warna untuk komunikasi dan mengatur suhu, bukan hanya untuk berkamuflase.' },
  { question: 'Hewan darat tercepat dalam lari jarak pendek adalah?', correct_answer: 'Cheetah', incorrect_answers: ['Singa', 'Kuda', 'Antelop'], difficulty: 'easy', category: 'Hewan', facts: 'Cheetah mampu berlari sangat cepat dalam akselerasi singkat.' },
  { question: 'Apa nama kelompok gajah?', correct_answer: 'Kawanan', incorrect_answers: ['Koloni', 'Gerombolan', 'Kawanan kawanan'], difficulty: 'medium', category: 'Hewan', facts: 'Gajah hidup dalam kelompok keluarga yang biasanya dipimpin oleh betina tertua.' },
  { question: 'Hewan apa yang memiliki sidik jari mirip manusia?', correct_answer: 'Koala', incorrect_answers: ['Panda', 'Kanguru', 'Wombat'], difficulty: 'medium', category: 'Hewan', facts: 'Sidik jari koala sangat mirip dengan sidik jari manusia dan sulit dibedakan sekilas.' },
];

const DEMO_KULINER: DemoRow[] = [
  { question: 'Sushi berasal dari negara mana?', correct_answer: 'Jepang', incorrect_answers: ['Korea Selatan', 'Thailand', 'Tiongkok'], difficulty: 'easy', category: 'Kuliner', facts: 'Sushi menggabungkan nasi berbumbu cuka dengan berbagai bahan seperti ikan dan sayuran.' },
  { question: 'Bahan utama guacamole adalah?', correct_answer: 'Alpukat', incorrect_answers: ['Tomat', 'Kacang merah', 'Kentang'], difficulty: 'easy', category: 'Kuliner', facts: 'Guacamole adalah saus berbahan dasar alpukat yang berasal dari Meksiko.' },
  { question: 'Rempah apa yang memberi warna kuning khas pada banyak masakan?', correct_answer: 'Kunyit', incorrect_answers: ['Kayu manis', 'Lada hitam', 'Cengkih'], difficulty: 'easy', category: 'Kuliner', facts: 'Kurkumin dalam kunyit memberi warna kuning-oranye yang kuat.' },
  { question: 'Pasta berbentuk pita lebar yang sering disajikan dengan saus kental disebut?', correct_answer: 'Fettuccine', incorrect_answers: ['Penne', 'Fusilli', 'Orzo'], difficulty: 'medium', category: 'Kuliner', facts: 'Fettuccine berarti “pita kecil” dalam bahasa Italia.' },
  { question: 'Kimchi adalah makanan fermentasi yang berasal dari?', correct_answer: 'Korea', incorrect_answers: ['Jepang', 'Vietnam', 'India'], difficulty: 'easy', category: 'Kuliner', facts: 'Kimchi biasanya dibuat dari sayuran yang difermentasi dengan bumbu.' },
];

const DEMO_MITOS: DemoRow[] = [
  { question: 'Air mendidih pada 100°C pada tekanan atmosfer standar.', correct_answer: 'Benar', incorrect_answers: ['Salah'], difficulty: 'easy', category: 'Sains', facts: 'Pada tekanan 1 atmosfer, air memang mendidih tepat di 100°C.' },
  { question: 'Manusia hanya menggunakan 10% dari otaknya.', correct_answer: 'Salah', incorrect_answers: ['Benar'], difficulty: 'easy', category: 'Mitos', facts: 'Pencitraan otak menunjukkan hampir seluruh area otak aktif, meski tidak semuanya sekaligus.' },
  { question: 'Cumi-cumi memiliki tiga jantung.', correct_answer: 'Benar', incorrect_answers: ['Salah'], difficulty: 'medium', category: 'Sains', facts: 'Dua jantung insang memompa darah ke insang, satu jantung utama memompa ke seluruh tubuh.' },
  { question: 'Petir tidak pernah menyambar tempat yang sama dua kali.', correct_answer: 'Salah', incorrect_answers: ['Benar'], difficulty: 'easy', category: 'Mitos', facts: 'Bangunan tinggi seperti Menara Empire State bisa tersambar petir puluhan kali setiap tahun.' },
  { question: 'Madu murni tidak mudah basi.', correct_answer: 'Benar', incorrect_answers: ['Salah'], difficulty: 'medium', category: 'Sains', facts: 'Kadar air rendah dan keasaman tinggi membuat bakteri sulit berkembang di madu murni.' },
  { question: 'Bumi lebih dekat ke Matahari saat musim panas.', correct_answer: 'Salah', incorrect_answers: ['Benar'], difficulty: 'medium', category: 'Mitos', facts: 'Musim terjadi karena kemiringan sumbu Bumi, bukan karena jarak ke Matahari.' },
  { question: 'Kelelawar adalah mamalia.', correct_answer: 'Benar', incorrect_answers: ['Salah'], difficulty: 'easy', category: 'Sains', facts: 'Kelelawar melahirkan anak dan menyusui, sehingga termasuk mamalia.' },
  { question: 'Emas bisa larut dalam air biasa.', correct_answer: 'Salah', incorrect_answers: ['Benar'], difficulty: 'medium', category: 'Mitos', facts: 'Emas sangat inert dan tidak larut dalam air; hanya larutan kimia tertentu seperti aqua regia yang bisa melarutkannya.' },
  { question: 'Suara tidak bisa merambat di ruang hampa.', correct_answer: 'Benar', incorrect_answers: ['Salah'], difficulty: 'easy', category: 'Sains', facts: 'Suara membutuhkan medium seperti udara, air, atau benda padat untuk merambat.' },
  { question: 'Bulu merak jantan digunakan untuk menarik perhatian betina.', correct_answer: 'Benar', incorrect_answers: ['Salah'], difficulty: 'easy', category: 'Sains', facts: 'Merak jantan mengembangkan bulunya dalam tarian untuk menunjukkan kualitas genetik.' },
];

function fallbackData(topic: string, mode: GameMode): DemoRow[] {
  const key = String(topic || '').toUpperCase();
  if (key === 'BENDERA' || mode === 'image') return DEMO_FLAGS;
  if (key === 'MITOS' || mode === 'truefalse') return DEMO_MITOS;
  if (key === 'SEJARAH') return DEMO_SEJARAH;
  if (key === 'SAINS') return DEMO_SAINS;
  if (key === 'TEKNOLOGI') return DEMO_TEKNOLOGI;
  if (key === 'OLAHRAGA') return DEMO_OLAHRAGA;
  if (key === 'HEWAN') return DEMO_HEWAN;
  if (key === 'KULINER') return DEMO_KULINER;
  return DEMO_DUNIA;
}

export async function fetchTriviaQuestions(
  topic: string,
  mode: GameMode,
  lang: string,
  apiUrl: string,
  total = 10,
): Promise<{ list: GameQuestion[]; fallback: boolean }> {
  const wanted = Math.max(1, Math.min(30, Math.round(total) || 10));
  const params = new URLSearchParams({ mode, lang, topic });
  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const results = extractResults(json);
    if (!results?.length) throw new Error('Format respons kosong');
    return {
      list: results.slice(0, wanted).map((row) => normalizeQuestion(row, mode)),
      fallback: false,
    };
  } catch (err) {
    console.warn('Games webhook gagal, pakai data demo:', err);
    return {
      list: fallbackData(topic, mode).slice(0, wanted).map((row) => normalizeQuestion(row, mode)),
      fallback: true,
    };
  }
}

/* ============ TEXT / VOTE HELPERS ============ */

export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function isAnswerCorrect(q: GameQuestion, text: string): boolean {
  const t = normalizeText(text);
  const answer = normalizeText(q.correct);
  if (!t) return false;
  if (q.type !== 'image' && q.options.length) {
    const idx = q.options.findIndex((o) => normalizeText(o) === answer);
    if (idx >= 0 && t === 'abcd'[idx]) return true;
  }
  if (t === answer) return true;
  return answer.length >= 4 && levenshtein(t, answer) <= Math.max(1, Math.floor(answer.length * 0.2));
}

export function voteIndexFor(q: GameQuestion, text: string): number {
  if (!q.options?.length) return -1;
  const t = normalizeText(text);
  if (!t) return -1;
  if (t.length === 1 && 'abcd'.includes(t)) {
    const i = 'abcd'.indexOf(t);
    return i < q.options.length ? i : -1;
  }
  const opts = q.options.map((o) => normalizeText(o));
  const exact = opts.indexOf(t);
  if (exact >= 0) return exact;
  let best = -1;
  let bestDistance = Infinity;
  opts.forEach((o, i) => {
    const d = levenshtein(t, o);
    const limit = Math.max(1, Math.floor(o.length * 0.2));
    if (d <= limit && d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}

export function voterPercents(q: GameQuestion, votes: number[]): number[] {
  const counts = q.options.map((_, i) => votes[i] || 0);
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const pcts = raw.map((v) => Math.floor(v));
  let rest = 100 - pcts.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (rest > 0) {
        pcts[i]++;
        rest--;
      }
    });
  return pcts;
}

export function correctGotMajority(q: GameQuestion, votes: number[]): boolean {
  if (!q.options?.length) return false;
  const idx = q.options.findIndex((o) => normalizeText(o) === normalizeText(q.correct));
  if (idx < 0) return false;
  const counts = q.options.map((_, i) => votes[i] || 0);
  const mine = counts[idx];
  if (!mine) return false;
  return counts.every((c, i) => i === idx || mine > c);
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

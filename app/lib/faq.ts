export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Apa itu Keluno?',
    a: 'Keluno adalah platform kontrol dan widget all-in-one untuk streamer. Kamu bisa mengontrol OBS Studio Mode / Scene Switcher langsung dari browser atau HP, serta menambahkan 14+ widget interaktif dan overlay real-time.',
  },
  {
    q: 'Bagaimana cara menghubungkan widget ke OBS?',
    a: 'Cukup salin URL Browser Source dari dashboard Keluno kamu, lalu tambahkan sumber "Browser" baru di scene OBS Studio. Widget langsung terhubung dan sinkron secara real-time via WebSocket.',
  },
  {
    q: 'Apa itu Private Key dan seberapa amannya?',
    a: 'Setiap streamer mendapatkan Private Key unik untuk isolasi room WebSocket privat. Ini menjamin data kontrol dock, chat, dan overlay kamu terisolasi penuh dan tidak bisa diakses atau diintervensi oleh streamer lain.',
  },
  {
    q: 'Apakah Keluno gratis untuk digunakan?',
    a: 'Ya! Fitur inti Keluno gratis untuk memulai tanpa memerlukan kartu kredit. Kamu bisa langsung mengontrol scene, memakai widget chat, timer, poll, dan overlay bawaan.',
  },
  {
    q: 'Platform streaming apa saja yang didukung?',
    a: 'Keluno mendukung integrasi multi-platform termasuk Twitch, YouTube Live, dan TikTok LIVE untuk interaksi chat, event gift/like/follow, serta animasi penonton.',
  },
  {
    q: 'Bagaimana cara menggunakan Mobile Dock di smartphone?',
    a: 'Cukup buka dashboard Keluno di browser smartphone kamu dan login ke akun yang sama. Antarmuka Mobile Dock responsif dan memungkinkanmu mengganti scene, trigger transisi, atau mute audio tanpa menyentuh PC.',
  },
  {
    q: 'Apakah Media Player mendukung sinkronisasi lirik otomatis?',
    a: 'Ya! Widget Media Player terintegrasi dengan LRCLIB dan SMTC Bridge di Windows. Lagu yang sedang diputar di Spotify atau Windows Media Player akan menampilkan synced lyrics baris demi baris di layar stream.',
  },
  {
    q: 'Bagaimana cara kustomisasi tema overlay dan widget?',
    a: 'Setiap widget memiliki konfigurasi visual lengkap di dashboard: warna solid, ukuran font, tata letak, border, sound alert, hingga posisi tanpa perlu menulis CSS manual.',
  },
  {
    q: 'Apakah Keluno membutuhkan instalasi plugin khusus di OBS?',
    a: 'Untuk overlay dan widget, hanya butuh Browser Source standar di OBS (tanpa plugin apapun). Untuk Dock Control penuh, OBS Studio versi 28 ke atas sudah memiliki OBS WebSocket bawaan yang langsung kompatibel.',
  },
  {
    q: 'Bagaimana jika saya mengalami kendala teknis?',
    a: 'Tersedia dokumentasi lengkap di dashboard serta halaman support di pojok kanan bawah. Kamu juga bisa bergabung ke komunitas streamer kami untuk bertanya dan berdiskusi.',
  },
];

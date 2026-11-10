import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Kebijakan Privasi - OBS Dock",
    description: "Kebijakan privasi OBS Dock: data yang dikumpulkan, login Google, pihak ketiga, dan hak pengguna.",
};

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
    return (
        <section className="border-b border-white/5 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
            <h2 className="text-white text-[15px] font-black tracking-tight flex items-baseline gap-2.5 mb-2.5">
                <span className="text-gray-500 text-[12px] font-black">{no}</span> {title}
            </h2>
            <div className="text-gray-400 text-[13px] leading-relaxed space-y-2.5">{children}</div>
        </section>
    );
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
                <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </Link>

                <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </span>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Kebijakan Privasi</h1>
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-1">Terakhir diperbarui: 15 Oktober 2026</p>
                    </div>
                </div>
                <p className="text-gray-400 text-[13px] leading-relaxed mb-8">
                    OBS Dock (“kami”) adalah panel kontrol dan overlay widget untuk streamer (OBS Studio, TikTok LIVE, Twitch, YouTube).
                    Kebijakan ini menjelaskan data apa yang kami kumpulkan, mengapa, dan hak kamu atas data tersebut.
                </p>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7">
                    <Section no="01" title="Data yang kami kumpulkan">
                        <p><span className="text-white font-bold">Data akun:</span> email, username, dan foto profil (jika ada) saat kamu mendaftar atau masuk, termasuk lewat Google.</p>
                        <p><span className="text-white font-bold">Data operasional stream:</span> status koneksi OBS & Streamer.bot, statistik sesi (viewer, follow, subs, gift, like, chat), isi widget (task, polling, antrean lagu + nama requester), serta pengaturan widget yang kamu simpan.</p>
                        <p><span className="text-white font-bold">Data teknis:</span> session login, preferensi tampilan, dan private key yang mengisolasi data tiap pengguna.</p>
                    </Section>

                    <Section no="02" title="Login dengan Google">
                        <p>Jika kamu masuk memakai akun Google, kami menerima profil dasar dari Google melalui Supabase Auth: <span className="text-white font-bold">nama, alamat email, dan foto profil</span>.</p>
                        <p>Kami <span className="text-white font-bold">tidak</span> meminta atau menyimpan akses ke Gmail, Google Drive, kontak, maupun data Google lainnya di luar profil dasar tersebut.</p>
                    </Section>

                    <Section no="03" title="Pihak ketiga yang memproses data">
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li><span className="text-white font-bold">Supabase</span>: autentikasi, database, dan penyimpanan akun/widget.</li>
                            <li><span className="text-white font-bold">Google</span>: login OAuth (profil dasar) dan YouTube Data API (pencarian lagu).</li>
                            <li><span className="text-white font-bold">lrclib.net</span>: pencarian lirik lagu berdasarkan judul.</li>
                            <li><span className="text-white font-bold">API Valorant & layanan MMR</span>: data rank publik berdasarkan Riot ID yang kamu masukkan.</li>
                            <li><span className="text-white font-bold">Platform streaming</span> (Twitch, YouTube, TikTok) dan <span className="text-white font-bold">Streamer.bot / OBS</span> milikmu, data live (chat, viewer, gift) yang kamu hubungkan sendiri.</li>
                        </ul>
                        <p>Kami tidak menjual data pribadi dan tidak menggunakannya untuk periklanan.</p>
                    </Section>

                    <Section no="04" title="Cookie & penyimpanan lokal">
                        <p>Kami memakai cookie session Supabase agar kamu tetap masuk, serta penyimpanan lokal di browser-mu (<code className="bg-white/10 px-1 rounded text-white">obs-login</code>, pengaturan widget, private key mode guest) agar panel dan overlay berfungsi. Data ini tersimpan di perangkatmu dan bisa dihapus kapan saja lewat pengaturan browser.</p>
                    </Section>

                    <Section no="05" title="Keamanan">
                        <p>Data tiap pengguna diisolasi memakai private key dan aturan akses database (RLS). Meski begitu, tidak ada sistem yang 100% aman. <span className="text-white font-bold">Jangan bagikan private key</span> kamu ke siapa pun, karena key tersebut memberi kontrol penuh atas dock dan overlay-mu.</p>
                    </Section>

                    <Section no="06" title="Hak kamu">
                        <p>Kamu bisa kapan saja: melihat dan memperbarui data akun di halaman Akun, mengekspor pengaturan widget (tersimpan di browser/URL), serta meminta penghapusan akun beserta seluruh data terkait dengan menghubungi admin. Hapus akun berarti seluruh widget, statistik, dan private key ikut terhapus permanen.</p>
                    </Section>

                    <Section no="07" title="Retensi data">
                        <p>Data akun dan widget disimpan selama akunmu aktif. Statistik sesi live hanya dipakai saat sesi berjalan. Jika akun dihapus atau tidak aktif dalam waktu lama, data terkait akan dihapus.</p>
                    </Section>

                    <Section no="08" title="Perubahan & kontak">
                        <p>Jika kebijakan ini berubah secara material, kami umumkan lewat dashboard. Penggunaan layanan setelah perubahan berarti kamu menyetujuinya. Pertanyaan soal privasi: hubungi admin melalui kanal komunitas resmi kami.</p>
                    </Section>
                </div>

                <div className="flex flex-wrap gap-2 mt-8">
                    <Link href="/terms" className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center transition-colors">Syarat & Ketentuan</Link>
                    <Link href="/register" className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest flex items-center transition-colors">Buat Akun</Link>
                </div>
            </div>
        </div>
    );
}

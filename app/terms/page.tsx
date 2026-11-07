import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
    title: "Syarat & Ketentuan - OBS Dock",
    description: "Syarat dan ketentuan penggunaan OBS Dock: akun, penggunaan wajar, dan batasan layanan.",
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

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
                <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </Link>

                <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                        <FileText className="w-5 h-5 text-white" />
                    </span>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Syarat & Ketentuan</h1>
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-1">Terakhir diperbarui: 15 Oktober 2026</p>
                    </div>
                </div>
                <p className="text-gray-400 text-[13px] leading-relaxed mb-8">
                    Dengan membuat akun, masuk (termasuk lewat Google), atau memakai OBS Dock, kamu menyetujui syarat di bawah ini.
                    Jika tidak setuju, jangan gunakan layanan.
                </p>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7">
                    <Section no="01" title="Layanan">
                        <p>OBS Dock adalah panel kontrol stream dan overlay widget (chat, polling, task, timer, musik, rank Valorant, dsb.) yang tampil sebagai browser source di OBS / Streamlabs dan dikendalikan dari dock web atau mobile.</p>
                    </Section>

                    <Section no="02" title="Akun">
                        <p>Kamu wajib memakai email valid dan menjaga kerahasiaan kredensialmu. Satu akun untuk satu streamer; kamu bertanggung jawab penuh atas seluruh aktivitas yang terjadi lewat akunmu, termasuk lewat mode guest yang kamu buat.</p>
                        <p><span className="text-white font-bold">Private key</span> adalah kunci kontrol dock dan overlay-mu. Jangan dibagikan ke siapa pun. Kami tidak bertanggung jawab atas penyalahgunaan akibat key yang bocor.</p>
                    </Section>

                    <Section no="03" title="Penggunaan yang dilarang">
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>Menampilkan konten ilegal, pornografi, ujaran kebencian, atau yang melanggar aturan platform (Twitch, YouTube, TikTok) lewat overlay.</li>
                            <li>Menyalahgunakan backend (spam request, scraping agresif, membebani API pencarian lagu/lirik/rank) hingga mengganggu pengguna lain.</li>
                            <li>Mencoba mengakses data pengguna lain, mengakali isolasi private key, atau mengeksploitasi celah keamanan. Temuan bug harap dilaporkan ke admin.</li>
                            <li>Mengatasnamakan OBS Dock atau menjual kembali akses layanan tanpa izin.</li>
                        </ul>
                    </Section>

                    <Section no="04" title="Kontenmu, tanggung jawabmu">
                        <p>Seluruh teks, lagu, gambar, dan data yang kamu masukkan ke widget adalah tanggung jawabmu, termasuk kepatuhan terhadap hak cipta (mis. lirik dan musik) dan aturan komunitas tiap platform streaming.</p>
                    </Section>

                    <Section no="05" title="Layanan pihak ketiga">
                        <p>Beberapa fitur bergantung pada layanan eksternal (Supabase, Google, YouTube API, lrclib, API rank Valorant, Streamer.bot, platform live). Jika layanan tersebut berubah, dibatasi, atau mati, fitur terkait bisa terganggu tanpa pemberitahuan, itu di luar kendali kami.</p>
                    </Section>

                    <Section no="06" title="Ketersediaan & garansi">
                        <p>Layanan diberikan “apa adanya” (as-is). Kami berusaha menjaga uptime dan data, tetapi tidak menjamin layanan bebas gangguan, bebas bug, atau bahwa data tidak pernah hilang. Lakukan pencadangan mandiri untuk hal penting (mis. daftar task dan konfigurasi widget).</p>
                    </Section>

                    <Section no="07" title="Batasan tanggung jawab">
                        <p>Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung, termasuk putusnya stream, hilangnya donasi/pendapatan, atau teguran platform, akibat penggunaan atau gangguan layanan.</p>
                    </Section>

                    <Section no="08" title="Penghentian">
                        <p>Kami dapat menangguhkan atau menghapus akun yang melanggar syarat ini, dengan atau tanpa pemberitahuan. Kamu bisa berhenti kapan saja dengan tidak memakai layanan dan meminta penghapusan akun via halaman Akun atau admin.</p>
                    </Section>

                    <Section no="09" title="Perubahan syarat">
                        <p>Syarat ini bisa diperbarui mengikuti perkembangan fitur dan ketentuan hukum. Perubahan material diumumkan lewat dashboard; pemakaian lanjutan setelah itu dianggap persetujuan. Pertanyaan: hubungi admin lewat kanal komunitas resmi kami.</p>
                    </Section>
                </div>

                <div className="flex flex-wrap gap-2 mt-8">
                    <Link href="/privacy" className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center transition-colors">Kebijakan Privasi</Link>
                    <Link href="/register" className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest flex items-center transition-colors">Buat Akun</Link>
                </div>
            </div>
        </div>
    );
}

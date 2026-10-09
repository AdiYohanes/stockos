import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper p-4 sm:p-6">
      <div className="flex flex-col items-center text-center border-[3px] border-ink bg-white p-6 sm:p-10 shadow-hard-lg max-w-md w-full">
        <div className="flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-acid/20 text-ink shadow-hard-sm mb-4">
          <FileQuestion className="h-7 w-7" />
        </div>

        <div className="font-display font-[900] text-6xl sm:text-7xl tracking-tighter text-ink mb-2">
          404
        </div>

        <h1 className="font-display font-bold text-lg uppercase tracking-wider text-ink mb-2">
          Halaman Tidak Ditemukan
        </h1>

        <p className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-6">
          Rute yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>

        <Link
          href="/"
          className="press inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-acid px-6 py-3 font-display text-xs font-[900] uppercase tracking-wider text-ink shadow-hard-sm hover:brightness-105 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

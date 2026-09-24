import React, { useState } from 'react';
import { Download, Maximize2, Check, Copy, ExternalLink, ShieldCheck, Sparkles, Smartphone, QrCode } from 'lucide-react';
import { getDynamicQrisImageUrl, getQrisSettings } from '../services/adminService';

interface OfficialQrisCardProps {
  amount?: number;
  showAmountBadge?: boolean;
  className?: string;
  allowZoom?: boolean;
  compact?: boolean;
}

export default function OfficialQrisCard({
  amount = 0,
  showAmountBadge = true,
  className = '',
  allowZoom = true,
  compact = false
}: OfficialQrisCardProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedNmid, setCopiedNmid] = useState(false);
  const [copiedNorek, setCopiedNorek] = useState(false);

  const qris = getQrisSettings();
  const dynamicQrUrl = amount > 0 ? getDynamicQrisImageUrl(amount) : qris.imageUrl;

  const nmid = qris.nmid || 'ID1025401239294';
  const subCode = qris.subCode || 'A01';
  const printedBy = qris.printedBy || '93600112';
  const printVersion = qris.printVersion || '1.0-2025.05.06';
  const merchantName = qris.accountName?.includes('TRIYANTO') ? 'ZEGAN HOMESTAY' : (qris.accountName || 'ZEGAN HOMESTAY');
  const accountNumber = qris.accountNumber || '003.211.005851';
  const accountHolder = 'TRIYANTO RAHARJO, S.Sos., M.Si.';
  const bankBranch = qris.bankBranch || '[003] Cabang Wates';

  const handleCopyNmid = () => {
    navigator.clipboard.writeText(nmid);
    setCopiedNmid(true);
    setTimeout(() => setCopiedNmid(false), 2000);
  };

  const handleCopyNorek = () => {
    navigator.clipboard.writeText('003211005851');
    setCopiedNorek(true);
    setTimeout(() => setCopiedNorek(false), 2000);
  };

  const handleCopyAmount = () => {
    if (amount > 0) {
      navigator.clipboard.writeText(Math.round(amount).toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Official Standee Container */}
      <div 
        className={`relative bg-white text-stone-900 border border-stone-200/90 rounded-2xl shadow-md overflow-hidden transition-all duration-200 w-full ${
          compact ? 'max-w-xs p-3.5 sm:p-4' : 'max-w-sm p-4 sm:p-5'
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 100% 0%, rgba(220, 38, 38, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 0% 100%, rgba(220, 38, 38, 0.04) 0%, transparent 40%)
          `
        }}
      >
        {/* Corner Red Accent Triangles / Geometric Marks */}
        <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none overflow-hidden">
          <div className="w-4 h-4 bg-red-600 transform -rotate-45 -translate-x-2 -translate-y-2"></div>
        </div>

        {/* 1. Official Header (QRIS on Left, GPN on Right) */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-150 pb-2.5 mb-2.5">
          {/* QRIS Logo */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              <span className="font-black text-xl tracking-tighter text-black font-sans leading-none">
                QR<span className="text-red-600">I</span>S
              </span>
            </div>
            <div className="leading-tight pl-1 border-l border-stone-300">
              <div className="text-[7.5px] font-bold text-stone-800 uppercase tracking-tighter">QR Code Standar</div>
              <div className="text-[7px] font-bold text-stone-600 uppercase tracking-tighter">Pembayaran Nasional</div>
            </div>
          </div>

          {/* GPN Logo */}
          <div className="flex items-center gap-1">
            <div className="w-5 h-4 flex items-center justify-center">
              {/* Stylized Red Eagle Wing */}
              <svg viewBox="0 0 24 20" className="w-full h-full fill-red-600" aria-label="GPN Logo">
                <path d="M0 16 C6 14, 12 8, 14 0 C13 7, 16 9, 24 7 C18 12, 12 18, 0 16 Z" />
                <path d="M4 18 C10 16, 16 12, 19 6 C17 11, 20 13, 24 12 C19 16, 14 20, 4 18 Z" opacity="0.75" />
              </svg>
            </div>
            <span className="font-black text-[13px] tracking-tight text-blue-950 font-sans leading-none">
              GPN
            </span>
          </div>
        </div>

        {/* 2. Merchant Name, NMID, Subcode */}
        <div className="text-center my-2">
          <h3 className="font-extrabold text-stone-950 tracking-wider text-sm sm:text-base font-sans uppercase">
            {merchantName}
          </h3>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-[10px] font-mono font-medium text-stone-600 tracking-wider">
              NMID : {nmid}
            </span>
            <button
              type="button"
              onClick={handleCopyNmid}
              className="text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
              title="Salin NMID"
            >
              {copiedNmid ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
          </div>
          <div className="text-[9.5px] font-mono font-bold text-stone-700 tracking-widest mt-0.5">
            {subCode}
          </div>
        </div>

        {/* Optional Locked Amount Badge */}
        {showAmountBadge && amount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg py-1 px-2.5 text-center my-1.5 flex items-center justify-between gap-1 shadow-2xs">
            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Nominal Terkunci Otomatis</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono font-extrabold text-emerald-950">
                Rp{Math.round(amount).toLocaleString('id-ID')}
              </span>
              <button
                type="button"
                onClick={handleCopyAmount}
                className="text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                title="Salin Nominal"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* 3. The Central QR Code Box with Authentic Watermark Frame */}
        <div className="relative my-2.5 flex justify-center items-center">
          <div className="p-2.5 bg-white rounded-xl border border-stone-250 shadow-inner inline-block relative group">
            <img
              src={dynamicQrUrl}
              alt={`QRIS ${merchantName}`}
              className={`${compact ? 'w-44 h-44' : 'w-52 h-52 sm:w-56 sm:h-56'} object-contain block`}
              referrerPolicy="no-referrer"
            />

            {allowZoom && (
              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer"
                title="Perbesar Tampilan QRIS Penuh"
              >
                <div className="bg-white/95 text-stone-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 border border-stone-200">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Perbesar Layar Penuh</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 4. Tagline Under QR */}
        <div className="text-center my-1.5">
          <p className="font-extrabold text-[11px] sm:text-xs text-stone-900 tracking-wider uppercase font-sans">
            SATU QRIS UNTUK SEMUA
          </p>
          <p className="text-[8px] sm:text-[8.5px] text-stone-500 font-medium tracking-tight">
            Cek aplikasi penyelenggara di: <span className="font-semibold text-stone-700">www.aspi-qris.id</span>
          </p>
        </div>

        {/* 5. Authentic Footer (Print Meta on Left & Red Steps on Right) */}
        <div className="relative mt-3 pt-2 border-t border-stone-150 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Print Metadata */}
          <div className="text-[7.5px] sm:text-[8px] text-stone-500 font-mono text-center sm:text-left leading-tight">
            <div>Dicetak oleh : <span className="font-bold text-stone-700">{printedBy}</span></div>
            <div>Versi Cetak : <span className="font-bold text-stone-700">{printVersion}</span></div>
          </div>

          {/* Red Pill: Cara Bayar dengan QRIS */}
          <div className="bg-red-600 text-white rounded-xl py-1 px-2.5 flex items-center gap-2 shadow-2xs">
            <span className="text-[7px] font-bold uppercase tracking-tight block leading-none pr-1 border-r border-red-400">
              Cara Bayar<br />dengan QRIS:
            </span>
            <div className="flex items-center gap-2 text-[6.5px] font-medium leading-none">
              <div className="flex flex-col items-center gap-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-white text-red-600 font-bold flex items-center justify-center text-[7px]">1</span>
                <span className="text-[6px] opacity-90 text-center">Buka App</span>
              </div>
              <span className="text-red-300">&rarr;</span>
              <div className="flex flex-col items-center gap-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-white text-red-600 font-bold flex items-center justify-center text-[7px]">2</span>
                <span className="text-[6px] opacity-90 text-center">Scan & Cek</span>
              </div>
              <span className="text-red-300">&rarr;</span>
              <div className="flex flex-col items-center gap-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-white text-red-600 font-bold flex items-center justify-center text-[7px]">3</span>
                <span className="text-[6px] opacity-90 text-center">Bayar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Zoom Trigger / Download */}
        {allowZoom && (
          <div className="mt-3 pt-2 border-t border-dashed border-stone-200 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="text-stone-600 hover:text-brand-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3 h-3 text-stone-500" />
              <span>Lihat Standee Penuh</span>
            </button>
            <a
              href={dynamicQrUrl}
              target="_blank"
              rel="noreferrer"
              download={`QRIS-${merchantName}.png`}
              className="text-brand-800 hover:text-brand-950 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Unduh QR</span>
            </a>
          </div>
        )}
      </div>

      {/* FULLSCREEN POPUP MODAL FOR OFFICIAL QRIS STANDEE */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative bg-white text-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 my-8 border border-stone-200">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <span className="text-base font-bold">&times;</span>
            </button>

            {/* Standee Content in Full Glory */}
            <div className="border border-stone-200 rounded-2xl p-5 bg-gradient-to-b from-stone-50/50 to-white shadow-inner">
              {/* Standee Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-2xl tracking-tighter text-black font-sans leading-none">
                    QR<span className="text-red-600">I</span>S
                  </span>
                  <div className="leading-tight pl-1.5 border-l border-stone-300">
                    <div className="text-[8px] font-bold text-stone-800 uppercase tracking-tighter">QR Code Standar</div>
                    <div className="text-[7.5px] font-bold text-stone-600 uppercase tracking-tighter">Pembayaran Nasional</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="w-6 h-5">
                    <svg viewBox="0 0 24 20" className="w-full h-full fill-red-600">
                      <path d="M0 16 C6 14, 12 8, 14 0 C13 7, 16 9, 24 7 C18 12, 12 18, 0 16 Z" />
                      <path d="M4 18 C10 16, 16 12, 19 6 C17 11, 20 13, 24 12 C19 16, 14 20, 4 18 Z" opacity="0.75" />
                    </svg>
                  </div>
                  <span className="font-black text-base tracking-tight text-blue-950 font-sans leading-none">
                    GPN
                  </span>
                </div>
              </div>

              {/* Merchant Title */}
              <div className="text-center my-2">
                <h3 className="font-extrabold text-stone-950 tracking-wider text-base sm:text-lg uppercase">
                  {merchantName}
                </h3>
                <p className="text-[11px] font-mono font-medium text-stone-600 tracking-wider mt-0.5">
                  NMID : {nmid}
                </p>
                <p className="text-[10px] font-mono font-bold text-stone-700 tracking-widest mt-0.5">
                  {subCode}
                </p>
              </div>

              {/* Amount reminder */}
              {amount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-2 text-center my-2">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Tagihan Pembayaran:</div>
                  <div className="text-base font-mono font-black text-emerald-950">
                    Rp{Math.round(amount).toLocaleString('id-ID')}
                  </div>
                </div>
              )}

              {/* Large QR Code */}
              <div className="flex justify-center p-3 my-2 bg-white rounded-xl border border-stone-200 shadow-sm">
                <img
                  src={dynamicQrUrl}
                  alt={`QRIS ${merchantName}`}
                  className="w-64 h-64 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Under Tagline */}
              <div className="text-center my-2">
                <p className="font-extrabold text-xs text-stone-900 tracking-wider uppercase">
                  SATU QRIS UNTUK SEMUA
                </p>
                <p className="text-[9px] text-stone-500 font-medium">
                  Cek aplikasi penyelenggara di: <span className="font-bold text-stone-700">www.aspi-qris.id</span>
                </p>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[8px] text-stone-500">
                <div>
                  <div>Dicetak oleh : <span className="font-bold text-stone-700">{printedBy}</span></div>
                  <div>Versi Cetak : <span className="font-bold text-stone-700">{printVersion}</span></div>
                </div>
                <div className="bg-red-600 text-white rounded-lg py-1 px-2 text-[7px] font-bold">
                  Buka App &rarr; Scan & Cek &rarr; Bayar
                </div>
              </div>
            </div>

            {/* Bank Transfer Alternative inside Modal */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>🏦</span>
                  <span>Alternatif Transfer: Bank BPD DIY</span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium">{bankBranch}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-stone-200">
                <div>
                  <div className="font-mono font-black text-stone-900 text-sm tracking-wider">
                    {accountNumber}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                    a/n {accountHolder}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNorek}
                  className="px-2.5 py-1 bg-brand-700 hover:bg-brand-850 text-white rounded-md text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  {copiedNorek ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedNorek ? 'Tersalin' : 'Salin Rek'}</span>
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <a
                href={dynamicQrUrl}
                target="_blank"
                rel="noreferrer"
                download={`QRIS-${merchantName}.png`}
                className="flex-1 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar QRIS</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

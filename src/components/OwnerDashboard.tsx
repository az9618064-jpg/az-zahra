import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Smartphone, CheckCircle2, 
  Calendar, Wrench, PieChart as PieChartIcon, Users, Filter, 
  ArrowUpRight, ArrowDownRight, Layers, Clock, ShieldCheck, ChevronRight,
  EyeOff
} from 'lucide-react';
import { ServiceOrder, FinancialTransaction, UserAccount, SecuritySettings, UserRole } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface OwnerDashboardProps {
  orders: ServiceOrder[];
  transactions: FinancialTransaction[];
  users: UserAccount[];
  onShowToast?: (msg: string) => void;
  securitySettings?: SecuritySettings;
  currentRole?: UserRole;
}

type PeriodFilter = 'all' | 'today' | 'month' | 'custom';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
  sublabel?: string;
}

// Reusable SVG Donut Chart Component with High Contrast & Hover Feedback
const ResponsiveDonutChart: React.FC<{
  title: string;
  subtitle: string;
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
  centerColor?: string;
}> = ({ title, subtitle, segments, centerLabel, centerValue, centerColor = 'text-blue-900 dark:text-blue-400' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = useMemo(() => {
    return segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  }, [segments]);

  // Radius and circumference
  const radius = 62;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
            <PieChartIcon className="w-4 h-4 text-blue-700" />
            {title}
          </h4>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          {subtitle}
        </p>

        {/* SVG Circle Canvas */}
        <div className="relative flex items-center justify-center py-2">
          {total === 0 ? (
            <div className="w-44 h-44 rounded-full border-4 border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-center text-center p-4">
              <span className="text-xs text-stone-400 font-semibold">Belum ada data pada periode ini</span>
            </div>
          ) : (
            <div className="relative w-52 h-52 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-stone-100 dark:stroke-stone-700/50"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />

                {/* Data Segments */}
                {segments.map((seg, idx) => {
                  if (seg.value <= 0) return null;
                  const fraction = seg.value / total;
                  const strokeDasharray = `${fraction * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedAngle * circumference;
                  accumulatedAngle += fraction;

                  const isHovered = hoveredIndex === idx;

                  return (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        transformOrigin: '50% 50%',
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Hole Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {hoveredIndex !== null ? segments[hoveredIndex].label : centerLabel}
                </span>
                <span className={`text-base sm:text-lg font-black tracking-tight leading-none mt-0.5 ${centerColor}`}>
                  {hoveredIndex !== null ? (segments[hoveredIndex].formattedValue || segments[hoveredIndex].value) : centerValue}
                </span>
                {hoveredIndex !== null && (
                  <span className="text-[10px] font-bold text-stone-500 mt-0.5">
                    {((segments[hoveredIndex].value / total) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-700/60 space-y-2">
        {segments.map((seg, idx) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0';
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between text-xs p-1.5 rounded-xl transition-all cursor-pointer ${
                isHovered ? 'bg-stone-100 dark:bg-stone-700/60 font-bold' : 'hover:bg-stone-50 dark:hover:bg-stone-700/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate text-stone-800 dark:text-stone-200">
                  {seg.label}
                </span>
              </div>
              <div className="text-right shrink-0 font-mono flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-white">
                  {seg.formattedValue || seg.value}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  orders,
  transactions,
  users,
  securitySettings,
  currentRole = 'owner'
}) => {
  // Filter state
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const currentYearMonth = now.toISOString().substring(0, 7); // YYYY-MM

    const filterByDate = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = dateStr.substring(0, 10);

      if (period === 'today') {
        return d === todayStr;
      }
      if (period === 'month') {
        return d.startsWith(currentYearMonth);
      }
      if (period === 'custom') {
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      }
      return true; // 'all'
    };

    const fOrders = orders.filter(o => filterByDate(o.receivedDate) || (o.outDate && filterByDate(o.outDate)));
    const fTransactions = transactions.filter(t => filterByDate(t.date));

    return {
      orders: fOrders,
      transactions: fTransactions
    };
  }, [orders, transactions, period, startDate, endDate]);

  // Financial Metrics Calculation
  const financialMetrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let serviceIncome = 0;
    let partSalesIncome = 0;
    let partPurchaseExpense = 0;
    let operationalExpense = 0;
    let salaryExpense = 0;

    filteredData.transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.category === 'service_fee') serviceIncome += t.amount;
        else if (t.category === 'sparepart_sale') partSalesIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (t.category === 'sparepart_purchase') partPurchaseExpense += t.amount;
        else if (t.category === 'operational') operationalExpense += t.amount;
        else if (t.category === 'salary') salaryExpense += t.amount;
      }
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      serviceIncome,
      partSalesIncome,
      partPurchaseExpense,
      operationalExpense,
      salaryExpense
    };
  }, [filteredData.transactions]);

  // Order Metrics Calculation
  const orderMetrics = useMemo(() => {
    const total = filteredData.orders.length;
    const selesaiOrKeluar = filteredData.orders.filter(o => o.status === 'selesai' || o.status === 'keluar').length;
    const dalamProses = filteredData.orders.filter(o => ['pengecekan', 'pengerjaan', 'tunggu_part'].includes(o.status)).length;
    const diterima = filteredData.orders.filter(o => o.status === 'diterima').length;
    const dibatalkan = filteredData.orders.filter(o => o.status === 'dibatalkan').length;

    const completionRate = total > 0 ? (selesaiOrKeluar / total) * 100 : 0;

    return {
      total,
      selesaiOrKeluar,
      dalamProses,
      diterima,
      dibatalkan,
      completionRate
    };
  }, [filteredData.orders]);

  // 1. Chart Data: Arus Keuangan (Finansial Breakdown)
  const financialSegments: DonutSegment[] = useMemo(() => {
    const segments: DonutSegment[] = [
      {
        label: 'Jasa Servis HP',
        value: financialMetrics.serviceIncome,
        color: '#1d4ed8', // Biru AZ-ZAHRA
        formattedValue: formatRupiah(financialMetrics.serviceIncome)
      },
      {
        label: 'Penjualan Sparepart / Aksesoris',
        value: financialMetrics.partSalesIncome,
        color: '#0284c7', // Sky Blue
        formattedValue: formatRupiah(financialMetrics.partSalesIncome)
      },
      {
        label: 'Belanja Stok Sparepart',
        value: financialMetrics.partPurchaseExpense,
        color: '#dc2626', // Merah
        formattedValue: formatRupiah(financialMetrics.partPurchaseExpense)
      },
      {
        label: 'Biaya Operasional & Lainnya',
        value: financialMetrics.operationalExpense + financialMetrics.salaryExpense,
        color: '#eab308', // Kuning/Gold
        formattedValue: formatRupiah(financialMetrics.operationalExpense + financialMetrics.salaryExpense)
      }
    ];
    return segments.filter(s => s.value > 0);
  }, [financialMetrics]);

  // 2. Chart Data: Status Unit Servis
  const statusSegments: DonutSegment[] = useMemo(() => {
    const counts: Record<string, number> = {
      diterima: 0,
      pengecekan: 0,
      pengerjaan: 0,
      tunggu_part: 0,
      selesai: 0,
      keluar: 0,
      dibatalkan: 0
    };

    filteredData.orders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });

    const segments: DonutSegment[] = [
      {
        label: 'Selesai & Keluar (Lunas)',
        value: (counts.selesai || 0) + (counts.keluar || 0),
        color: '#16a34a', // Hijau Sukses
        formattedValue: `${(counts.selesai || 0) + (counts.keluar || 0)} Unit`
      },
      {
        label: 'Pengerjaan & Pengecekan',
        value: (counts.pengerjaan || 0) + (counts.pengecekan || 0),
        color: '#1d4ed8', // Biru
        formattedValue: `${(counts.pengerjaan || 0) + (counts.pengecekan || 0)} Unit`
      },
      {
        label: 'Menunggu Sparepart',
        value: counts.tunggu_part || 0,
        color: '#eab308', // Kuning
        formattedValue: `${counts.tunggu_part || 0} Unit`
      },
      {
        label: 'Unit Baru Diterima',
        value: counts.diterima || 0,
        color: '#0284c7', // Biru Muda
        formattedValue: `${counts.diterima || 0} Unit`
      },
      {
        label: 'Dibatalkan',
        value: counts.dibatalkan || 0,
        color: '#dc2626', // Merah
        formattedValue: `${counts.dibatalkan || 0} Unit`
      }
    ];

    return segments.filter(s => s.value > 0);
  }, [filteredData.orders]);

  // 3. Chart Data: Kinerja Teknisi (Unit Selesai & Omset Teknisi)
  const technicianSegments: DonutSegment[] = useMemo(() => {
    const techMap: Record<string, { count: number; totalRev: number }> = {};

    filteredData.orders.forEach(o => {
      const tech = o.technicianName || 'Belum Ditugaskan';
      if (!techMap[tech]) {
        techMap[tech] = { count: 0, totalRev: 0 };
      }
      techMap[tech].count++;
      techMap[tech].totalRev += o.totalCost || o.estimatedCost || 0;
    });

    const colors = ['#1d4ed8', '#eab308', '#dc2626', '#16a34a', '#8b5cf6', '#06b6d4'];

    return Object.entries(techMap).map(([name, data], idx) => ({
      label: name,
      value: data.count,
      color: colors[idx % colors.length],
      formattedValue: `${data.count} Unit (${formatRupiah(data.totalRev)})`
    }));
  }, [filteredData.orders]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* HEADER BANNER OWNER: Biru Dominan dengan Aksen Kuning & Merah */}
      <div className="bg-blue-800 border-2 border-blue-700 text-white p-6 sm:p-7 rounded-3xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-stone-950 font-black rounded-full text-xs uppercase tracking-wider shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Statistik Eksekutif Owner
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Executive Business Overview AZ-ZAHRA SERVICE
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Analisis komprehensif omset pemasukan, pengeluaran modal sparepart, laba bersih aktual, serta produktivitas teknisi pengerjaan smartphone pelanggan.
            </p>
          </div>

          {/* FILTER PERIODE WAKTU */}
          <div className="bg-blue-900/90 border border-blue-600/70 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2.5 self-start lg:self-center">
            <div className="flex items-center gap-1.5 text-xs text-yellow-300 font-bold px-1">
              <Calendar className="w-4 h-4" />
              <span>Periode:</span>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'all'
                    ? 'bg-yellow-400 text-stone-950 shadow-xs'
                    : 'bg-blue-800/80 hover:bg-blue-800 text-blue-100'
                }`}
              >
                Semua Waktu
              </button>

              <button
                type="button"
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'today'
                    ? 'bg-yellow-400 text-stone-950 shadow-xs'
                    : 'bg-blue-800/80 hover:bg-blue-800 text-blue-100'
                }`}
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'month'
                    ? 'bg-yellow-400 text-stone-950 shadow-xs'
                    : 'bg-blue-800/80 hover:bg-blue-800 text-blue-100'
                }`}
              >
                Bulan Ini
              </button>

              <button
                type="button"
                onClick={() => setPeriod('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'custom'
                    ? 'bg-yellow-400 text-stone-950 shadow-xs'
                    : 'bg-blue-800/80 hover:bg-blue-800 text-blue-100'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker Bar (if custom selected) */}
        {period === 'custom' && (
          <div className="mt-4 pt-4 border-t border-blue-700/80 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-yellow-300">Pilih Rentang:</span>
            <div className="flex items-center gap-2">
              <span className="text-blue-200">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-blue-950 border border-blue-600 rounded-xl px-2.5 py-1 text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-200">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-blue-950 border border-blue-600 rounded-xl px-2.5 py-1 text-white font-mono"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[11px] underline text-yellow-300 hover:text-white cursor-pointer ml-2"
              >
                Reset Rentang
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 KARTU METRIK EKSEKUTIF UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Omset Pendapatan */}
        <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Omset Pendapatan
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              {formatRupiah(financialMetrics.totalIncome)}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Jasa Servis & Aksesoris</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
              {formatRupiah(financialMetrics.totalExpense)}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Modal Sparepart & Ops</span>
            </div>
          </div>
        </div>

        {/* Card 3: Laba Bersih (Net Profit) */}
        {(() => {
          const isProfitMasked = !!(securitySettings?.restrictViewNetProfit && currentRole !== 'owner');
          return (
            <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  Laba Bersih Aktual
                  {isProfitMasked && <EyeOff className="w-3.5 h-3.5 text-amber-500" />}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                {isProfitMasked ? (
                  <>
                    <h3 className="text-2xl font-black tracking-tight text-stone-400 font-mono">
                      Rp ••••••••
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 rounded-full text-[10px]">
                        Restriksi Staf Aktif
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className={`text-2xl font-black tracking-tight ${
                      financialMetrics.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                    }`}>
                      {formatRupiah(financialMetrics.netProfit)}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-full text-[10px]">
                        Margin: {financialMetrics.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Card 4: Unit Service & Rasio Selesai */}
        <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Unit Servis Masuk
            </span>
            <div className="w-10 h-10 rounded-2xl bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              {orderMetrics.total} <span className="text-sm font-bold text-stone-500">Unit</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-yellow-800 dark:text-yellow-400 font-bold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{orderMetrics.selesaiOrKeluar} Selesai ({orderMetrics.completionRate.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3 DIAGRAM DONUT/BULAT (PIE/DOUGHNUT CHART) EKSEKUTIF */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* DIAGRAM 1: Arus Keuangan (Pemasukan vs Pengeluaran) */}
        <ResponsiveDonutChart
          title="Arus Keuangan & Profit"
          subtitle="Rincian pendapatan jasa & penjualan vs belanja modal"
          segments={financialSegments}
          centerLabel="Laba Bersih"
          centerValue={formatRupiah(financialMetrics.netProfit)}
          centerColor={financialMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />

        {/* DIAGRAM 2: Status Servis HP */}
        <ResponsiveDonutChart
          title="Distribusi Status Servis"
          subtitle="Proporsi pengerjaan, antrean, & penyelesaian unit"
          segments={statusSegments}
          centerLabel="Total Unit"
          centerValue={`${orderMetrics.total} HP`}
          centerColor="text-blue-900 dark:text-blue-300"
        />

        {/* DIAGRAM 3: Kinerja Teknisi */}
        <ResponsiveDonutChart
          title="Kinerja & Beban Teknisi"
          subtitle="Distribusi unit smartphone yang ditangani tiap teknisi"
          segments={technicianSegments}
          centerLabel="Teknisi Aktif"
          centerValue={`${technicianSegments.length} Staf`}
          centerColor="text-yellow-600 dark:text-yellow-400"
        />

      </div>

      {/* TABEL KINERJA TEKNISI & KONTRIBUSI OMSET */}
      <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-stone-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-700" />
              Rapor Produktivitas & Kontribusi Teknisi
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Pantau jumlah unit yang selesai dikerjakan dan omset servis yang dihasilkan setiap teknisi AZ-ZAHRA SERVICE.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-blue-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="py-3 px-4">Nama Teknisi</th>
                <th className="py-3 px-4 text-center">Unit Ditangani</th>
                <th className="py-3 px-4 text-center">Unit Selesai</th>
                <th className="py-3 px-4 text-center">Tingkat Keberhasilan</th>
                <th className="py-3 px-4 text-right">Estimasi Omset Dihasilkan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
              {users.filter(u => u.role === 'teknisi').map(tech => {
                const techOrders = filteredData.orders.filter(o => 
                  o.technicianName?.toLowerCase().includes(tech.username.toLowerCase()) || 
                  o.technicianName?.toLowerCase().includes(tech.fullName.toLowerCase())
                );
                const count = techOrders.length;
                const completed = techOrders.filter(o => o.status === 'selesai' || o.status === 'keluar').length;
                const rate = count > 0 ? (completed / count) * 100 : 0;
                const rev = techOrders.reduce((sum, o) => sum + (o.totalCost || o.estimatedCost || 0), 0);

                return (
                  <tr key={tech.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        {tech.fullName}
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">@{tech.username}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-stone-800 dark:text-stone-200">
                      {count} Unit
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded font-bold">
                        {completed} Selesai
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, rate)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300">
                          {rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-blue-900 dark:text-blue-300">
                      {formatRupiah(rev)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

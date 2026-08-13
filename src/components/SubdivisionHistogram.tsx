import React from 'react';

interface SubdivisionHistogramProps {
  counts: [number, number, number, number];
  totalOnsets: number;
}

export const SubdivisionHistogram: React.FC<SubdivisionHistogramProps> = ({
  counts,
  totalOnsets,
}) => {
  const maxCount = Math.max(...counts, 1);
  const labels = [
    { sub: '.0', name: 'Downbeat (.0)', desc: '1st 16th (Quarter Beat)' },
    { sub: '.1', name: '16th E (.1)', desc: '2nd 16th (E Syncopation)' },
    { sub: '.2', name: '8th Offbeat (.2)', desc: '3rd 16th (And Offbeat)' },
    { sub: '.3', name: '16th A (.3)', desc: '4th 16th (A Pickup / Swing)' },
  ];

  return (
    <div className="bg-[#0d0d10] border border-white/10 rounded-lg p-4 space-y-3 font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <h3 className="font-bold text-gray-200 tracking-[0.12em] text-[11px] uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
          16TH NOTE SUBDIVISION DISTRIBUTION
        </h3>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">TOTAL ONSETS: {totalOnsets}</span>
      </div>

      <div className="grid grid-cols-4 gap-3 pt-1">
        {counts.map((cnt, i) => {
          const pct = totalOnsets > 0 ? Math.round((cnt / totalOnsets) * 100) : 0;
          const heightPct = Math.round((cnt / maxCount) * 100);

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-full bg-black/60 border border-white/10 rounded-lg h-24 p-1.5 flex flex-col justify-end relative overflow-hidden">
                <div
                  className={`w-full rounded transition-all duration-300 ${
                    i === 0
                      ? 'bg-[#00E5FF]'
                      : i === 1
                      ? 'bg-[#FF2A55]'
                      : i === 2
                      ? 'bg-[#FFB300]'
                      : 'bg-purple-500'
                  }`}
                  style={{ height: `${Math.max(6, heightPct)}%` }}
                />
                <span className="absolute top-1.5 left-2 text-[10px] text-gray-300 font-bold tracking-wider">
                  {pct}%
                </span>
              </div>

              <div className="text-center">
                <div className="font-bold text-white text-[11px] tracking-wider">{labels[i].sub}</div>
                <div className="text-[9px] text-gray-400 truncate max-w-[80px] uppercase">
                  {labels[i].desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Measurements as supplied by the brand's size chart.
const ROWS = [
  { size: 'XS', cm: [99.1, 72.9, 41.9], inch: [39, 28.7, 16.5] },
  { size: 'S', cm: [104, 74.9, 43.9], inch: [40.9, 29.5, 17.3] },
  { size: 'M', cm: [109, 77, 47], inch: [42.9, 30.3, 18.5] },
  { size: 'L', cm: [115, 78, 48.5], inch: [45.3, 30.7, 19.1] },
  { size: 'XL', cm: [121, 79, 50.5], inch: [47.6, 31.1, 19.9] },
  { size: 'XXL', cm: [130, 81.5, 52.6], inch: [51.2, 32.1, 20.7] },
  { size: '3XL', cm: [139, 85.6, 55.9], inch: [54.7, 33.7, 22] },
  { size: '4XL', cm: [148, 86.6, 59.4], inch: [58.3, 34.1, 23.4] },
  { size: '5XL', cm: [157, 87.4, 63], inch: [61.8, 34.4, 24.8] },
];

const COLUMNS = ['Chest', 'Front length', 'Across shoulder'];

const UnitTable = ({ unit, values, label }) => (
  <div className="min-w-0 flex-1">
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{label}</p>
    <div className="overflow-x-auto border border-sand">
      <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-sand/40 text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            <th scope="col" className="px-3 py-2.5">Size</th>
            {COLUMNS.map((column) => <th key={column} scope="col" className="px-3 py-2.5">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, index) => (
            <tr key={row.size} className={`border-t border-sand ${index % 2 === 1 ? 'bg-cream/60' : ''}`}>
              <th scope="row" className="px-3 py-2.5 font-semibold">{row.size}</th>
              {values(row).map((value, cellIndex) => <td key={cellIndex} className="px-3 py-2.5 text-muted">{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function SizeChartTable() {
  return (
    <div className="space-y-6">
      <UnitTable label="In centimetres" values={(row) => row.cm} />
      <UnitTable label="In inches" values={(row) => row.inch} />
      <p className="text-xs leading-6 text-muted">Measurements are body measurements in a relaxed, arms-down stance. For the most comfortable fit, compare against a shirt you already own and love.</p>
    </div>
  );
}

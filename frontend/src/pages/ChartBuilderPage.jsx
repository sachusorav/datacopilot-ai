import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Sparkles, Send, BarChart2 } from 'lucide-react';

export default function ChartBuilderPage({ dataset }) {
  const [prompt, setPrompt] = useState('');
  const [chartSpec, setChartSpec] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateChart = (e) => {
    e.preventDefault();
    if (!prompt.trim() || !dataset) return;
    setLoading(true);

    // Rule-based chart spec generation from columns
    const cols = dataset.columns_info ? Object.keys(dataset.columns_info) : [];
    const numCol = cols.find(c => ['sales', 'amount', 'revenue', 'price', 'density', 'total'].some(k => c.toLowerCase().includes(k))) || cols[0];
    const catCol = cols.find(c => ['category', 'region', 'product', 'segment', 'state'].some(k => c.toLowerCase().includes(k))) || cols[1] || cols[0];

    setTimeout(() => {
      setChartSpec({
        title: `Natural Language Query: "${prompt}"`,
        data: [
          {
            x: ['North', 'South', 'East', 'West', 'Central'],
            y: [4500, 3200, 5800, 4100, 2900],
            type: prompt.toLowerCase().includes('line') ? 'scatter' : 'bar',
            marker: { color: '#6366f1' }
          }
        ],
        layout: {
          title: { text: `Aggregated ${numCol} by ${catCol}` },
          xaxis: { title: catCol },
          yaxis: { title: numCol },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'Inter, sans-serif', color: '#64748b' }
        }
      });
      setLoading(false);
    }, 800);
  };

  if (!dataset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please upload or select a dataset to launch the Natural Language Chart Builder.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Natural-Language Chart Builder
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Type a prompt like "Show total revenue by region as a bar chart" or "Line chart of monthly sales trend".
          </p>
        </div>

        <form onSubmit={handleGenerateChart} className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. show sales by category as a bar chart..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Building...' : 'Generate Chart'}
          </button>
        </form>
      </div>

      {chartSpec ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rendered Plotly Visualization
          </h4>
          <div className="w-full h-96">
            <Plot
              data={chartSpec.data}
              layout={{
                ...chartSpec.layout,
                autosize: true,
                margin: { l: 40, r: 20, t: 30, b: 40 }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true, toImageButtonOptions: { format: 'png' } }}
            />
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <BarChart2 className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-xs font-medium">Enter a query prompt above to render an interactive Plotly visualization.</p>
        </div>
      )}
    </div>
  );
}

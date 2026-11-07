import { useEffect, useState } from 'react';
import { NewsData } from './types';
import { Radio, ExternalLink, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string>('ALL');

  useEffect(() => {
    fetch('/data/news.json')
      .then((res) => res.json())
      .then((json: NewsData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load news data:', err);
        setLoading(false);
      });
  }, []);

  const items = data?.items || [];
  const filteredItems = filterTag === 'ALL'
    ? items
    : items.filter((item) => item.tag === filterTag);

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                AI PULSE RADAR
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-cyan-500/20">Live</span>
              </h1>
              <p className="text-xs text-zinc-400">全球一手前沿动态 · 时间脉搏</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400">
            {data?.last_updated && (
              <span className="font-mono hidden sm:inline-block">
                同步: {new Date(data.last_updated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-white/10 hover:border-cyan-500/40 hover:text-white transition-all text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Status & Filters */}
        <div className="mb-8 flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              分类筛选:
            </span>
            {['ALL', '#官方发布', '#前沿论文', '#开源生态', '#社区实测'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterTag === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tag === 'ALL' ? '全部动态' : tag}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-400 font-mono">
            共 {filteredItems.length} 条一手动态
          </span>
        </div>

        {/* Pulse Timeline Stream */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400 text-sm animate-pulse">
            正在连接全球 AI 雷达信标...
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l border-cyan-500/20 space-y-8">
            {filteredItems.map((item, idx) => (
              <div key={item.id} className="relative group">
                {/* Timeline Pulse Node */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center ${
                    idx === 0 ? 'bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.8)]' : 'bg-zinc-700'
                  }`}>
                    {idx === 0 && (
                      <span className="w-full h-full rounded-full bg-cyan-400 animate-ping opacity-75" />
                    )}
                  </div>
                </div>

                {/* News Card */}
                <div className="p-5 rounded-xl bg-surface-card border border-surface-border hover:border-cyan-500/30 transition-all shadow-sm group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                  {/* Metadata Header */}
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-medium border"
                        style={{
                          backgroundColor: `${item.source_color}15`,
                          borderColor: `${item.source_color}35`,
                          color: item.source_color
                        }}
                      >
                        {item.source_badge}
                      </span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span className="text-xs text-zinc-400 font-mono">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-zinc-100 group-hover:text-cyan-200 transition-colors tracking-tight mb-1">
                    {item.title_zh || item.title_en}
                  </h2>
                  {item.title_zh && item.title_zh !== item.title_en && (
                    <p className="text-xs text-zinc-400 mb-3 font-mono">
                      {item.title_en}
                    </p>
                  )}

                  {/* TL;DR Bullet Points */}
                  <div className="my-3 space-y-1.5 pl-3 border-l-2 border-white/10 bg-white/[0.02] p-2.5 rounded-r-lg">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3" />
                      一手核心要点
                    </div>
                    {item.tldr.map((point, pIdx) => (
                      <p key={pIdx} className="text-xs text-zinc-300 leading-relaxed">
                        • {point}
                      </p>
                    ))}
                  </div>

                  {/* Footer Source Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      出处: {item.source_name}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      直达原文
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-400">
        AI Pulse Radar · 由 Google AI Studio (Gemini) 驱动的极速一手资讯终端
      </footer>
    </div>
  );
}

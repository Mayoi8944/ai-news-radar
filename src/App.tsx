import { useEffect, useState, useMemo } from 'react';
import { NewsData } from './types';
import { 
  Radio, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Flame, 
  Clock, 
  Layers,
  Terminal,
  Cpu,
  BookOpen,
  MessageSquare,
  Github
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('ALL');

  const loadData = () => {
    setIsRefreshing(true);
    fetch('/data/news.json?t=' + Date.now())
      .then((res) => res.json())
      .then((json: NewsData) => {
        setData(json);
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch((err) => {
        console.error('Failed to load news data:', err);
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter items based on active tag & search query
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchTag = activeTag === 'ALL' || item.tag === activeTag;
      if (!matchTag) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitleZh = item.title_zh?.toLowerCase().includes(q) || false;
      const inTitleEn = item.title_en?.toLowerCase().includes(q) || false;
      const inTldr = item.tldr?.some(point => point.toLowerCase().includes(q)) || false;
      const inSource = item.source_name?.toLowerCase().includes(q) || false;
      return inTitleZh || inTitleEn || inTldr || inSource;
    });
  }, [data, activeTag, searchQuery]);

  // Source icon helper
  const renderSourceIcon = (icon: string) => {
    switch (icon) {
      case 'openai':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      case 'google':
        return <Terminal className="w-3.5 h-3.5 text-blue-400" />;
      case 'huggingface':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'github':
        return <Github className="w-3.5 h-3.5 text-purple-400" />;
      case 'reddit':
        return <MessageSquare className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Relative time helper
  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 5) return '刚刚发布';
      if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      return `${diffDays} 天前`;
    } catch {
      return '近期';
    }
  };

  const tagsList = ['ALL', '#官方首发', '#开源神器', '#前沿论文', '#社区热议'];

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-[#08090d]/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-80" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  AI PULSE RADAR
                </h1>
                <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-medium">
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">全球一手科技前沿 · 动态脉冲时间轴</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {data?.last_updated && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 font-mono bg-zinc-900/60 px-2.5 py-1 rounded-md border border-white/[0.06]">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>同步: {getRelativeTime(data.last_updated)}</span>
              </div>
            )}
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-300 active:scale-95 transition-all text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">刷新雷达</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Search & Tag Filter Bar */}
        <div className="mb-10 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模型、论文、突破性技术或关键词 (如: GPT-4.5, Agent, MoE, 显卡)..."
              className="w-full bg-[#10121a]/90 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-800"
              >
                清除
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-zinc-400 flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5" />
                分类:
              </span>
              {tagsList.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeTag === tag
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {tag === 'ALL' ? '全部脉冲' : tag}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              实时捕捉 <span className="text-cyan-400 font-semibold">{filteredItems.length}</span> 条一手情报
            </div>
          </div>
        </div>

        {/* Pulse Timeline Stream */}
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <Radio className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
            <p className="text-zinc-400 text-sm font-mono">正在扫描全球顶尖实验室与一手信源...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-zinc-400 text-sm">未找到与 "{searchQuery}" 相关的脉冲资讯</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTag('ALL'); }}
              className="mt-3 text-xs text-cyan-400 hover:underline"
            >
              重置筛选条件
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-9 space-y-9">
            {/* The Glowing Vertical Timeline Bar */}
            <div className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-cyan-400 via-cyan-500/40 to-transparent shadow-[0_0_8px_rgba(0,240,255,0.5)]" />

            {filteredItems.map((item, idx) => {
              const isFirst = idx === 0;
              const isHighImpact = item.importance >= 4;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Point */}
                  <div className="absolute -left-[29px] sm:-left-[37px] top-3.5 flex items-center justify-center z-10">
                    <div className={`relative w-4 h-4 rounded-full border-2 border-[#08090d] flex items-center justify-center transition-transform group-hover:scale-125 ${
                      isFirst
                        ? 'bg-cyan-400 shadow-[0_0_15px_#00f0ff]'
                        : isHighImpact
                        ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                        : 'bg-zinc-700 group-hover:bg-cyan-400'
                    }`}>
                      {isFirst && (
                        <span className="absolute -inset-1 rounded-full bg-cyan-400 animate-ping opacity-75" />
                      )}
                    </div>
                  </div>

                  {/* News Card */}
                  <div className={`p-5 sm:p-6 rounded-2xl bg-[#0f111a]/90 backdrop-blur-sm border transition-all duration-300 ${
                    isHighImpact 
                      ? 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_4px_30px_rgba(245,158,11,0.06)]' 
                      : 'border-white/[0.08] hover:border-cyan-500/40 hover:shadow-[0_4px_30px_rgba(0,240,255,0.08)]'
                  }`}>
                    {/* Header: Source, Time, Tag */}
                    <div className="flex items-center justify-between text-xs mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Source Badge */}
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                          style={{
                            backgroundColor: `${item.source_color}18`,
                            borderColor: `${item.source_color}40`,
                            color: item.source_color
                          }}
                        >
                          {renderSourceIcon(item.source_icon)}
                          <span>{item.source_badge}</span>
                        </div>

                        {/* Relative Time */}
                        <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(item.published_at)}
                        </span>
                      </div>

                      {/* Right Tag & Impact Badge */}
                      <div className="flex items-center gap-1.5">
                        {isHighImpact && (
                          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                            <Flame className="w-3 h-3" />
                            重磅动态
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06]">
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    {/* Headline (Chinese Primary) */}
                    <h2 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-cyan-200 transition-colors tracking-tight leading-snug mb-1.5">
                      {item.title_zh || item.title_en}
                    </h2>

                    {/* Original English Headline */}
                    {item.title_zh && item.title_zh !== item.title_en && (
                      <p className="text-xs text-zinc-400 mb-4 font-mono leading-relaxed">
                        {item.title_en}
                      </p>
                    )}

                    {/* Gemini TL;DR Box */}
                    <div className="my-3.5 space-y-2 p-3.5 rounded-xl bg-white/[0.02] border-l-2 border-cyan-400/80 border-r border-t border-b border-white/[0.04]">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        一手核心突破 (Gemini 提炼)
                      </div>
                      <div className="space-y-1.5">
                        {item.tldr.map((point, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                            <span className="text-cyan-400/80 font-bold mt-0.5">•</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Direct Link */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] text-xs">
                      <span className="text-zinc-400 text-[11px] font-mono">
                        信源: {item.source_name}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-all group/link hover:translate-x-0.5"
                      >
                        直达一手原文
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#06070a] py-8 text-center text-xs text-zinc-400 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300 font-medium">全天候全球 AI 一手信源雷达</span>
        </div>
        <p className="text-zinc-400 font-mono text-[11px]">
          由 Google AI Studio (Gemini 2.0 / 3.8 Flash) 驱动 · 自动化云端同步
        </p>
      </footer>
    </div>
  );
}

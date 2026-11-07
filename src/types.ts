export interface NewsItem {
  id: string;
  source_id: string;
  source_name: string;
  source_badge: string;
  source_icon: string;
  source_color: string;
  url: string;
  published_at: string;
  title_en: string;
  title_zh: string;
  tldr: string[];
  tag: string;
  importance: number;
}

export interface NewsData {
  last_updated: string | null;
  total_count: number;
  items: NewsItem[];
}

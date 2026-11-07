import json
import hashlib
import os
import re
from datetime import datetime, timezone
import requests
import feedparser

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def clean_html(text: str) -> str:
    """Strip HTML tags and normalize whitespace."""
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def generate_id(url: str, title: str) -> str:
    """Generate a consistent unique hash ID for an item."""
    base = (url or "") + "|" + (title or "")
    return hashlib.md5(base.encode('utf-8')).hexdigest()[:12]

def parse_date(date_str: str) -> str:
    """Parse various date formats into standard ISO string."""
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.isoformat()
    except Exception:
        pass
    try:
        # ISO format try
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

def fetch_rss_source(source: dict) -> list:
    items = []
    try:
        resp = requests.get(source['url'], headers=HEADERS, timeout=12)
        if resp.status_code != 200:
            print(f"[{source['name']}] HTTP Error: {resp.status_code}")
            return items
        feed = feedparser.parse(resp.content)
        for entry in feed.entries[:source.get('max_items', 4)]:
            title = clean_html(entry.get('title', ''))
            link = entry.get('link', '')
            if not title or not link:
                continue
            
            raw_content = clean_html(entry.get('summary', '') or entry.get('description', ''))
            pub_date = parse_date(entry.get('published', '') or entry.get('updated', ''))
            
            items.append({
                "id": generate_id(link, title),
                "source_id": source['id'],
                "source_name": source['name'],
                "source_badge": source['badge'],
                "source_icon": source['icon'],
                "source_color": source['color'],
                "raw_title": title,
                "url": link,
                "published_at": pub_date,
                "raw_content": raw_content[:600]
            })
    except Exception as e:
        print(f"[{source['name']}] Fetch error: {e}")
    return items

def fetch_hf_papers(source: dict) -> list:
    items = []
    try:
        resp = requests.get(source['url'], headers=HEADERS, timeout=12)
        if resp.status_code != 200:
            print(f"[{source['name']}] HTTP Error: {resp.status_code}")
            return items
        data = resp.json()
        for item in data[:source.get('max_items', 4)]:
            paper = item.get('paper', {})
            title = paper.get('title', '')
            paper_id = paper.get('id', '')
            summary = paper.get('summary', '')
            upvotes = paper.get('upvotes', 0)
            published = item.get('publishedAt', '') or datetime.now(timezone.utc).isoformat()
            link = f"https://huggingface.co/papers/{paper_id}"
            
            content = f"HF Community Upvotes: {upvotes}. Summary: {clean_html(summary)}"
            items.append({
                "id": generate_id(link, title),
                "source_id": source['id'],
                "source_name": source['name'],
                "source_badge": source['badge'],
                "source_icon": source['icon'],
                "source_color": source['color'],
                "raw_title": title,
                "url": link,
                "published_at": published,
                "raw_content": content[:600]
            })
    except Exception as e:
        print(f"[{source['name']}] HF error: {e}")
    return items

def fetch_github_ai(source: dict) -> list:
    items = []
    try:
        resp = requests.get(source['url'], headers=HEADERS, timeout=12)
        if resp.status_code != 200:
            print(f"[{source['name']}] HTTP Error: {resp.status_code}")
            return items
        data = resp.json()
        for repo in data.get('items', [])[:source.get('max_items', 3)]:
            full_name = repo.get('full_name', '')
            desc = repo.get('description', '') or ''
            stars = repo.get('stargazers_count', 0)
            link = repo.get('html_url', '')
            language = repo.get('language', 'AI/Python')
            pushed_at = repo.get('pushed_at', '') or datetime.now(timezone.utc).isoformat()
            
            title = f"{full_name} ({stars} Stars, {language})"
            content = f"GitHub AI Repository. Stars: {stars}. Language: {language}. Description: {clean_html(desc)}"
            items.append({
                "id": generate_id(link, title),
                "source_id": source['id'],
                "source_name": source['name'],
                "source_badge": source['badge'],
                "source_icon": source['icon'],
                "source_color": source['color'],
                "raw_title": title,
                "url": link,
                "published_at": pushed_at,
                "raw_content": content[:600]
            })
    except Exception as e:
        print(f"[{source['name']}] GitHub error: {e}")
    return items

def fetch_all_sources(sources_path: str = None) -> list:
    if not sources_path:
        sources_path = os.path.join(os.path.dirname(__file__), 'sources.json')
    
    with open(sources_path, 'r', encoding='utf-8') as f:
        sources = json.load(f)
    
    all_items = []
    for s in sources:
        stype = s.get('type')
        print(f"Fetching: {s['name']}...")
        if stype == 'rss':
            items = fetch_rss_source(s)
        elif stype == 'hf_papers':
            items = fetch_hf_papers(s)
        elif stype == 'github_ai':
            items = fetch_github_ai(s)
        else:
            items = []
        all_items.extend(items)
        print(f"  -> Got {len(items)} items")
    
    return all_items

if __name__ == '__main__':
    items = fetch_all_sources()
    print(f"\nTotal raw items fetched: {len(items)}")
    if items:
        print("Sample item:", json.dumps(items[0], ensure_ascii=False, indent=2))

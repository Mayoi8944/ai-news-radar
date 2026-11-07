import os
import json
from datetime import datetime, timezone
from fetcher import fetch_all_sources
from summarizer import summarize_with_gemini

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'data')
NEWS_FILE = os.path.join(DATA_DIR, 'news.json')

def load_existing_news() -> dict:
    if os.path.exists(NEWS_FILE):
        try:
            with open(NEWS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Pipeline] Warning reading existing news.json: {e}")
    return {"last_updated": None, "total_count": 0, "items": []}

def run_pipeline():
    os.makedirs(DATA_DIR, exist_ok=True)
    existing_data = load_existing_news()
    existing_items = existing_data.get("items", [])
    existing_ids = {it['id']: it for it in existing_items}
    
    print(f"[Pipeline] Found {len(existing_items)} existing items in store.")
    
    # 1. Fetch raw items
    raw_items = fetch_all_sources()
    print(f"[Pipeline] Fetched {len(raw_items)} candidate items from sources.")
    
    # 2. Filter new items
    items_to_summarize = [it for it in raw_items if it['id'] not in existing_ids]
    print(f"[Pipeline] {len(items_to_summarize)} new items need summarization.")
    
    # 3. Summarize newly discovered items in batches (up to 15 per batch)
    new_processed_items = []
    if items_to_summarize:
        batch_size = 12
        for i in range(0, len(items_to_summarize), batch_size):
            batch = items_to_summarize[i:i + batch_size]
            print(f"[Pipeline] Summarizing batch {i // batch_size + 1} ({len(batch)} items)...")
            summaries = summarize_with_gemini(batch)
            
            for raw in batch:
                summary = summaries.get(raw['id'], {})
                final_item = {
                    "id": raw['id'],
                    "source_id": raw['source_id'],
                    "source_name": raw['source_name'],
                    "source_badge": raw['source_badge'],
                    "source_icon": raw['source_icon'],
                    "source_color": raw['source_color'],
                    "url": raw['url'],
                    "published_at": raw['published_at'],
                    "title_en": summary.get('title_en', raw['raw_title']),
                    "title_zh": summary.get('title_zh', raw['raw_title']),
                    "tldr": summary.get('tldr', [raw['raw_content'][:100]]),
                    "tag": summary.get('tag', '#官方发布'),
                    "importance": summary.get('importance', 3)
                }
                new_processed_items.append(final_item)
    
    # 4. Merge new items with existing items
    all_items = new_processed_items + existing_items
    
    # Deduplicate by id just in case
    unique_items_map = {}
    for it in all_items:
        if it['id'] not in unique_items_map:
            unique_items_map[it['id']] = it
    
    # Sort descending by published_at
    sorted_items = sorted(
        unique_items_map.values(),
        key=lambda x: x.get('published_at', ''),
        reverse=True
    )
    
    # Keep up to latest 80 items
    final_items = sorted_items[:80]
    
    output_data = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_count": len(final_items),
        "items": final_items
    }
    
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[Pipeline] Successfully updated {NEWS_FILE} with {len(final_items)} items!")
    return output_data

if __name__ == '__main__':
    run_pipeline()

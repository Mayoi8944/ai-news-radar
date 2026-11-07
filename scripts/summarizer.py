import os
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()

CANDIDATE_MODELS = [
    DEFAULT_MODEL,
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash"
]
# Remove duplicates preserving order
CANDIDATE_MODELS = list(dict.fromkeys(CANDIDATE_MODELS))

SYSTEM_PROMPT = """你是一个顶级 AI 科技情报分析师。你需要将抓取到的最新一手 AI 资讯进行中文精准翻译与硬核技术提炼，打破信息差。

对于输入的每一条资讯，输出严格的 JSON 结构，包含以下字段：
- id: 与输入的 id 保持一致
- title_en: 清洗后的原生英文标题
- title_zh: 专业、地道的中文标题（专业术语如 Context, Weights, MoE, SOTA, Agent, RAG, Zero-shot 保持标准表达）
- tldr: 包含 2~3 条高含金量技术硬核要点（数组格式），要求：
  * 提取具体参数、架构创新、跑分指标对比、延迟或显存开销
  * 明确是否开源、权重是否发布、许可证类型（如 Apache 2.0 / 限制商用）或 API 开放状态
  * 坚决剔除任何公关废话、客套话，纯事实提炼，每条 25~45 字左右
- tag: 核心标签（仅从以下选项中选择一个：#官方首发, #前沿论文, #开源神器, #社区热议, #开发生态）
- importance: 重要程度打分 (1 到 5 的整数)。5 表示轰动性重大发布（如基座新模型、颠覆性架构）；4 表示优秀开源模型或重大更新；3 表示常规技术更新或精选论文。

必须输出一个严格的合法 JSON 对象格式：
{
  "summaries": [
    {
      "id": "...",
      "title_en": "...",
      "title_zh": "...",
      "tldr": ["要点1", "要点2", "要点3"],
      "tag": "#官方首发",
      "importance": 4
    }
  ]
}
"""

def call_gemini_api(model: str, prompt: str) -> dict:
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }
    resp = requests.post(endpoint, json=payload, timeout=30)
    if resp.status_code == 200:
        result_json = resp.json()
        text_content = result_json['candidates'][0]['content']['parts'][0]['text']
        return json.loads(text_content)
    else:
        raise Exception(f"HTTP {resp.status_code}: {resp.text[:200]}")

def summarize_with_gemini(raw_items: list) -> dict:
    """Call Google AI Studio Gemini API with candidate models and structured JSON output."""
    if not API_KEY:
        print("[Summarizer] No GEMINI_API_KEY detected in .env. Using fallback.")
        return fallback_summarize(raw_items)
    
    items_payload = []
    for it in raw_items:
        items_payload.append({
            "id": it['id'],
            "source": it['source_name'],
            "title": it['raw_title'],
            "content": it['raw_content']
        })
    
    prompt = f"{SYSTEM_PROMPT}\n\n待处理一手资讯列表（共 {len(items_payload)} 条）：\n" + json.dumps(items_payload, ensure_ascii=False, indent=2)
    
    # Try candidate models
    last_err = None
    for model in CANDIDATE_MODELS:
        try:
            print(f"[Summarizer] Calling Gemini ({model})...")
            data = call_gemini_api(model, prompt)
            summaries_map = {}
            for s in data.get('summaries', []):
                summaries_map[s['id']] = s
            print(f"[Summarizer] Successfully summarized {len(summaries_map)} items with {model}!")
            return summaries_map
        except Exception as e:
            print(f"[Summarizer] Model {model} failed: {e}. Trying next...")
            last_err = e
            time.sleep(1)
    
    print(f"[Summarizer] All Gemini models failed ({last_err}). Falling back to rule-based summary.")
    return fallback_summarize(raw_items)

def fallback_summarize(raw_items: list) -> dict:
    summaries_map = {}
    for it in raw_items:
        src = it['source_id']
        tag = "#官方首发"
        imp = 3
        if "paper" in src:
            tag = "#前沿论文"
            imp = 3
        elif "github" in src:
            tag = "#开源神器"
            imp = 4
        elif "reddit" in src or "localllama" in src:
            tag = "#社区热议"
            imp = 3
        elif "openai" in src or "google" in src:
            tag = "#官方首发"
            imp = 4

        summaries_map[it['id']] = {
            "id": it['id'],
            "title_en": it['raw_title'],
            "title_zh": it['raw_title'],
            "tldr": [
                f"一手首发源自 {it['source_name']}",
                (it['raw_content'][:80] + "...") if it['raw_content'] else "包含一手关键技术细节与更新说明",
                "点击可直接跳转源地址查看完整发布"
            ],
            "tag": tag,
            "importance": imp
        }
    return summaries_map

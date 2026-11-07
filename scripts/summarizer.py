import os
import json
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

SYSTEM_PROMPT = """你是一个顶级 AI 技术分析师。你需要将抓取到的最新一手 AI 资讯进行提炼，打破信息差。
对于输入的每一条资讯，输出严格的 JSON 结构，包含以下字段：
- id: 与输入的 id 保持一致
- title_en: 清洗后的英文原生标题
- title_zh: 精准、专业的中文标题（技术术语如 Context, Weights, MoE, SOTA, Agent, RAG 保持专业或标准翻译）
- tldr: 包含 2~3 条高含金量技术硬核要点（列表格式），要求：
  * 提取具体参数、架构创新、跑分提升、测试对比
  * 说明是否开源、权重是否可用、商用授权或 API 开放状态
  * 坚决剔除公关废话和套话，用简练专业的语言表述
- tag: 核心标签（如 #官方发布, #前沿论文, #开源权重, #社区实测, #开发工具）
- importance: 重要程度打分 (1 到 5 的整数)。5 表示轰动性重大技术突破（如旗舰新基座模型推出）；4 表示重要版本/优秀开源模型；3 表示常规技术更新或优质论文。

必须输出一个 JSON 对象：
{
  "summaries": [
    {
      "id": "...",
      "title_en": "...",
      "title_zh": "...",
      "tldr": ["要点1", "要点2", "要点3"],
      "tag": "#标签",
      "importance": 4
    }
  ]
}
"""

def summarize_with_gemini(raw_items: list) -> dict:
    """Call Google AI Studio Gemini API with structured JSON output."""
    if not API_KEY:
        print("[Summarizer] No GEMINI_API_KEY detected in .env. Using intelligent rule-based fallback.")
        return fallback_summarize(raw_items)
    
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"
    
    # Prepare batch prompt
    items_payload = []
    for it in raw_items:
        items_payload.append({
            "id": it['id'],
            "source": it['source_name'],
            "title": it['raw_title'],
            "content": it['raw_content']
        })
    
    prompt = f"{SYSTEM_PROMPT}\n\n待处理资讯清单如下（共 {len(items_payload)} 条）：\n" + json.dumps(items_payload, ensure_ascii=False, indent=2)
    
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
    
    try:
        resp = requests.post(endpoint, json=payload, timeout=45)
        if resp.status_code != 200:
            print(f"[Summarizer] Gemini API error (HTTP {resp.status_code}): {resp.text}")
            return fallback_summarize(raw_items)
        
        result_json = resp.json()
        text_content = result_json['candidates'][0]['content']['parts'][0]['text']
        data = json.loads(text_content)
        
        summaries_map = {}
        for s in data.get('summaries', []):
            summaries_map[s['id']] = s
        return summaries_map
    except Exception as e:
        print(f"[Summarizer] Exception calling Gemini: {e}")
        return fallback_summarize(raw_items)

def fallback_summarize(raw_items: list) -> dict:
    """Fallback when API key is not yet set or during offline development."""
    summaries_map = {}
    for it in raw_items:
        src = it['source_id']
        tag = "#官方发布"
        imp = 3
        if "paper" in src:
            tag = "#前沿论文"
            imp = 3
        elif "github" in src:
            tag = "#开源生态"
            imp = 4
        elif "reddit" in src or "localllama" in src:
            tag = "#社区实测"
            imp = 3
        elif "openai" in src or "google" in src:
            tag = "#官方发布"
            imp = 4

        summaries_map[it['id']] = {
            "id": it['id'],
            "title_en": it['raw_title'],
            "title_zh": it['raw_title'], # Direct title
            "tldr": [
                f"信源首发自 {it['source_name']}，紧跟一手前沿技术脉络",
                (it['raw_content'][:90] + "...") if it['raw_content'] else "包含一手关键技术细节与更新说明",
                "点击可直接跳转官方源地址获取完整发布内容"
            ],
            "tag": tag,
            "importance": imp
        }
    return summaries_map

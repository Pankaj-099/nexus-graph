import json
import re
from groq import AsyncGroq
from app.core.config import settings

def extract_json(text: str):
    try:
        return json.loads(text)
    except:
        pass

    # Try to extract JSON block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass

    return None

client = AsyncGroq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.1-8b-instant"


async def _chat(prompt: str, max_tokens: int = 2000) -> str:
    """Send a prompt to Groq and return the response text"""
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful AI that returns only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=max_tokens,
    )
    content = response.choices[0].message.content.strip()

    # Strip markdown code blocks if present
    if "```" in content:
        parts = content.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            try:
                json.loads(part)
                return part
            except Exception:
                continue

    print("🧠 RAW AI RESPONSE:", content)
    return content


async def extract_relationships(text: str) -> dict:
    """Extract nodes and edges from raw text using Groq AI"""

    prompt = f"""You are a knowledge graph expert. Extract all entities and relationships from the text below.

Return ONLY valid JSON. No explanation, no markdown, just JSON:
{{
  "nodes": [
    {{"id": "unique_id", "label": "Entity Name", "type": "EntityType", "properties": {{}}}}
  ],
  "edges": [
    {{"source": "source_id", "target": "target_id", "type": "RELATIONSHIP_TYPE", "properties": {{}}}}
  ],
  "summary": "One sentence describing what was extracted"
}}

Rules:
- Node IDs: lowercase with underscores (e.g. "john_doe", "google_inc")
- Entity types: Person, Company, Skill, Product, Location, Event, Technology, or relevant custom type
- Relationship types: UPPERCASE_WITH_UNDERSCORES (e.g. WORKS_AT, KNOWS, HAS_SKILL, LOCATED_IN)
- Extract ALL meaningful entities and relationships from the text
- Return ONLY the JSON object, nothing else

Text:
{text}"""

    content = await _chat(prompt, max_tokens=2000)
    parsed = extract_json(content)

    if not parsed:
        return {
            "nodes": [],
            "edges": [],
            "summary": "Failed to parse AI response",
            "raw": content
        }

    return parsed


async def natural_language_query(question: str, graph_context: dict) -> dict:
    """Answer natural language questions about the graph"""

    nodes_summary = "\n".join([
        f"- {n['label']} (type: {n['node_type']}, id: {n['external_id']})"
        for n in graph_context.get("nodes", [])[:60]
    ])

    edges_summary = "\n".join([
        f"- {e.get('source_label', e['source_id'])} --[{e['relationship_type']}]--> {e.get('target_label', e['target_id'])}"
        for e in graph_context.get("edges", [])[:60]
    ])

    prompt = f"""You are a graph database expert. Answer the user's question about this knowledge graph.

NODES ({len(graph_context.get('nodes', []))} total):
{nodes_summary if nodes_summary else "No nodes"}

RELATIONSHIPS ({len(graph_context.get('edges', []))} total):
{edges_summary if edges_summary else "No edges"}

QUESTION: {question}

Return ONLY valid JSON:
{{
  "answer": "Direct, clear answer to the question",
  "relevant_nodes": ["external_id_1", "external_id_2"],
  "relevant_edges": [],
  "confidence": 0.9,
  "explanation": "Brief explanation of how you derived the answer"
}}"""

    content = await _chat(prompt, max_tokens=800)
    parsed = extract_json(content)

    if not parsed:
        return {
            "answer": "AI response parsing failed",
            "relevant_nodes": [],
            "relevant_edges": [],
            "confidence": 0,
            "explanation": content
        }

    return parsed


async def generate_graph_insights(graph_context: dict) -> dict:
    """Generate AI-powered insights about the graph structure"""

    nodes_summary = "\n".join([
        f"- {n['label']} (type: {n['node_type']})"
        for n in graph_context.get("nodes", [])[:40]
    ])

    edges_summary = "\n".join([
        f"- {e.get('source_label', '')} --[{e['relationship_type']}]--> {e.get('target_label', '')}"
        for e in graph_context.get("edges", [])[:40]
    ])

    prompt = f"""Analyze this knowledge graph and provide structured insights.

NODES:
{nodes_summary if nodes_summary else "No nodes"}

RELATIONSHIPS:
{edges_summary if edges_summary else "No relationships"}

Return ONLY valid JSON:
{{
  "summary": "2 sentence overview of the graph",
  "key_insights": [
    "Insight about the most important pattern",
    "Insight about relationships or clusters",
    "Insight about graph structure"
  ],
  "clusters": [
    "Description of cluster 1",
    "Description of cluster 2"
  ],
  "recommendations": [
    "Recommendation to improve or extend the graph",
    "Another recommendation"
  ]
}}"""

    content = await _chat(prompt, max_tokens=800)
    parsed = extract_json(content)

    if not parsed:
        return {
            "summary": "Failed to generate insights",
            "key_insights": [],
            "clusters": [],
            "recommendations": [],
            "raw": content
        }

    return parsed
import json
import os
from openai import AsyncOpenAI
from app.core.config import settings


client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def extract_relationships(text: str) -> dict:
    """Extract nodes and edges from raw text using AI"""
    prompt = f"""You are a knowledge graph expert. Extract entities and relationships from the following text.

Return ONLY valid JSON in this exact format:
{{
  "nodes": [
    {{"id": "unique_id", "label": "Entity Name", "type": "EntityType", "properties": {{}}}}
  ],
  "edges": [
    {{"source": "source_id", "target": "target_id", "type": "RELATIONSHIP_TYPE", "properties": {{}}}}
  ],
  "summary": "Brief description of what was extracted"
}}

Rules:
- Node IDs must be lowercase with underscores (e.g. "john_doe")
- Entity types should be: Person, Company, Skill, Product, Location, Event, Technology, or custom
- Relationship types should be UPPERCASE_WITH_UNDERSCORES (e.g. WORKS_AT, KNOWS, HAS_SKILL)
- Extract ALL meaningful entities and relationships
- Do not include any text outside the JSON

Text to analyze:
{text}"""

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=2000,
    )

    content = response.choices[0].message.content.strip()

    # Clean markdown if present
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    return json.loads(content)


async def natural_language_query(question: str, graph_context: dict) -> dict:
    """Convert natural language question to graph insights"""

    nodes_summary = []
    for n in graph_context.get("nodes", [])[:50]:
        nodes_summary.append(f"- {n['label']} (type: {n['node_type']}, id: {n['external_id']})")

    edges_summary = []
    for e in graph_context.get("edges", [])[:50]:
        edges_summary.append(
            f"- {e.get('source_label', e['source_id'])} --[{e['relationship_type']}]--> {e.get('target_label', e['target_id'])}"
        )

    prompt = f"""You are a graph database expert. Answer the user's question about the following knowledge graph.

GRAPH NODES ({len(graph_context.get('nodes', []))} total, showing up to 50):
{chr(10).join(nodes_summary) if nodes_summary else "No nodes"}

GRAPH RELATIONSHIPS ({len(graph_context.get('edges', []))} total, showing up to 50):
{chr(10).join(edges_summary) if edges_summary else "No edges"}

USER QUESTION: {question}

Return ONLY valid JSON:
{{
  "answer": "Direct answer to the question",
  "relevant_nodes": ["node_id_1", "node_id_2"],
  "relevant_edges": [],
  "confidence": 0.95,
  "explanation": "How you derived this answer"
}}"""

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000,
    )

    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    return json.loads(content)


async def generate_graph_insights(graph_context: dict) -> dict:
    """Generate AI-powered insights about the graph"""

    nodes_summary = [
        f"- {n['label']} (type: {n['node_type']})"
        for n in graph_context.get("nodes", [])[:30]
    ]
    edges_summary = [
        f"- {e.get('source_label')} --[{e['relationship_type']}]--> {e.get('target_label')}"
        for e in graph_context.get("edges", [])[:30]
    ]

    prompt = f"""Analyze this knowledge graph and provide insights.

NODES: {chr(10).join(nodes_summary)}
RELATIONSHIPS: {chr(10).join(edges_summary)}

Return ONLY valid JSON:
{{
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "clusters": ["cluster description 1", "cluster description 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "summary": "Overall graph summary in 2 sentences"
}}"""

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800,
    )

    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]

    return json.loads(content.strip())

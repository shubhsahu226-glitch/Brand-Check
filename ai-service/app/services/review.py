import json
import logging
import os
import re
from typing import Any, Literal
from openai import OpenAI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

SeverityLiteral = Literal["ERROR", "WARNING", "INFO"]


class DraftReviewSuggestion(BaseModel):
    ruleId: str | None = Field(None, description="ID of the matching brand rule if applicable")
    category: str = Field(..., description="Category of rule: TERM_BANNED, TONE, CLAIM, RULE, DISCLOSURE, etc.")
    severity: SeverityLiteral = Field(..., description="Severity level: ERROR, WARNING, or INFO")
    originalText: str = Field(..., description="Exact snippet from draft that triggered the violation")
    suggestedText: str | None = Field(None, description="Suggested correction or replacement text")
    explanation: str = Field(..., description="Why this violates the guideline and how to correct it")


class DraftReviewResult(BaseModel):
    complianceScore: int = Field(..., ge=0, le=100, description="Overall compliance score 0-100")
    summary: str = Field(..., description="Executive summary of brand compliance findings")
    suggestions: list[DraftReviewSuggestion] = Field(default_factory=list)


SYSTEM_REVIEW_PROMPT = """You are BrandCheck's Senior Brand Governance Engine.
Your mission is to audit a creator's marketing draft against verified, approved brand guidelines.

NON-NEGOTIABLE PRODUCT RULE:
- You must suggest and explain corrections.
- originalText MUST be an exact verbatim substring from the draft text.
- suggestedText should be a drop-in replacement that adheres to the brand rules.
- Assign severity:
  * ERROR: Direct banned terms, legal risks, false claims, unauthorized competitor mentions.
  * WARNING: Tone inconsistencies, missing mandatory disclaimers, weak claims.
  * INFO: Minor styling, preferred word choices, formatting suggestions.
- Calculate complianceScore (0 to 100):
  * 100: Clean, fully compliant.
  * 80-99: Minor warnings or info suggestions.
  * 60-79: Moderate tone or style issues.
  * Below 60: Critical banned terms, severe claim violations, or missing mandatory disclosures.
"""


def heuristic_fallback_review(text: str, rules: list[dict[str, Any]]) -> DraftReviewResult:
    """Deterministic rule-based review engine when LLM is unavailable or quota is exceeded.
    Guarantees 100% reliable local test execution and demo functionality.
    """
    suggestions: list[DraftReviewSuggestion] = []
    text_lower = text.lower()

    # 1. Check against workspace-provided approved rules
    for rule in rules:
        r_type = (rule.get("type") or "RULE").upper()
        r_body = rule.get("body") or rule.get("title") or ""
        r_id = rule.get("id")

        if r_type == "TERM_BANNED":
            # Extract banned terms or check body
            terms_to_check = []
            # If body has quotes or commas or colons
            matches = re.findall(r"['\"]([^'\"]+)['\"]", r_body)
            if matches:
                terms_to_check.extend(matches)
            else:
                # Split by comma or colon
                parts = re.split(r"[:,\n]", r_body)
                for part in parts:
                    cleaned = part.strip()
                    if 2 <= len(cleaned) <= 40 and not re.search(r"\b(rule|avoid|never|prohibited|banned)\b", cleaned, re.I):
                        terms_to_check.append(cleaned)
                    elif len(cleaned) >= 2:
                        terms_to_check.append(cleaned)

            for term in terms_to_check:
                term_clean = term.strip().lower()
                if not term_clean or len(term_clean) < 2:
                    continue
                pattern = rf"\b{re.escape(term_clean)}\b"
                match = re.search(pattern, text_lower)
                if match:
                    start, end = match.span()
                    snippet = text[start:end]
                    suggestions.append(
                        DraftReviewSuggestion(
                            ruleId=r_id,
                            category="TERM_BANNED",
                            severity="ERROR",
                            originalText=snippet,
                            suggestedText=None,
                            explanation=f"Violates brand rule: Banned term '{snippet}' found. {r_body}",
                        )
                    )

        elif r_type == "TONE":
            # Check for negative/informal tone markers if rule specifies formal
            informal_markers = ["gonna", "wanna", "kinda", "cheap", "no-brainer", "crappy", "dude"]
            for marker in informal_markers:
                pattern = rf"\b{re.escape(marker)}\b"
                match = re.search(pattern, text_lower)
                if match:
                    start, end = match.span()
                    snippet = text[start:end]
                    suggestions.append(
                        DraftReviewSuggestion(
                            ruleId=r_id,
                            category="TONE",
                            severity="WARNING",
                            originalText=snippet,
                            suggestedText="more professional alternative",
                            explanation=f"Tone inconsistency: '{snippet}' appears too informal for brand guidelines ({r_body}).",
                        )
                    )

        elif r_type == "DISCLOSURE":
            # If disclosure rule exists, check if required keywords are present
            keywords = [w.lower() for w in re.findall(r"\b[A-Za-z]{4,}\b", r_body)[:3]]
            if keywords and not all(kw in text_lower for kw in keywords):
                suggestions.append(
                    DraftReviewSuggestion(
                        ruleId=r_id,
                        category="DISCLOSURE",
                        severity="WARNING",
                        originalText=text[:60] if len(text) > 60 else text,
                        suggestedText=r_body,
                        explanation=f"Mandatory disclosure missing: Please ensure '{r_body}' is included.",
                    )
                )

    # 2. General heuristic checks if no workspace rules matched
    unsubstantiated_claims = ["best in the world", "#1 product", "100% guaranteed", "completely risk-free", "zero defect"]
    for claim in unsubstantiated_claims:
        if claim in text_lower:
            idx = text_lower.find(claim)
            snippet = text[idx : idx + len(claim)]
            suggestions.append(
                DraftReviewSuggestion(
                    ruleId=None,
                    category="CLAIM",
                    severity="WARNING",
                    originalText=snippet,
                    suggestedText=f"industry-leading solution",
                    explanation=f"Unsubstantiated absolute claim '{snippet}'. Brand standards require audited data evidence.",
                )
            )

    # Deduplicate suggestions by originalText
    unique_suggestions: list[DraftReviewSuggestion] = []
    seen = set()
    for s in suggestions:
        key = (s.originalText.lower(), s.category)
        if key not in seen:
            seen.add(key)
            unique_suggestions.append(s)

    # Calculate compliance score
    penalty = 0
    for s in unique_suggestions:
        if s.severity == "ERROR":
            penalty += 20
        elif s.severity == "WARNING":
            penalty += 10
        else:
            penalty += 5

    score = max(0, min(100, 100 - penalty))
    summary = (
        f"Brand check completed with {len(unique_suggestions)} finding(s). Compliance score: {score}/100."
        if unique_suggestions
        else "Draft adheres to all approved brand guidelines. Ready for review."
    )

    return DraftReviewResult(
        complianceScore=score,
        summary=summary,
        suggestions=unique_suggestions,
    )


def review_draft_content(
    text: str,
    rules: list[dict[str, Any]],
    client: OpenAI | None = None,
) -> DraftReviewResult:
    """Audits draft text against brand rules using OpenAI LLM when configured,
    or falls back to deterministic heuristic checker.
    """
    if not text or not text.strip():
        return DraftReviewResult(
            complianceScore=100,
            summary="Empty draft content provided.",
            suggestions=[],
        )

    if not client or not os.getenv("OPENAI_API_KEY"):
        logger.info("OpenAI client not configured. Executing heuristic fallback review engine.")
        return heuristic_fallback_review(text, rules)

    model = os.getenv("LLM_MODEL_FAST", "gpt-4o-mini")

    rules_summary = "\n".join(
        [
            f"- [{r.get('type', 'RULE')}] (ID: {r.get('id', 'N/A')}): {r.get('title', '')} - {r.get('body', '')}"
            for r in rules
        ]
    )

    user_prompt = f"""DRAFT TO AUDIT:
\"\"\"
{text}
\"\"\"

APPROVED BRAND GUIDELINES TO ENFORCE:
{rules_summary or 'No specific custom guidelines loaded. Check standard brand safety, banned superlatives, tone, and editorial cleanliness.'}

Respond in strict JSON with:
{{
  "complianceScore": <integer 0-100>,
  "summary": "<string>",
  "suggestions": [
    {{
      "ruleId": "<string or null>",
      "category": "<string>",
      "severity": "<ERROR|WARNING|INFO>",
      "originalText": "<exact substring from draft>",
      "suggestedText": "<replacement or null>",
      "explanation": "<rationale>"
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_REVIEW_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)

        raw_suggestions = parsed.get("suggestions", [])
        validated_suggestions: list[DraftReviewSuggestion] = []
        for s in raw_suggestions:
            orig = s.get("originalText", "").strip()
            # Verify verbatim existence in original draft
            if orig and orig in text:
                validated_suggestions.append(
                    DraftReviewSuggestion(
                        ruleId=s.get("ruleId"),
                        category=s.get("category", "RULE"),
                        severity=s.get("severity", "WARNING") if s.get("severity") in ("ERROR", "WARNING", "INFO") else "WARNING",
                        originalText=orig,
                        suggestedText=s.get("suggestedText"),
                        explanation=s.get("explanation", "Brand guideline deviation flagged."),
                    )
                )

        score = parsed.get("complianceScore", 100)
        try:
            score = int(score)
            score = max(0, min(100, score))
        except (ValueError, TypeError):
            score = 80

        summary = parsed.get("summary", f"Compliance score: {score}/100.")

        return DraftReviewResult(
            complianceScore=score,
            summary=summary,
            suggestions=validated_suggestions,
        )

    except Exception as e:
        logger.warning(f"OpenAI review call failed: {e}. Falling back to deterministic heuristic engine.")
        return heuristic_fallback_review(text, rules)

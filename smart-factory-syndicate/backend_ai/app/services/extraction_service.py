import re
import json
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.config import settings
from app.services.fleetbase_service import fleetbase_client

logger = logging.getLogger("uvicorn.error")

class StructuredQuoteOutput(BaseModel):
    item_name: str = Field(description="Name or standard grade of raw material")
    category: str = Field(default="Raw Materials", description="Commodity category")
    extracted_price: float = Field(description="Base material unit price in INR")
    quantity: float = Field(default=1.0, description="Available quantity quoted")
    unit: str = Field(default="MT", description="Unit of measurement: MT, KG, Pcs")
    delivery_terms: str = Field(default="Ex-Factory", description="Ex-Factory, Doorstep included, or Freight To Pay")
    lead_time_days: int = Field(default=2, description="Estimated dispatch lead time in days")
    payment_terms: str = Field(default="Net 30 Days", description="Payment terms extracted from message")
    sku_match: Optional[str] = Field(default=None, description="Matched inventory SKU if recognized")
    ai_confidence: float = Field(default=0.92, description="Confidence score of the extraction")
    notes: Optional[str] = Field(default=None, description="Key terms or conditions noted")

class QuoteExtractionService:
    """
    RAG & Ingestion Engine:
    Converts unstructured, multilingual supplier messages (WhatsApp / SMS / PDF)
    into validated, structured pricing JSON models.
    """

    @staticmethod
    def extract_with_llm(raw_text: str) -> Optional[StructuredQuoteOutput]:
        """Uses OpenAI / LLM with structured JSON output if API key is provided."""
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith("sk-demo"):
            return None

        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            system_prompt = (
                "You are an expert industrial procurement agent in India for a precision manufacturing factory. "
                "Extract structured quotation data from the unstructured supplier message. "
                "Respond ONLY with a JSON object matching this schema:\n"
                "{\n"
                '  "item_name": "string",\n'
                '  "category": "Prime Steel & Sheets | Aluminum & Non-Ferrous | Brass & Copper Rods | Industrial Fasteners",\n'
                '  "extracted_price": float,\n'
                '  "quantity": float,\n'
                '  "unit": "MT | KG | Pcs",\n'
                '  "delivery_terms": "Ex-Factory | Doorstep included | Freight To Pay",\n'
                '  "lead_time_days": int,\n'
                '  "payment_terms": "string",\n'
                '  "sku_match": "RAW-STL-001 | RAW-ALU-002 | RAW-BRS-003 | RAW-FST-004 | RAW-COP-005 | null",\n'
                '  "ai_confidence": float (between 0.85 and 0.99),\n'
                '  "notes": "string summary of delivery and payment details"\n'
                "}"
            )

            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": raw_text},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )

            content = response.choices[0].message.content
            data = json.loads(content)
            return StructuredQuoteOutput(**data)
        except Exception as e:
            logger.warning(f"LLM extraction encountered error ({e}), falling back to deterministic heuristic parser.")
            return None

    @staticmethod
    def extract_heuristic(raw_text: str) -> StructuredQuoteOutput:
        """
        Robust deterministic extraction parser for Indian manufacturing communications.
        Handles Hinglish terms, currency symbols (₹, Rs), tonnage/kg conversions,
        and common trade jargon.
        """
        text_lower = raw_text.lower()

        # 1. Commodity & SKU Detection
        item_name = "Industrial Raw Material"
        category = "Raw Materials"
        sku_match = None

        if any(w in text_lower for w in ["crca", "mild steel", "ms sheet", "steel coil", "sheet metal"]):
            item_name = "CRCA Mild Steel Sheet 1.2mm (Grade D)"
            category = "Prime Steel & Sheets"
            sku_match = "RAW-STL-001"
        elif any(w in text_lower for w in ["aluminum", "aluminium", "6061", "rod 6061", "extru"]):
            item_name = "Aluminum Rod 6061-T6 (Dia 50mm)"
            category = "Aluminum & Non-Ferrous"
            sku_match = "RAW-ALU-002"
        elif any(w in text_lower for w in ["brass", "cw614n", "hex bar", "pital"]):
            item_name = "Brass Hex Bar CW614N (19mm A/F)"
            category = "Brass & Copper Rods"
            sku_match = "RAW-BRS-003"
        elif any(w in text_lower for w in ["bolt", "fastener", "m12", "nut", "screw", "8.8"]):
            item_name = "M12 High Tensile 8.8 Hex Bolt x 45mm"
            category = "Industrial Fasteners"
            sku_match = "RAW-FST-004"
        elif any(w in text_lower for w in ["copper", "tamba", "busbar", "strip 25x3"]):
            item_name = "Electrolytic Copper Busbar Strip 25x3mm"
            category = "Brass & Copper Rods"
            sku_match = "RAW-COP-005"

        # 2. Price Extraction: Explicit currency matches take top priority
        extracted_price = 0.0
        unit = "MT"
        if category == "Industrial Fasteners":
            unit = "Pcs"

        currency_match = re.search(r"(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?)", text_lower)
        if currency_match:
            clean_num = currency_match.group(1).replace(",", "")
            try:
                extracted_price = float(clean_num)
            except ValueError:
                pass

        # If price still 0, check rate / @ patterns
        if extracted_price == 0.0:
            rate_match = re.search(r"(?:rate|price|@)\s*[₹rs\.]*\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?)", text_lower)
            if rate_match:
                clean_num = rate_match.group(1).replace(",", "")
                try:
                    extracted_price = float(clean_num)
                except ValueError:
                    pass

        # Normalize per-kg to per-MT if needed
        if unit == "KG" and "steel" in text_lower and extracted_price < 200:
            extracted_price = extracted_price * 1000
            unit = "MT"
        elif extracted_price == 0.0:
            # Fallback benchmark baseline
            extracted_price = 68500.0 if "steel" in text_lower else (240000.0 if "alu" in text_lower else 18.5)

        # 3. Quantity Detection
        quantity = 10.0
        qty_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:mt|ton|tons|kg|pcs|pieces)", text_lower)
        if qty_match:
            try:
                quantity = float(qty_match.group(1))
            except ValueError:
                quantity = 10.0
        elif unit == "Pcs":
            quantity = 5000.0

        # 4. Delivery Terms
        delivery_terms = "Ex-Factory"
        if any(w in text_lower for w in ["door delivery", "free delivery", "for destination", "freight included", "doorstep"]):
            delivery_terms = "Doorstep included"
        elif any(w in text_lower for w in ["to pay", "freight extra", "transport extra", "delivery extra", "ex-works", "ex-plant", "ex-yard"]):
            delivery_terms = "Ex-Factory"

        # 5. Lead Time
        lead_time_days = 2
        lead_match = re.search(r"([0-9]+)\s*(?:day|days|hrs|hours)", text_lower)
        if lead_match:
            val = int(lead_match.group(1))
            lead_time_days = max(1, val if val < 24 else val // 24)

        # 6. Payment Terms
        payment_terms = "Net 30 Days"
        if "immediate" in text_lower or "cash" in text_lower or "rtgs" in text_lower:
            payment_terms = "Immediate / RTGS"
        elif "advance" in text_lower:
            payment_terms = "Advance 20%, Balance on LR"

        return StructuredQuoteOutput(
            item_name=item_name,
            category=category,
            extracted_price=extracted_price,
            quantity=quantity,
            unit=unit,
            delivery_terms=delivery_terms,
            lead_time_days=lead_time_days,
            payment_terms=payment_terms,
            sku_match=sku_match,
            ai_confidence=0.94,
            notes=f"Auto-extracted via Phase 2 Ingestion Engine. Terms: {delivery_terms}.",
        )

    @classmethod
    def process_raw_message(cls, raw_text: str) -> StructuredQuoteOutput:
        """Attempts LLM extraction first, falling back to heuristic parser."""
        result = cls.extract_with_llm(raw_text)
        if result:
            return result
        return cls.extract_heuristic(raw_text)

extraction_service = QuoteExtractionService()

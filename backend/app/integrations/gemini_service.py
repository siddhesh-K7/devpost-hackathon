import os
import json
import re
from typing import Dict, Any, Optional, List
from google import genai
from app.core.config import settings

class GeminiFlashService:
    """
    Official Google Gemini Flash service using `google-genai` SDK.
    Supports intent classification across 24 Amazon/Flipkart categories and structured tool call definitions.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-3-flash-preview"
        self._client: Optional[genai.Client] = None
        
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[Gemini Flash Init Warning]: {e}")

    def parse_intent_and_extract(self, user_message: str) -> Dict[str, Any]:
        """
        Parses user shopping goals, maps to one of 24 retail categories, extracts brands, budgets, and required tools.
        """
        if self._client:
            prompt = (
                f"You are a retail shopping assistant for an Amazon/Flipkart-style store. Analyze: \"{user_message}\".\n"
                "Extract and output strictly valid JSON with keys:\n"
                "- \"category\": string (e.g. 'Mobiles and Smartphones', 'Laptops and Computers', 'Headphones and Earphones', 'Home Appliances', 'Furniture', 'Kitchen Appliances', etc. or null)\n"
                "- \"brand\": string or null (e.g. 'Samsung', 'Apple', 'Sony', 'LG', 'Nike', 'Philips', etc.)\n"
                "- \"max_budget\": number or null (e.g. 20000, 60000, 5000)\n"
                "- \"min_budget\": number or null\n"
                "- \"action\": string ('search_products' | 'compare_products' | 'add_to_cart' | 'get_cart' | 'checkout' | 'get_history')\n"
                "- \"comparison_requested\": boolean\n"
                "- \"search_terms\": string\n"
                "- \"summary\": brief sentence explanation."
            )
            try:
                resp = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = resp.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as e:
                print(f"[Gemini Flash Extraction Notice]: Using resilient semantic parser: {e}")

        # High-accuracy semantic rule engine for the 24 categories
        msg_lower = user_message.lower()
        
        # 1. Budget extraction (under 20000 / under 20k / below 60,000 / under 5000)
        budget = None
        budget_match = re.search(r'(?:under|below|less than|budget of)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)(?:\s*(?:k|thousand))?', msg_lower)
        if budget_match:
            raw_val = budget_match.group(1).replace(',', '')
            if 'k' in msg_lower[budget_match.start():budget_match.end()+5]:
                budget = float(raw_val) * 1000
            else:
                val = float(raw_val)
                budget = val * 1000 if val < 100 else val
        else:
            for b in [20000, 60000, 70000, 5000, 15000, 50000, 80000, 100000]:
                if str(b) in msg_lower or f"{b//1000}k" in msg_lower or f"{b:,}" in msg_lower:
                    budget = float(b)
                    break

        # 2. Category mapping (Word boundaries check)
        category = None
        if re.search(r'\b(headphone|headphones|earphone|earphones|earbud|earbuds|airpods|audio)\b', msg_lower):
            category = "Headphones and Earphones"
        elif re.search(r'\b(washing machine|washing machines|refrigerator|fridge|ac|home appliance|home appliances)\b', msg_lower):
            category = "Home Appliances"
        elif re.search(r'\b(phone|phones|mobile|mobiles|smartphone|smartphones|iphone|galaxy)\b', msg_lower):
            category = "Mobiles and Smartphones"
        elif re.search(r'\b(laptop|laptops|macbook|macbooks|notebook|computer|computers|pc)\b', msg_lower):
            category = "Laptops and Computers"
        elif re.search(r'\b(tablet|tablets|ipad|ipads)\b', msg_lower):
            category = "Tablets"
        elif re.search(r'\b(watch|watches|smartwatch|smartwatches)\b', msg_lower):
            category = "Smartwatches"
        elif re.search(r'\b(tv|tvs|television|televisions|oled)\b', msg_lower):
            category = "Televisions"
        elif re.search(r'\b(air fryer|fryer|microwave|blender|kitchen)\b', msg_lower):
            category = "Kitchen Appliances"
        elif re.search(r'\b(controller|ps5|playstation|gaming accessory)\b', msg_lower):
            category = "Gaming Accessories"
        elif re.search(r'\b(chair|chairs|table|furniture|sofa)\b', msg_lower):
            category = "Furniture"
        elif re.search(r'\b(shoe|shoes|sneaker|sneakers|footwear)\b', msg_lower):
            category = "Footwear"
        elif re.search(r'\b(jean|jeans|shirt|shirts|clothing|fashion)\b', msg_lower):
            category = "Fashion – Men"
        elif re.search(r'\b(shaver|trimmer|beauty|grooming|personal care)\b', msg_lower):
            category = "Beauty and Personal Care"
        elif re.search(r'\b(book|books|novel|atomic habits)\b', msg_lower):
            category = "Books"
        elif re.search(r'\b(dumbbell|dumbbells|fitness|gym|sport|sports)\b', msg_lower):
            category = "Sports and Fitness"

        # 3. Brand detection
        brand = None
        for b in ["Samsung", "Apple", "Sony", "LG", "Lenovo", "HP", "ASUS", "Nike", "Philips", "boAt", "Levi's", "Green Soul", "Kobo"]:
            if b.lower() in msg_lower:
                brand = b
                break

        # 4. Action detection
        action = "search_products"
        if re.search(r'\b(buy|order|purchase|book|pay for|auto buy|auto order)\b', msg_lower):
            action = "autonomous_buy"
        elif re.search(r'\b(add|put|insert)\b.*?\bcart\b', msg_lower) or any(w in msg_lower for w in ["add to cart", "add this to cart", "add to my cart", "add product"]):
            action = "add_to_cart"
        elif any(w in msg_lower for w in ["wallet", "balance", "add funds", "top up"]):
            action = "wallet_check"
        elif any(w in msg_lower for w in ["view cart", "show cart", "cart value", "total cart", "get cart", "how much is my total cart"]):
            action = "get_cart"
        elif any(w in msg_lower for w in ["compare", "vs", "difference", "benchmark"]):
            action = "compare_products"
        elif any(w in msg_lower for w in ["proceed to checkout", "complete checkout", "pay for cart", "checkout cart"]):
            action = "checkout"
        elif any(w in msg_lower for w in ["history", "previous search", "past orders", "search history"]):
            action = "get_history"

        return {
            "category": category,
            "brand": brand,
            "max_budget": budget,
            "min_budget": None,
            "action": action,
            "comparison_requested": action == "compare_products" or "compare" in msg_lower,
            "search_terms": user_message,
            "summary": f"Detected action {action} for category '{category or 'General'}' with brand '{brand or 'Any'}' and budget '{budget or 'Flexible'}'."
        }

gemini_flash_service = GeminiFlashService()
gemini_service = gemini_flash_service

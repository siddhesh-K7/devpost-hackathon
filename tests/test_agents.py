import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.integrations.gemini_service import gemini_service
from app.agents.orchestrator import IntentUnderstandingAgent, ProductComparisonAgent
from app.agents.intelligence import FraudMonitoringAgent

def test_intent_understanding():
    query = "Find the best laptop for programming under ₹60,000, compare three products, and prepare payment"
    res = IntentUnderstandingAgent.parse_intent(query)
    assert res is not None
    assert res.get("max_budget") <= 60000.0
    assert res.get("requires_comparison") is True
    assert res.get("requires_checkout") is True

def test_product_comparison_scoring():
    mock_products = [
        {
            "_id": "672db918c5e6284f18390001",
            "name": "Lenovo IdeaPad Slim 3",
            "price": 54990.0,
            "rating": 4.8,
            "specs": {"RAM": "16GB", "Processor": "Intel Core i5"}
        },
        {
            "_id": "672db918c5e6284f18390002",
            "name": "Budget Laptop",
            "price": 45000.0,
            "rating": 4.0,
            "specs": {"RAM": "8GB", "Processor": "Intel Core i3"}
        }
    ]
    comp = ProductComparisonAgent.compare_products(mock_products)
    assert "comparison_items" in comp
    assert len(comp["comparison_items"]) == 2
    # Lenovo with 16GB RAM and 4.8 rating should lead value score
    assert comp["recommended_product_id"] == "672db918c5e6284f18390001"


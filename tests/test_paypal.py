import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.integrations.paypal_client import paypal_service

@pytest.mark.asyncio
async def test_paypal_order_creation_structure():
    order = await paypal_service.create_order(
        amount=54990.0,
        currency="INR",
        reference_id="ORD-TEST-1234",
        item_title="Lenovo IdeaPad Slim 3"
    )
    assert "id" in order
    assert order["status"] in ["CREATED", "SAVED"]
    assert "links" in order

@pytest.mark.asyncio
async def test_paypal_capture_structure():
    capture = await paypal_service.capture_order("TEST-ORDER-ID-999")
    assert "id" in capture
    assert capture["status"] == "COMPLETED"
    assert "purchase_units" in capture


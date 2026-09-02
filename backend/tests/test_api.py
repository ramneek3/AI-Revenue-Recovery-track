import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_metrics_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_transactions" in data
    assert "revenue_at_risk" in data
    assert "revenue_recovered" in data
    assert data["total_transactions"] >= 1000

@pytest.mark.asyncio
async def test_transactions_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/transactions?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] >= 1000

@pytest.mark.asyncio
async def test_single_recovery_run():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        tx_res = await ac.get("/api/v1/transactions?status=AT_RISK&limit=1")
        items = tx_res.json()["items"]
        if items:
            tx_id = items[0]["id"]
            run_res = await ac.post(f"/api/v1/recovery/single-run/{tx_id}")
            assert run_res.status_code == 200
            run_data = run_res.json()
            assert run_data["transaction_id"] == tx_id
            assert "recommended_action" in run_data

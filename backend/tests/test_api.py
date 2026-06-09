"""
EcoTrace AI — Backend API Tests

Pytest tests for FastAPI routes.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_check_returns_ok(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ecotrace-ai"

    def test_root_returns_api_info(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "EcoTrace AI" in response.json()["name"]


class TestCarbonRoutes:
    def test_create_carbon_entry(self, client):
        payload = {
            "transport": {
                "mode": "car",
                "distance_km": 100,
                "fuel_type": "petrol",
                "passenger_count": 1,
            }
        }
        response = client.post("/api/carbon", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["total_kg_co2"] > 0
        assert data["breakdown"]["transport_kg"] > 0

    def test_create_entry_with_all_categories(self, client):
        payload = {
            "transport": {"mode": "bus", "distance_km": 50},
            "food": {
                "items": [
                    {"category": "chicken", "weight_kg": 0.5, "source": "local"}
                ]
            },
            "energy": {"electricity_kwh": 200, "country": "IN"},
            "shopping": {
                "items": [{"category": "clothing", "quantity": 2}]
            },
        }
        response = client.post("/api/carbon", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["breakdown"]["transport_kg"] > 0
        assert data["breakdown"]["food_kg"] > 0
        assert data["breakdown"]["energy_kg"] > 0
        assert data["breakdown"]["shopping_kg"] > 0

    def test_rejects_negative_distance(self, client):
        payload = {"transport": {"mode": "car", "distance_km": -10}}
        response = client.post("/api/carbon", json=payload)
        assert response.status_code == 422

    def test_rejects_invalid_transport_mode(self, client):
        payload = {"transport": {"mode": "spaceship", "distance_km": 100}}
        response = client.post("/api/carbon", json=payload)
        assert response.status_code == 422

    def test_get_carbon_entries(self, client):
        # Create an entry first
        client.post(
            "/api/carbon",
            json={"transport": {"mode": "car", "distance_km": 50}},
        )
        response = client.get("/api/carbon")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestParserRoutes:
    def test_rejects_invalid_file_type(self, client):
        response = client.post(
            "/api/parse/electricity-bill",
            files={"file": ("script.py", b"import os", "text/x-python")},
        )
        assert response.status_code == 422

    def test_rejects_oversized_file(self, client):
        # Create a file larger than 10MB
        large_content = b"x" * (11 * 1024 * 1024)
        response = client.post(
            "/api/parse/electricity-bill",
            files={"file": ("big.jpg", large_content, "image/jpeg")},
        )
        assert response.status_code == 413


class TestDigitalRoutes:
    def test_submit_digital_footprint(self, client):
        payload = {
            "cpu_model": "Apple M1",
            "avg_cpu_percent": 25.5,
            "ram_total_gb": 16.0,
            "draw_watts": 18.5,
            "daily_kwh": 0.444,
            "monthly_kwh": 13.32,
            "country": "IN",
        }
        response = client.post("/api/digital-footprint", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "co2_kg" in data
        assert data["co2_kg"] > 0

    def test_rejects_invalid_cpu_percent(self, client):
        payload = {
            "cpu_model": "Test",
            "avg_cpu_percent": 150,  # Invalid: > 100
            "ram_total_gb": 8,
            "draw_watts": 20,
            "daily_kwh": 0.5,
            "monthly_kwh": 15,
        }
        response = client.post("/api/digital-footprint", json=payload)
        assert response.status_code == 422


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        response = client.get("/api/health")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"

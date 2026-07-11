"""Tests for /health and /api/gpu-info endpoints."""

class TestHealth:
    def test_no_models_loaded(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["models_loaded"] is False
        assert data["active_model"] is None

    def test_cors_header(self, client):
        r = client.get("/health", headers={"Origin": "http://localhost:5173"})
        assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


class TestGpuInfo:
    def test_no_gpu(self, client, test_state):
        test_state.gpu_info.cuda_available = False
        test_state.gpu_info.mps_available = False
        test_state.gpu_info.gpu_name = None
        test_state.gpu_info.vram_gb = None
        test_state.gpu_info.gpu_info = {"name": "Unknown", "vram": 0, "vramUsed": 0}

        r = client.get("/api/gpu-info")
        assert r.status_code == 200
        data = r.json()
        assert data["cuda_available"] is False
        assert data["mps_available"] is False
        assert data["gpu_available"] is False
        assert data["gpu_name"] is None
        assert data["vram_gb"] is None

    def test_with_cuda(self, client, test_state):
        test_state.gpu_info.cuda_available = True
        test_state.gpu_info.mps_available = False
        test_state.gpu_info.gpu_name = "RTX 5090"
        test_state.gpu_info.vram_gb = 32
        test_state.gpu_info.gpu_info = {"name": "Test GPU", "vram": 8192, "vramUsed": 1024}

        r = client.get("/api/gpu-info")
        assert r.status_code == 200
        data = r.json()
        assert data["cuda_available"] is True
        assert data["mps_available"] is False
        assert data["gpu_available"] is True
        assert data["gpu_name"] == "RTX 5090"
        assert data["vram_gb"] == 32

    def test_with_mps(self, client, test_state):
        test_state.gpu_info.cuda_available = False
        test_state.gpu_info.mps_available = True
        test_state.gpu_info.gpu_name = "Apple Silicon (MPS)"
        test_state.gpu_info.vram_gb = 36
        test_state.gpu_info.gpu_info = {"name": "Apple Silicon (MPS)", "vram": 36864, "vramUsed": 0}

        r = client.get("/api/gpu-info")
        assert r.status_code == 200
        data = r.json()
        assert data["cuda_available"] is False
        assert data["mps_available"] is True
        assert data["gpu_available"] is True
        assert data["gpu_name"] == "Apple Silicon (MPS)"
        assert data["vram_gb"] == 36

FROM python:3.12-slim

WORKDIR /app

# System dependencies for onnxruntime (rembg) and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Writable path for U2NET model download (rembg)
ENV U2NET_HOME=/tmp/.u2net

# Install dependencies first for layer caching
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application code
COPY alcheme/ alcheme/
COPY server.py .

# Cloud Run default port
EXPOSE 8080

# Run with uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]

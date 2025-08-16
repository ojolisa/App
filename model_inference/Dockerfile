# Inference (Flask + PyTorch) Dockerfile
FROM python:3.10-slim

ARG TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu

# Prevents Python from writing .pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONWARNINGS=ignore

# Install system dependencies for pillow/torch (basic)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir --index-url ${TORCH_INDEX_URL} \
       torch torchvision

# Copy model and server code
COPY inference.py ./
COPY discriminator_cnn.pth ./

ENV FLASK_RUN_PORT=3000
EXPOSE 3000

# Health: quickly fail if model file missing
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD test -f /app/discriminator_cnn.pth || exit 1

CMD ["python", "inference.py"]

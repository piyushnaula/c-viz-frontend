FROM python:3.11-slim

# Install clang and LLVM
RUN apt-get update && apt-get install -y \
    clang \
    llvm \
    libclang-dev \
    && rm -rf /var/lib/apt/lists/* \
    # Find libclang.so.1 and symlink it to /usr/lib/libclang.so
    && find /usr/lib -name "libclang.so.1" -exec ln -s {} /usr/lib/libclang.so \;

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"

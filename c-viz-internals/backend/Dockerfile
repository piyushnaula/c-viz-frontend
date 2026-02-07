FROM python:3.11-slim

# Install clang-14 and LLVM-14 explicitely for compatibility
RUN apt-get update && apt-get install -y \
    clang-14 \
    llvm-14 \
    libclang-14-dev \
    && rm -rf /var/lib/apt/lists/* \
    # Symlink clang-14 to clang for general usage
    && ln -s /usr/bin/clang-14 /usr/bin/clang \
    # Find libclang.so.1 (usually inside llvm-14/lib) and symlink it
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

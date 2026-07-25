import redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class SafeRedis:
    def __init__(self, client):
        self.client = client
        self.is_connected = False
        try:
            self.client.ping()
            self.is_connected = True
            print("[OK] Redis connected")
        except redis.ConnectionError:
            print("[ERROR] Redis connection failed - stats endpoint falling back to MongoDB")

    def get(self, name):
        if not self.is_connected:
            return None
        try:
            return self.client.get(name)
        except redis.ConnectionError:
            self.is_connected = False
            return None

    def set(self, name, value, ex=None, px=None, nx=False, xx=False, keepttl=False):
        if not self.is_connected:
            return None
        try:
            return self.client.set(name, value, ex=ex, px=px, nx=nx, xx=xx, keepttl=keepttl)
        except redis.ConnectionError:
            self.is_connected = False
            return None

    def delete(self, *names):
        if not self.is_connected:
            return 0
        try:
            return self.client.delete(*names)
        except redis.ConnectionError:
            self.is_connected = False
            return 0

    def ping(self):
        try:
            return self.client.ping()
        except redis.ConnectionError:
            return False

# Initialize base client and wrap it
_raw_client = redis.from_url(REDIS_URL, decode_responses=True)
redis_client = SafeRedis(_raw_client)

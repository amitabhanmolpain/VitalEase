import redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class SafeRedis:
    def __init__(self, client):
        self.client = client
        self.is_connected = False
        self.memory_db = {}
        try:
            self.client.ping()
            self.is_connected = True
            print("[OK] Redis connected")
        except redis.ConnectionError:
            print("[INFO] Redis server not detected. Falling back to active in-memory dictionary cache.")

    def get(self, name):
        if not self.is_connected:
            return self.memory_db.get(name)
        try:
            return self.client.get(name)
        except redis.ConnectionError:
            self.is_connected = False
            return self.memory_db.get(name)

    def set(self, name, value, ex=None, px=None, nx=False, xx=False, keepttl=False):
        if not self.is_connected:
            self.memory_db[name] = value
            return True
        try:
            return self.client.set(name, value, ex=ex, px=px, nx=nx, xx=xx, keepttl=keepttl)
        except redis.ConnectionError:
            self.is_connected = False
            self.memory_db[name] = value
            return True

    def delete(self, *names):
        if not self.is_connected:
            count = 0
            for name in names:
                if name in self.memory_db:
                    del self.memory_db[name]
                    count += 1
            return count
        try:
            return self.client.delete(*names)
        except redis.ConnectionError:
            self.is_connected = False
            count = 0
            for name in names:
                if name in self.memory_db:
                    del self.memory_db[name]
                    count += 1
            return count

    def ping(self):
        if not self.is_connected:
            return True
        try:
            return self.client.ping()
        except redis.ConnectionError:
            return True

# Initialize base client and wrap it
_raw_client = redis.from_url(REDIS_URL, decode_responses=True)
redis_client = SafeRedis(_raw_client)

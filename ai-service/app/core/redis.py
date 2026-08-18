import os
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
)

async def check_redis():
    return await redis_client.ping()

async def get_cache(key: str):
    return await redis_client.get(key)

async def set_cache(key: str, value: str, ttl: int):
    await redis_client.set(key, value, ex=ttl)
"""
Redis caching utilities for performance optimization.
Provides functions for get, set, and invalidate cache with proper error handling.
"""

import redis
import json
import logging
from typing import Optional, Any
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize Redis client with connection pooling
redis_client: Optional[redis.Redis] = None

try:
    if settings.CACHE_ENABLED:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
            retry_on_timeout=True,
            health_check_interval=30
        )
        # Test connection
        redis_client.ping()
        logger.info("✅ Redis connected successfully")
except redis.ConnectionError as e:
    logger.warning(f"⚠️  Redis connection failed: {e}. Caching disabled.")
    redis_client = None
except Exception as e:
    logger.error(f"❌ Redis initialization error: {e}. Caching disabled.")
    redis_client = None


def is_cache_available() -> bool:
    """Check if Redis cache is available"""
    if not settings.CACHE_ENABLED or redis_client is None:
        return False
    try:
        redis_client.ping()
        return True
    except:
        return False


def get_cache(key: str) -> Optional[Any]:
    """
    Get value from cache.

    Args:
        key: Cache key

    Returns:
        Cached value if exists, None otherwise
    """
    if not is_cache_available():
        return None

    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Cache JSON decode error for key '{key}': {e}")
        return None
    except Exception as e:
        logger.error(f"Cache get error for key '{key}': {e}")
        return None


def set_cache(key: str, value: Any, ttl: int) -> bool:
    """
    Set value to cache with TTL (Time To Live).

    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        ttl: Time to live in seconds

    Returns:
        True if successful, False otherwise
    """
    if not is_cache_available():
        return False

    try:
        serialized = json.dumps(value, default=str, ensure_ascii=False)
        redis_client.setex(key, ttl, serialized)
        return True
    except (TypeError, ValueError) as e:
        logger.error(f"Cache serialization error for key '{key}': {e}")
        return False
    except Exception as e:
        logger.error(f"Cache set error for key '{key}': {e}")
        return False


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate cache by pattern.

    Args:
        pattern: Cache key pattern (supports wildcards like 'user:*')

    Returns:
        Number of keys deleted
    """
    if not is_cache_available():
        return 0

    try:
        keys = redis_client.keys(pattern)
        if keys:
            deleted = redis_client.delete(*keys)
            logger.info(f"Invalidated {deleted} cache keys matching '{pattern}'")
            return deleted
        return 0
    except Exception as e:
        logger.error(f"Cache invalidation error for pattern '{pattern}': {e}")
        return 0


def delete_cache(key: str) -> bool:
    """
    Delete specific cache key.

    Args:
        key: Cache key to delete

    Returns:
        True if deleted, False otherwise
    """
    if not is_cache_available():
        return False

    try:
        deleted = redis_client.delete(key)
        return deleted > 0
    except Exception as e:
        logger.error(f"Cache delete error for key '{key}': {e}")
        return False


def get_cache_stats() -> dict:
    """
    Get Redis cache statistics.

    Returns:
        Dictionary with cache stats or empty dict if unavailable
    """
    if not is_cache_available():
        return {"status": "disabled"}

    try:
        info = redis_client.info()
        return {
            "status": "connected",
            "used_memory": info.get("used_memory_human", "N/A"),
            "connected_clients": info.get("connected_clients", 0),
            "total_keys": redis_client.dbsize(),
            "uptime_seconds": info.get("uptime_in_seconds", 0)
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        return {"status": "error", "message": str(e)}

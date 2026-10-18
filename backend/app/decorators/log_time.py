
import functools
import logging
import time

logger = logging.getLogger("app")


def log_execution_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()

        try:
            return func(*args, **kwargs)
        finally:
            execution_time = time.perf_counter() - start_time

            logger.info(
                "Function execution completed",
                extra={
                    "function_name": func.__qualname__,
                    "execution_time_seconds": round(execution_time, 4),
                },
            )

    return wrapper

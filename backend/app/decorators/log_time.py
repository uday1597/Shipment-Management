import time
import functools
import logging

logger = logging.getLogger("app")

def log_execution_time(func):
    @functools.wraps(func)  # Keeps the original function's name and type hints intact
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        
        # Execute the actual function
        result = func(*args, **kwargs)
        
        end_time = time.perf_counter()
        execution_time = end_time - start_time
        logger.info(f"⏱️ Function '{func.__name__}' took {execution_time:.4f}s to execute.")
        return result
    return wrapper
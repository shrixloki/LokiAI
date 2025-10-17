import logging
import os
import sys
from pythonjsonlogger import jsonlogger


def configure_logging(service: str = 'lokiai-rebalancer') -> logging.Logger:
    """Configure JSON logging to stdout with consistent fields."""
    logger = logging.getLogger()
    logger.setLevel(os.getenv('LOG_LEVEL', 'INFO').upper())

    # Clear existing handlers to avoid duplicates
    for h in list(logger.handlers):
        logger.removeHandler(h)

    log_handler = logging.StreamHandler(sys.stdout)

    fmt = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(levelname)s %(name)s %(message)s %(pathname)s %(lineno)s %(process)d %(thread)d',
        rename_fields={'levelname': 'level', 'asctime': 'ts', 'name': 'logger'}
    )
    log_handler.setFormatter(fmt)

    logger.addHandler(log_handler)

    # Add contextual default
    logging.LoggerAdapter(logger, extra={'service': service})

    # Reduce noisy loggers if desired
    logging.getLogger('aiohttp').setLevel('WARNING')
    logging.getLogger('urllib3').setLevel('WARNING')

    return logger
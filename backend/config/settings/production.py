from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:4200",
).split(",")

CORS_ALLOW_ALL_ORIGINS = False

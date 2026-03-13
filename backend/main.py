import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import SESSIONS_DIR
from backend.routes.session import router as session_router
from backend.routes.upload import router as upload_router
from backend.routes.preview import router as preview_router
from backend.routes.generate import router as generate_router
from backend.routes.download import router as download_router
from backend.routes.fonts import router as fonts_router
from backend.routes.thumbnail import router as thumbnail_router
from backend.routes.debug import router as debug_router
from backend.routes.debug_output import router as debug_output_router
from backend.routes.routes_debug import router as routes_debug_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Allow redirect slashes so /upload/template/ can be redirected to /upload/template
app = FastAPI(title="CertGen API", redirect_slashes=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(session_router)
app.include_router(upload_router)  # upload.py already defines /upload/* paths
app.include_router(preview_router)
app.include_router(generate_router)
app.include_router(download_router)
app.include_router(fonts_router)
app.include_router(thumbnail_router)  # serves /upload/template/thumbnail/{session_id}
app.include_router(debug_router)
app.include_router(debug_output_router)
app.include_router(routes_debug_router)


@app.on_event("startup")
async def startup():
    logger.info(f"Sessions directory: {SESSIONS_DIR}")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Server shutting down.")


@app.on_event("startup")
async def _log_routes():
    try:
        routes = []
        for r in app.router.routes:
            path = getattr(r, "path", None)
            methods = getattr(r, "methods", None)
            if path and methods:
                routes.append(f"{sorted(list(methods))} {path}")
        logger.info("Registered routes:\n%s", "\n".join(sorted(routes)))
    except Exception as e:
        logger.warning("Failed to list routes: %s", e)
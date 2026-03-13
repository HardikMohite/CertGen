from fastapi import APIRouter

router = APIRouter()


@router.get("/debug/routes")
def list_routes():
    from backend.main import app

    paths = []
    for r in app.router.routes:
        path = getattr(r, "path", None)
        methods = sorted(list(getattr(r, "methods", []) or []))
        if path:
            paths.append({"path": path, "methods": methods})

    return {"routes": sorted(paths, key=lambda x: x["path"])}

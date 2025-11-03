import asyncio
from fastapi import FastAPI
app=FastAPI()

from .routers import utils_misc, jobs, letters
app.include_router(utils_misc.router)
app.include_router(jobs.router)
app.include_router(letters.router)

from .routers import admin_legal
app.include_router(admin_legal.router, tags=['admin'])

from .routers import admin_jobs
app.include_router(admin_jobs.router, tags=['admin'])


@app.on_event("startup")
async def _start_nightly_fill_task():
    async def _nightly_state_fill_task():
        while True:
            try:
                admin_jobs._fill_states_now()
            except Exception:
                pass
            await asyncio.sleep(60*60*24)  # 24h
    app.state._nightly_fill = asyncio.create_task(_nightly_state_fill_task())

@app.on_event("shutdown")
async def _stop_nightly_fill_task():
    task = getattr(app.state, "_nightly_fill", None)
    if task: task.cancel()

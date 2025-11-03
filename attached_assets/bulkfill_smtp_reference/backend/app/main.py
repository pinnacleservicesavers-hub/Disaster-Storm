
from fastapi import FastAPI
app=FastAPI()
from .routers import admin_legal, admin_smtp, admin_jobs, utils_misc, jobs
app.include_router(admin_legal.router)
app.include_router(admin_smtp.router)
app.include_router(admin_jobs.router)
app.include_router(utils_misc.router)
app.include_router(jobs.router)

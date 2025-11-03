from fastapi import FastAPI
app=FastAPI()

from .routers import admin_oidc
app.include_router(admin_oidc.router, tags=['admin'])

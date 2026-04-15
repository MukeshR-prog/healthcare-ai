from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db.connection import close_mongo_connection, connect_to_mongo, get_mongo_database
from app.db.init_db import ensure_collections_and_indexes


@asynccontextmanager
async def lifespan(_: FastAPI):
	connect_to_mongo()
	ensure_collections_and_indexes(get_mongo_database())
	yield
	close_mongo_connection()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)
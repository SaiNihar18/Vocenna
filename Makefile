.PHONY: help build up down logs test migrate clean restart

help:
	@echo "Vocenna Development & Deployment Shortcuts"
	@echo "------------------------------------------"
	@echo "make build    - Build Docker containers"
	@echo "make up       - Start all containers in background"
	@echo "make down     - Stop all containers"
	@echo "make logs     - Tail container logs"
	@echo "make test     - Run pytest suite inside container"
	@echo "make migrate  - Run Alembic database migrations"
	@echo "make restart  - Restart all containers"
	@echo "make clean    - Remove unused Docker resources"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

test:
	docker compose run --rm app pytest

migrate:
	docker compose exec app alembic upgrade head

restart:
	docker compose restart

clean:
	docker system prune -f

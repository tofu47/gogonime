.PHONY: help install dev build preview test lint clean

help:
	@echo "GoGoAnime Frontend - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup:"
	@echo "  make install           - Install dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev               - Start development server"
	@echo "  make build             - Build for production"
	@echo "  make preview           - Preview production build"
	@echo ""
	@echo "Quality:"
	@echo "  make lint              - Run ESLint"
	@echo "  make test              - Run tests"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean             - Remove build artifacts"
	@echo ""

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

test:
	npm run test

clean:
	rm -rf dist/ node_modules/ .turbo

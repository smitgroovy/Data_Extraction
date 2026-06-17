# Data Extraction Product Workspace

This workspace contains the frontend and backend applications for the Data Extraction product. It provides a set of tools and scripts to easily manage both applications.

## Project Structure

- `frontend/` - Frontend application
- `backend/` - Backend application
- `agents/` - Agent-related code
- `data/` - Data storage/processing
- `scripts/` - Assorted utility scripts

## Quick Start

To install dependencies for all packages within the workspace, run:

```bash
npm run install:all
```

## Available Scripts

The root `package.json` provides several scripts to manage the applications:

- **`npm run dev`**: Starts the frontend development server.
- **`npm run build`**: Builds the frontend application for production.
- **`npm run server`**: Starts the backend server.
- **`npm run extract`**: Runs the data extraction process on the backend.

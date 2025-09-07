Loki.AI
A combined Blockchain + AI Project
Status: 🚧 In Development
Demo Video: https://drive.google.com/file/d/1nLhSK99C3LHHQoPAALbXomUnGBvWeUlN/view?usp=sharing
Tech Stack
Frontend: React, Vite, TypeScript, TailwindCSS

Backend: Rust (primary), Python (optional microservices)

Smart Contracts: [planned]

Database: PostgreSQL (with migration scripts)

Node Tools: Bun, Vite

Package Management: npm, bun

Other: .env config, VS Code workspace

Folder Structer:

LokiAi/
│
├── .vscode/
├── dist/
├── loki/
│   ├── .cargo/
│   ├── .env
│   ├── Cargo.lock
│   ├── Cargo.toml
│   ├── loki1/
│   ├── simple-bot/
│   ├── src/
│   └── migrations/
├── node_modules/
├── public/
├── src/
├── .env
├── .gitignore
├── backend_server.js
├── backend-server.js
├── bun.lockb
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
└── ...
     
How to Run
1. Frontend (React/Vite)
bash
# In LokiAi folder
npm install
npm run dev
# or with bun
bun install
bun run dev
Access at: http://localhost:5173 (default Vite port)

2. Rust Backend
bash
# In loki/ or backend folder
cargo build
cargo run
# Ensure PostgreSQL is running and .env configuration is set
The backend listens on the port specified in .env/Cargo.toml

3. Python Services (Optional)
bash
# (If using Python microservices)
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate for Windows
pip install -r requirements.txt
python <your_service_script>.py
4. Database Migrations
bash
# With diesel or custom migration tool in migrations/ folder
# Example:
diesel migration run
Development Progress
Major features and services are under active development.

Folder/module structure and APIs may change.

Migration scripts are evolving—always check both backend and migrations status before running in production.


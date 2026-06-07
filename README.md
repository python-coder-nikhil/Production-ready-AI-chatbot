# AI Chatbot

An open-source AI chatbot application built with Django REST API backend and ReactJS frontend, supporting both Hugging Face and Ollama models.

## Features

- **Multiple AI Model Support**: Integrate with Hugging Face or Ollama models
- **User Authentication**: Email/password and Google OAuth authentication
- **Conversation Management**: Create, rename, delete, and search conversations
- **Semantic Search**: Vector-based semantic search using sentence transformers
- **User Memory**: Store and retrieve user-specific information
- **Voice Input**: Speech recognition for hands-free input
- **File Upload**: Support for image and text file uploads
- **Dark/Light Mode**: Toggle between themes
- **Export Chats**: Download conversations as text files
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

```
ReactJS Frontend
        |
        v
Django REST API
        |
        v
Chat Service Layer
        |
        +------ Hugging Face
        |
        +------ Ollama
```

### Technology Stack

**Backend:**
- Django 5.x
- Django REST Framework
- PostgreSQL with pgvector
- Sentence Transformers (for embeddings)
- Hugging Face Integration
- JWT Authentication (SimpleJWT)
- Django CORS Headers

**Frontend:**
- React 19
- React Router
- Axios
- Bootstrap 5
- TailwindCSS
- Lucide Icons
- Google OAuth

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Hugging Face API key (or Ollama installed locally)

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd "django server"
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
DEBUG=False
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
PG_DB_NAME=chatbot_db
PG_DB_USER=chatbot_user
PG_DB_PASSWORD=your-database-password
PG_DB_HOST=localhost
PG_DB_PORT=5432

# Hugging Face Configuration
HF_API_URL=https://api-inference.huggingface.co/models/your-model-name
HF_API_KEY=your-huggingface-api-key
HF_MODEL=your-model-name

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional: Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### 5. Setup PostgreSQL Database

Make sure PostgreSQL is running and pgvector extension is installed:

```sql
CREATE DATABASE chatbot_db;
CREATE USER chatbot_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE chatbot_db TO chatbot_user;
\c chatbot_db
CREATE EXTENSION IF NOT EXISTS vector;
```

### 6. Run Migrations

```bash
python manage.py migrate
```

### 7. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 8. Run Development Server

```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd chatbot-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APP_NAME=AI Chatbot
```

### 4. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Production Build

### Frontend Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Backend Production Settings

For production, ensure:

- `DEBUG=False` in `.env`
- Set a strong `SECRET_KEY`
- Configure proper `ALLOWED_HOSTS`
- Use a production database
- Set up HTTPS
- Configure static file serving
- Use a production WSGI server (e.g., Gunicorn)

## API Endpoints

### Authentication

- `POST /api/login` - Login with email/password or Google OAuth
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Conversations

- `GET /api/get-conversations` - Get user's conversations
- `POST /api/create-conversation-or-message` - Create conversation or message
- `POST /api/delete-conversation` - Delete a conversation
- `POST /api/rename-conversation` - Rename a conversation

### Messages

- `GET /api/get-user-messages` - Get messages for a conversation
- `POST /api/ai-response` - Get AI response

### Search

- `POST /api/search` - Search conversations and messages (semantic + keyword)

### Health Check

- `GET /` - Server health check
- `GET /api/check-db-connection` - Database connection check

## Security Features

- JWT-based authentication
- CORS configuration
- CSRF protection
- Password validation
- Environment variable configuration
- SQL injection prevention (Django ORM)
- XSS protection (React)

## Development

### Running Tests

```bash
# Backend
cd "django server"
python manage.py test

# Frontend
cd chatbot-frontend
npm run lint
```

### Code Style

- Backend: PEP 8
- Frontend: ESLint with React rules

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Hugging Face for AI model hosting
- Ollama for local LLM support
- Django and React communities
- All contributors

## Support

For issues, questions, or contributions, please open an issue on GitHub.

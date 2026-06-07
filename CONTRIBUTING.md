# Contributing to AI Chatbot

Thank you for your interest in contributing to the AI Chatbot project! We welcome contributions from developers of all skill levels.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions with the project.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Environment details (OS, Python/Node versions, etc.)
- Any relevant error messages or logs

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the proposed enhancement
- Explain why this enhancement would be useful
- Provide examples or mockups if applicable

### Pull Requests

#### Before Submitting

1. **Fork the repository** and create your branch from `main`
2. **Read the code** and understand the project structure
3. **Set up the development environment** following the README
4. **Make your changes** following the coding standards
5. **Test your changes** thoroughly
6. **Update documentation** if needed

#### Coding Standards

**Backend (Python/Django):**
- Follow PEP 8 style guidelines
- Use descriptive variable and function names
- Add docstrings to functions and classes
- Keep functions small and focused
- Write tests for new features
- Use type hints where appropriate

**Frontend (React/JavaScript):**
- Follow ESLint rules
- Use functional components with hooks
- Use descriptive variable and function names
- Add comments for complex logic
- Keep components small and focused
- Follow React best practices

#### Commit Messages

Use clear and descriptive commit messages:

```
feat: add user profile page
fix: resolve authentication token expiration issue
docs: update API documentation
style: format code according to linting rules
refactor: simplify conversation search logic
test: add unit tests for message service
chore: update dependencies
```

#### Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure all tests pass
3. Update the CHANGELOG.md with your changes
4. Your PR should have a clear title and description
5. Link to any related issues
6. Wait for code review and address feedback

## Development Workflow

### Setting Up Development Environment

1. Fork and clone the repository
2. Follow the setup instructions in README.md for both backend and frontend
3. Create a new branch for your feature or bugfix

```bash
git checkout -b feature/your-feature-name
```

### Running Tests

**Backend:**
```bash
cd "django server"
python manage.py test
```

**Frontend:**
```bash
cd chatbot-frontend
npm run lint
```

### Making Changes

1. Make your changes following the coding standards
2. Test your changes locally
3. Commit your changes with a clear message
4. Push to your fork
5. Create a pull request

## Project Structure

```
chatbot_project/
├── django server/          # Django backend
│   ├── chatbot_app/       # Main application
│   │   ├── api/          # API endpoints
│   │   ├── migrations/   # Database migrations
│   │   ├── models.py     # Database models
│   │   ├── serializers.py # DRF serializers
│   │   ├── utils.py      # Utility functions
│   │   └── views.py      # View functions
│   ├── chatbot_server/   # Project settings
│   ├── manage.py         # Django management script
│   └── requirements.txt   # Python dependencies
├── chatbot-frontend/      # React frontend
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api/        # API calls
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   │   └── App.jsx     # Main app component
│   ├── package.json    # Node dependencies
│   └── vite.config.js  # Vite configuration
└── README.md           # Project documentation
```

## Areas Where We Need Help

- **Testing**: Add more unit and integration tests
- **Documentation**: Improve code documentation and API docs
- **UI/UX**: Enhance the user interface and experience
- **Performance**: Optimize database queries and frontend rendering
- **Features**: Add new features like:
  - Multi-language support
  - More AI model integrations
  - Advanced search filters
  - Conversation export in different formats
  - User settings and preferences
  - Notification system

## Getting Help

If you need help:

- Read the documentation in the README
- Check existing issues and pull requests
- Ask questions in an issue (tag with `question`)
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be acknowledged in the project's CONTRIBUTORS file and in release notes.

Thank you for contributing to AI Chatbot!

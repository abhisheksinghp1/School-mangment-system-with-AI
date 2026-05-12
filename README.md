# AI-Powered School Management ERP System

A comprehensive school management system built with FastAPI, React.js, and AI integration using LangChain and OpenAI.

## Features

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control
- Password hashing with bcrypt
- Secure API endpoints

### 👥 Multi-Role System
- **Student**: View attendance, homework, marks, and interact with AI assistant
- **Teacher**: Mark attendance, assign homework, upload marks, generate reports
- **Parent**: Monitor child's progress, view reports, receive notifications
- **Management**: Full system access, analytics, and administrative functions

### 🤖 AI Integration
- **Student AI Assistant**: Academic guidance, performance analysis, homework help
- **Teacher AI Agent**: Lesson planning, student assessment, administrative tasks
- **Parent AI Assistant**: Child performance insights, educational recommendations
- **Management AI Agent**: School analytics, performance prediction, strategic insights

### 📊 Core Features
- Attendance management with detailed tracking
- Homework assignment and submission tracking
- Marks and grade management
- Comprehensive reporting system
- Real-time notifications
- Performance analytics and trends

## Tech Stack

### Backend
- **FastAPI**: High-performance async web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Robust relational database
- **JWT**: Secure authentication
- **LangChain**: AI agent framework
- **OpenAI**: LLM integration

### Frontend
- **React.js**: Modern UI framework
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing
- **Lucide React**: Icon library

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── database.py          # Database configuration
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routes/              # API routes
│   │   ├── auth/                # Authentication utilities
│   │   ├── ai_agents/           # LangChain AI agents
│   │   └── services/            # Business logic
│   ├── requirements.txt         # Python dependencies
│   └── .env.example           # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── pages/              # React components
│   │   ├── components/          # Reusable UI components
│   │   ├── context/            # React context
│   │   ├── services/           # API service layer
│   │   └── App.js             # Main React component
│   ├── package.json            # Node.js dependencies
│   └── tailwind.config.js     # Tailwind configuration
└── README.md
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and OpenAI API key
   ```

5. **Set up database**
   ```sql
   -- Create PostgreSQL database
   CREATE DATABASE school_erp;
   ```

6. **Run database migrations**
   ```bash
   # Create and run migrations (if using Alembic)
   alembic upgrade head
   ```

7. **Start the backend server**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env if backend runs on different port
   ```

4. **Start the frontend server**
   ```bash
   npm start
   ```

## API Documentation

Once the backend is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usage

### 1. User Registration
Create users with different roles through the API or directly in the database.

### 2. Login
Use the login page to authenticate with your credentials.

### 3. Role-Based Dashboards
Based on your role, you'll be redirected to the appropriate dashboard:
- **Students**: Academic overview, attendance, homework, AI assistant
- **Teachers**: Class management, attendance marking, homework assignment
- **Parents**: Child monitoring, progress reports
- **Management**: School analytics, administrative functions

### 4. AI Assistant
Access the AI chat feature for role-specific assistance:
- Students: Get help with homework and understand concepts
- Teachers: Assistance with lesson planning and student assessment
- Parents: Insights about child's performance
- Management: Strategic analytics and school optimization

## Database Schema

### Core Tables
- **users**: User authentication and role management
- **students**: Student information and academic records
- **teachers**: Teacher profiles and assignments
- **parents**: Parent information and relationships
- **management**: Administrative staff details
- **classes**: Class organization and assignments
- **subjects**: Subject catalog
- **attendance**: Attendance tracking
- **homework**: Assignment management
- **exams**: Examination records
- **marks**: Grade and performance data
- **notifications**: Communication system
- **salary**: Teacher compensation
- **ai_logs**: AI interaction tracking

## AI Agent Capabilities

### Student Agent
- View attendance statistics
- Check homework assignments
- Analyze academic performance
- Identify weak subjects
- Provide study recommendations

### Teacher Agent
- Mark attendance for classes
- Assign homework automatically
- Upload and manage grades
- Generate performance reports
- Identify at-risk students
- Send notifications to parents

### Parent Agent
- Monitor child's academic progress
- View attendance and homework
- Understand performance reports
- Get educational recommendations
- Track improvement areas

### Management Agent
- Generate school-wide analytics
- Monitor performance trends
- Predict student outcomes
- Identify at-risk populations
- Create comprehensive reports
- Optimize resource allocation

## Security Features

- JWT-based authentication with expiration
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection protection through SQLAlchemy
- CORS configuration
- Input validation with Pydantic
- Secure API endpoints

## Performance Optimization

- Async/await for database operations
- Database indexing on frequently queried fields
- Pagination for large datasets
- React component optimization
- Efficient state management
- Caching strategies (implement as needed)

## Development

### Adding New Features
1. **Backend**: Create new models, schemas, and routes
2. **Frontend**: Add new components and API integration
3. **AI**: Extend agents with new tools and capabilities

### Testing
- Backend: Use pytest for API testing
- Frontend: Use React Testing Library
- Integration: Test end-to-end workflows

## Deployment

### Backend Deployment
1. Set up production database
2. Configure environment variables
3. Use Gunicorn or similar WSGI server
4. Set up reverse proxy (Nginx)
5. Configure SSL/TLS

### Frontend Deployment
1. Build the React application
2. Deploy to static hosting service
3. Configure API endpoint URLs
4. Set up CDN for assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the database schema
- Consult the AI agent documentation

## Future Enhancements

- Mobile application
- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Integration with external educational tools
- Automated report generation
- Video conferencing integration
- Online examination system
- Fee management system
- Library management
- Transportation management

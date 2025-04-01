# NotesManager

NotesManager is a modern web application that allows users to manage their notes securely and intuitively. The application offers features for creating, modifying, deleting, and searching notes, with robust authentication and a responsive user interface.

## Features

### Notes Management
- Create notes with title and description
- View list of personal notes
- Edit existing notes
- Delete notes
- Search notes by title
- Search notes by creation date

### Security
- JWT token authentication
- Route protection
- Token validity duration of 1 hour
- Data validation

### User Interface
- Modern and responsive design
- Smooth animations and transitions
- Intuitive interface
- Error handling
- Confirmation messages

## Technologies Used

### Frontend
- React.js
- Material-UI
- Axios for API calls
- React Router for navigation
- TypeScript

### Backend
- C# .NET 8 Web API
- SQL Server
- Entity Framework Core
- Microsoft Identity
- JWT Authentication

## Prerequisites

- Node.js (v14 or higher)
- .NET 8 SDK
- SQL Server
- Visual Studio 2022 or VS Code

## Installation

1. Clone the repository
```bash
git clone [REPO_URL]
```

2. Backend Setup
```bash
cd NotesManager.API
dotnet restore
dotnet build
```

3. Database Setup
- Open SQL Server Management Studio
- Create a new database
- Update the connection string in `appsettings.json`

4. Frontend Setup
```bash
cd notes-manager-client
npm install
```

## Running the Application

1. Start the Backend
```bash
cd NotesManager.API
dotnet run
```

2. Start the Frontend
```bash
cd notes-manager-client
npm start
```

The application will be available at: `http://localhost:3000`

## Project Structure

```
NotesManager/
├── NotesManager.API/           # Backend API
│   ├── Controllers/           # API Controllers
│   ├── Models/               # Data Models
│   ├── DTOs/                 # Data Transfer Objects
│   ├── Data/                 # Database Context
│   └── Services/             # Business Services
│
└── notes-manager-client/      # Frontend React
    ├── src/
    │   ├── components/       # React Components
    │   ├── services/         # API Services
    │   ├── types/           # TypeScript Types
    │   └── utils/           # Utilities
    └── public/              # Static Files
```

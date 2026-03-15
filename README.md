# LitePost

A lightweight, self-hosted Postman clone built with Node.js, Express, and SQLite.

## Features

- **Save & Manage Requests**: Create, edit, and delete HTTP requests
- **Server-Side Proxy**: Execute requests via `/api/proxy` endpoint to bypass CORS
- **Variable Substitution**: Use `{{variable_name}}` syntax in URLs and request bodies
- **Bulk Run with CSV**: Upload CSV files to iterate through rows and inject values into placeholders
- **SQLite Database**: Persistent storage using better-sqlite3

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **HTTP Client**: Axios
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **CSV Parsing**: csv-parser
- **File Upload**: Multer

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on `http://localhost:8081`

## API Endpoints

### Request Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests` | List all saved requests |
| POST | `/api/requests` | Create a new request |
| PUT | `/api/requests/:id` | Update an existing request |
| DELETE | `/api/requests/:id` | Delete a request |

### Request Execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/proxy` | Execute a request (bypasses CORS) |
| POST | `/api/bulk-run` | Bulk execute with CSV variable injection |

## Usage

### Creating a Request

```bash
curl -X POST http://localhost:8081/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API",
    "method": "GET",
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "headers": "Content-Type: application/json",
    "body": "{\"title\":\"test\",\"body\":\"body\",\"userId\":1}"
  }'
```

### Executing a Request via Proxy

```bash
curl -X POST http://localhost:8081/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"requestId": 1}'
```

### Variable Substitution

Create a request with variables:

```json
{
  "name": "Variable Test",
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/posts/{{postId}"
}
```

Execute with variables:

```bash
curl -X POST http://localhost:8081/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"requestId": 2, "postId": "1"}'
```

### Bulk Run with CSV

Upload a CSV file to execute requests with variable injection. CSV columns are mapped to `{{col0}}`, `{{col1}}`, etc.

```bash
curl -X POST http://localhost:8081/api/bulk-run \
  -H "Content-Type: application/json" \
  -F "requestId=1" \
  -F "file=@data.csv"
```

## Project Structure

```
litepost/
├── server.js          # Express server with all API endpoints
├── db.js              # Database initialization and schema
├── package.json       # Project dependencies
├── public/
│   ├── index.html     # Frontend UI
│   ├── css/
│   │   └── styles.css # Custom styles
│   └── js/
│       └── app.js     # Frontend JavaScript logic
├── plans/
│   └── litepost-architecture.md
└── data.db            # SQLite database (created on first run)
```

## License

MIT

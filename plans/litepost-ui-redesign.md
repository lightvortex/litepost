# LitePost UI Redesign - Tab-Based Architecture

## Overview
Redesign the LitePost UI to support a tab-based interface with three main tabs: **Requests**, **Runner**, and **Settings**.

## Current State Analysis

### Existing Structure
- **Layout**: Sidebar (left) + Main Content (right)
- **Current Tabs**: Editor, Headers, Body (within the main content area)
- **Features**:
  - Sidebar: Request list with create/edit/delete functionality
  - Header: Method selector, URL input, Runner button, Execute button
  - Main tabs: Editor (URL/Method), Headers, Body
  - Response panel and Console panel below editor

### Key Components to Preserve
1. Request management (create, save, edit, delete)
2. API request execution
3. CSV upload modal (already exists)
4. Dark theme styling

## New Architecture

### Tab Structure
```
┌─────────────────────────────────────────────────────────────┐
│  LitePost [Requests] [Runner]           [Settings] [Help]              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────────────────────────────────────────┐│
│  │ Sidebar  │                                              ││
│  │ Requests │  ┌────────────────────────────────────────┐  ││
│  │ List     │  │  Tab Content
│  │          │  ├                                        ┤  ││
│  │ • GET    │  │                                        │  ││
│  │ • POST   │  │              TAB CONTENT               │  ││
│  │ • PUT    │  │                                        │  ││
│  │ • DELETE │  │                                        │  ││
│  │ [+ Add]  │  │                                        │  ││
│  └──────────┴──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Tab Specifications

### 1. Requests Tab
**Purpose**: Manage API requests (create, save, edit, delete)

**Components**:
- **Request List** (sidebar integration):
  - List of saved requests with method badge and name
  - Click to select/edit
  - Delete button per item
  - "Add Request" button

- **Request Editor** (main content):
  - Method selector (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
  - URL input field
  - Headers editor (JSON format)
  - Body editor (JSON format)
  - Save/Update buttons
  - Execute button

**Data Flow**:
```
User Action → Create/Edit Request → Save to LocalStorage/API → Update List
Select Request → Load Details → Edit → Save Changes
```

### 2. Runner Tab
**Purpose**: Execute requests in bulk or repeat mode

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Runner                                                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │  CSV Upload     │  │  Repeat Mode                    ││
│  │                 │  │                                 ││
│  │  ┌─────────────┐ │  │  [Select Request]              ││
│  │  │ Select      │ │  │                                 ││
│  │  │ Request     │ │  │  ┌─────────────────────────┐   ││
│  │  │             │ │  │  │ Number of executions:   │   ││
│  │  │ [Dropdown]  │ │  │  │ [10]                    │   ││
│  │  │             │ │  │  └─────────────────────────┘   ││
│  │  └─────────────┘ │  │                                 ││
│  │                  │  │  [Trigger Button]               ││
│  │  ┌─────────────┐ │  │                                 ││
│  │  │ CSV Upload  │ │  │                                 ││
│  │  │   Button    │ │  │                                 ││
│  │  └─────────────┘ │  │                                 ││
│  │                  │  │                                 ││
│  │  CSV Preview:    │  │  Execution Log:                 ││
│  │  ┌─────────────┐ │  │  - Request 1/10: Success        ││
│  │  │ A, B, C     │ │  │  - Request 2/10: Success        ││
│  │  │ 1, 2, 3     │ │  │  - Request 3/10: Success        ││
│  │  └─────────────┘ │  │                                 ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### CSV Upload Mode
**Functionality**:
1. User selects a saved request from dropdown
2. User uploads CSV file
3. First row is treated as column names (variables)
4. Each subsequent row represents one API request execution
5. Column values replace variables in the request URL

**Example**:
- CSV:
  ```
  A,B,C
  1,2,3
  ```
- Request URL: `http://www.{{A}}.com/`
- First execution: `http://www.1.com/` (A=1)

**Variable Replacement**:
- Variable syntax: `{{COLUMN_NAME}}`
- All occurrences replaced with corresponding row values

**Execution Flow**:
```
Upload CSV → Parse Headers → For Each Row:
  → Replace Variables → Execute Request → Log Result
```

#### Repeat Mode
**Functionality**:
1. User selects a saved request from dropdown
2. User specifies number of executions
3. User clicks trigger button
4. Request executes N times sequentially
5. Results logged in execution log

**Components**:
- Request selector dropdown
- Number input for execution count
- Trigger button (e.g., "Run N Times")
- Execution log panel showing progress and results

### 3. Settings Tab
**Purpose**: Configuration and preferences (placeholder for future use)

**Current Components** (placeholder):
- Welcome message
- "Settings will be available soon" message
- Optional: About LitePost, version info

**Future Considerations**:
- API base URL configuration
- Request timeout settings
- Default headers
- Theme preferences
- Data export/import

## Technical Implementation

### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>LitePost - Lightweight API Client</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-gray-900 text-gray-100 h-screen overflow-hidden">
  <div class="flex h-full">
    <!-- Sidebar (Preserved) -->
    <aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <!-- Request List -->
    </aside>
    
    <!-- Main Content with Tabs -->
    <main class="flex-1 flex flex-col">
      <!-- New Tab Navigation -->
      <div class="flex border-b border-gray-700 bg-gray-800">
        <button onclick="showTab('requests')" id="tabRequests">Requests</button>
        <button onclick="showTab('runner')" id="tabRunner">Runner</button>
        <button onclick="showTab('settings')" id="tabSettings">Settings</button>
      </div>
      
      <!-- Tab Content Areas -->
      <div id="requestsTabContent" class="flex-1 overflow-hidden">
        <!-- Request Editor -->
      </div>
      
      <div id="runnerTabContent" class="hidden flex-1 overflow-hidden">
        <!-- Runner Interface -->
      </div>
      
      <div id="settingsTabContent" class="hidden flex-1 overflow-hidden">
        <!-- Settings Interface -->
      </div>
    </main>
  </div>
  
  <!-- CSV Upload Modal (Preserved) -->
  <div id="csvModal" class="hidden">...</div>
  
  <script src="js/app.js"></script>
</body>
</html>
```

### CSS Requirements
- Tab navigation styling (active/inactive states)
- Tab content panel layouts
- Runner tab specific layouts (side-by-side panels)
- Responsive design considerations
- Consistent with existing dark theme

### JavaScript Requirements
- Tab switching logic
- Request management (CRUD operations)
- CSV parsing and variable replacement
- Repeat mode execution logic
- Execution logging
- State persistence (LocalStorage)

## Data Models

### Request Object
```javascript
{
  id: string|number,
  name: string,
  method: string, // GET, POST, PUT, DELETE, etc.
  url: string,
  headers: object,
  body: object|string,
  createdAt: datetime,
  updatedAt: datetime
}
```

### Execution Log Entry
```javascript
{
  id: string|number,
  requestId: string|number,
  requestName: string,
  variables: object, // { A: "1", B: "2", C: "3" }
  url: string,
  method: string,
  status: string, // success, error
  statusCode: number,
  responseTime: number, // ms
  timestamp: datetime
}
```

## User Flow Diagrams

### Requests Tab Flow
```
User → Click "Add Request" → Fill Form → Click "Save" → Request Saved → Appears in List
User → Click Request in List → Load Details → Edit → Click "Update" → Updated in List
User → Click Delete → Confirm → Request Deleted
```

### Runner - CSV Mode Flow
```
User → Select Request → Click "Choose CSV" → Upload File → Parse CSV →
For Each Row:
  → Extract Variable Values → Replace in URL → Execute Request → Log Result
→ Show Completion Summary
```

### Runner - Repeat Mode Flow
```
User → Select Request → Enter Count → Click "Run N Times" →
For i = 1 to Count:
  → Execute Request → Log Result
→ Show Completion Summary
```

## Implementation Priority

1. **Phase 1**: Tab Navigation Framework
   - Create tab navigation UI
   - Implement tab switching logic
   - Preserve existing request editor

2. **Phase 2**: Requests Tab
   - Integrate sidebar request list
   - Request editor (URL, method, headers, body)
   - Save/update/delete functionality

3. **Phase 3**: Runner Tab - CSV Mode
   - CSV upload interface
   - CSV parsing logic
   - Variable replacement
   - Bulk execution

4. **Phase 4**: Runner Tab - Repeat Mode
   - Request selector
   - Execution count input
   - Trigger button
   - Execution logging

5. **Phase 5**: Settings Tab
   - Placeholder UI
   - Basic configuration options

6. **Phase 6**: Testing & Refinement
   - Cross-browser testing
   - Responsive design
   - Performance optimization

## Dependencies
- Tailwind CSS (already in use)
- LocalStorage for persistence
- No external libraries required

## Success Criteria
- ✅ Three tabs functional (Requests, Runner, Settings)
- ✅ Request CRUD operations working
- ✅ CSV upload and variable replacement working
- ✅ Repeat mode execution working
- ✅ Consistent dark theme
- ✅ Responsive design
- ✅ No breaking changes to existing functionality

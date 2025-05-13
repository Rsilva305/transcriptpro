```markdown
# Frontend Implementation Guide: AI Transcription Service MVP

**Version: 1.0**
**Date: May 13, 2025**

## 1. Document Header

This document outlines the frontend implementation strategy for the Minimum Viable Product (MVP) of an AI-powered transcription service. It covers core architectural decisions, state management, UI considerations, API integration, testing, and provides practical code examples to guide the development team.

The goal of the MVP is to provide a reliable and streamlined transcription experience, focusing on the core features identified: Audio/Video Transcription Engine integration, User Authentication and File Management, a Basic Transcript Editor, Export Options, and a foundational Freemium Model implementation.

## 2. Component Architecture

The application will follow a component-based architecture, likely using React, Vue, or Angular. For demonstration purposes, this guide will use React concepts. Components will be organized hierarchically, promoting reusability and maintainability.

**Core Component Categories:**

1.  **App Entry Point:**
    *   `App`: The root component. Handles routing and initial setup.

2.  **Layout & Navigation:**
    *   `Layout`: Contains common elements like navigation bar (`Navbar`), footer, and potentially sidebar. Wraps main content areas.
    *   `Navbar`: Application navigation, potentially user authentication status/links.

3.  **Authentication:**
    *   `LoginPage`: Form for user login.
    *   `RegisterPage`: Form for user registration.
    *   `AuthGuard`: Higher-Order Component (HOC) or custom hook to protect routes requiring authentication.

4.  **Dashboard & File Management:**
    *   `DashboardPage`: The main user landing page after login. Displays user's files and upload options.
    *   `UploadForm`: Component for selecting and uploading audio/video files (drag-and-drop, file picker). Displays upload progress.
    *   `FileList`: Displays the user's list of transcribed files.
    *   `FileItem`: Represents a single file in the list (name, status, actions like edit, delete, export).

5.  **Transcript Editor:**
    *   `TranscriptEditorPage`: Container component for the editor, potentially including playback controls and file-specific options.
    *   `TranscriptEditor`: The core component displaying the transcript text. Allows text editing. May integrate with playback (clicking text seeks audio).
    *   `PlaybackControls`: Controls for playing, pausing, seeking audio/video related to the transcript.
    *   `SpeakerLabeling` (Basic): UI elements to display/edit speaker names if the engine supports it.

6.  **Modals & Overlays:**
    *   `ExportModal`: Modal window for selecting export formats (e.g., .txt, .vtt, .srt).
    *   `DeleteConfirmationModal`: Confirming file deletion.
    *   `LoadingSpinner`: Generic component for indicating loading states.
    *   `ErrorMessage`: Generic component for displaying errors.

**Component Relationships (Simplified):**

```
App
├── Layout
│   ├── Navbar
│   └── Main Content Area
│       ├── AuthGuard (Conditional Rendering)
│       │   ├── DashboardPage
│       │   │   ├── UploadForm
│       │   │   └── FileList
│       │   │       └── FileItem (Repeated)
│       │   └── TranscriptEditorPage (Routed dynamically by file ID)
│       │       ├── TranscriptEditor
│       │       ├── PlaybackControls
│       │       └── ExportModal (Triggered from page)
│       ├── LoginPage (Public Route)
│       └── RegisterPage (Public Route)
└── Modals (Rendered outside main flow, e.g., using portals)
    ├── ExportModal
    └── DeleteConfirmationModal
```

## 3. State Management

Effective state management is crucial for handling user data, application status (loading, error), and complex UI states like the transcript editor.

**Key State Areas:**

*   **Authentication State:** `isAuthenticated`, `user` object, `authLoading`, `authError`.
*   **File List State:** `files` array, `filesLoading`, `filesError`.
*   **Upload State:** `isUploading`, `uploadProgress`, `uploadError`.
*   **Current Transcript State:** `transcriptData` (text, timestamps, speaker info), `transcriptLoading`, `transcriptError`, `isSaving`, `saveError`.
*   **Playback State:** `isPlaying`, `currentTime`, `duration`.
*   **UI State:** `modalOpen` (type/data), `activeFileId`, form input states, editor selection/cursor position (handled locally within editor component).

**Approach (React):**

*   **Global State:** Use React's **Context API** for cross-cutting concerns like `Authentication` and `FileList`. A `Reducer` can be paired with Context (`useReducer`) for more complex state transitions (e.g., managing the file list - adding, removing, updating status).
*   **Component-Specific State:** Use the `useState` hook for local component state (e.g., form inputs, toggle states, playback progress within `PlaybackControls`).
*   **Page-Specific State:** Use `useState` or `useReducer` within page components (`DashboardPage`, `TranscriptEditorPage`) to manage data specific to that view (e.g., the currently loaded `transcriptData`, editor state).
*   **Data Fetching State:** Handle `loading` and `error` states explicitly for every asynchronous operation (API calls).

**Example State Structure (Context):**

```javascript
// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // API service utility

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me'); // Example: fetch user info from backend
        setUser(response.data.user);
      } catch (err) {
        setUser(null); // User not authenticated or error fetching
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    // ... API call to login ...
    // On success: setUser(userData);
  };

  const logout = async () => {
    // ... API call to logout ...
    // On success: setUser(null);
  };

  // Provide context value
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// --- Example FileListContext ---
// src/contexts/FileListContext.js
// Similar pattern using useReducer for managing list state (ADD_FILE, REMOVE_FILE, SET_FILES, UPDATE_FILE_STATUS)
```

## 4. UI Design

The UI should prioritize a clean, intuitive workflow centered around file upload, management, and the transcription editing experience.

**Key Layout Considerations:**

*   **Authentication Pages:** Simple, centered forms. Clear calls to action (Login, Register). Links for password reset (future).
*   **Dashboard:**
    *   Prominent file upload area/button (consider drag-and-drop).
    *   A clear list of files: displaying file name, upload date, transcription status, duration, and actions (Edit, Export, Delete).
    *   Filtering/sorting options (future).
*   **Transcript Editor Page:**
    *   **Main Area:** The editable transcript text. Should be the primary focus.
    *   **Sidebar (Optional but Recommended):** File details (name, duration), playback controls, save button, export trigger, speaker list (if basic speaker ID is available).
    *   **Playback Controls:** Clearly visible play/pause button, progress bar/seekbar, current time, duration, volume control. Could be in a fixed bottom bar or in the sidebar.
*   **Modals:** Clear titles, relevant forms/options, distinct action buttons (Confirm, Cancel, Export, Download).
*   **Visual Feedback:** Use loading spinners, progress bars (for upload), success messages (toast notifications), and error messages to inform the user about the status of their actions.

**User Interactions:**

*   **File Upload:** Allow selection via button or drag-and-drop onto a designated area. Show real-time upload progress.
*   **File Management:** Clicking a file item in the list navigates to the Transcript Editor. Icons for actions (Edit, Delete, Export). Confirmation dialog for deletion.
*   **Transcript Editing:**
    *   Standard text editing capabilities (typing, deleting, selecting).
    *   Clicking on a timestamp (if displayed alongside text) should seek the associated audio/video to that point.
    *   Saving edits: Auto-save periodically or provide a clear "Save" button. Indicate unsaved changes.
*   **Playback:** Standard play/pause, seeking by clicking/dragging on the progress bar. Volume control.
*   **Export:** Triggered from the Editor page or potentially the Dashboard. Modal to select format and initiate download.

**Responsiveness:** Design should be responsive to work on different screen sizes, though the editor experience will likely be primary on larger screens.

## 5. API Integration

The frontend will communicate with the backend API to perform actions like authentication, file uploads, fetching data, saving edits, and triggering exports.

**API Client:**

Use a library like `axios` for making HTTP requests. It simplifies handling requests, responses, interceptors (for authentication tokens), and error handling.

**Base URL Configuration:**

Configure a base URL for API calls, which can be different for development, staging, and production environments.

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api', // Configure appropriately
  timeout: 30000, // 30 seconds timeout
});

// Request Interceptor: Add auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or use cookies
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized - e.g., redirect to login, clear token
      console.error('Unauthorized access. Redirecting to login.');
      // Example: Clear token and redirect
      localStorage.removeItem('authToken');
      // window.location.href = '/login'; // Use React Router navigation if available
    }
    // Specific error handling should be done at the component level
    return Promise.reject(error);
  }
);

export default api;
```

**Endpoint Examples (Matching Backend Guide):**

*   `POST /api/auth/register`: User registration.
*   `POST /api/auth/login`: User login. Returns auth token.
*   `GET /api/auth/me`: Get current authenticated user info.
*   `GET /api/files`: Get list of user's files.
*   `POST /api/files`: Upload a new file. Expects `multipart/form-data`. Backend initiates transcription.
*   `GET /api/files/:id`: Get details and transcript for a specific file.
*   `DELETE /api/files/:id`: Delete a file.
*   `PUT /api/transcripts/:fileId`: Save changes to a transcript. Sends updated transcript data.
*   `POST /api/exports/:fileId`: Request an export. Might return a download URL or trigger an asynchronous process.

**Handling API Calls in Components/Services:**

*   Wrap API calls in async functions.
*   Use `try...catch...finally` blocks to handle success, error, and loading states.
*   Update relevant state based on the API response (e.g., add new file to list on successful upload, set `isLoading(false)`).

## 6. Testing Approach

A multi-layered testing strategy will ensure the quality and stability of the frontend application.

1.  **Unit Tests:**
    *   **Focus:** Individual components in isolation, utility functions, state management logic (reducers), API service functions (mocking `axios`).
    *   **Tools:** Jest, React Testing Library (for testing React components in a way that simulates user interaction).
    *   **What to Test:** Component rendering with different props/state, event handlers, pure functions, API service function calls (verify correct URL/payload, mock successful/failed responses).

2.  **Integration Tests:**
    *   **Focus:** Interactions between multiple components, integration with the state management layer, integration with the mocked API layer.
    *   **Tools:** Jest, React Testing Library.
    *   **What to Test:** A component dispatching an action that updates state and another component reacting to that state change. Testing a container component that fetches data and renders child components based on the data/loading state.

3.  **End-to-End (E2E) Tests:**
    *   **Focus:** Simulating full user workflows in a realistic browser environment against the *running* backend application.
    *   **Tools:** Cypress or Playwright.
    *   **What to Test:**
        *   User registration and login flow.
        *   Uploading a file and seeing it appear in the list.
        *   Navigating to the editor, making an edit, saving, and verifying the change persists (requires backend state).
        *   Triggering an export and verifying the download starts.
        *   Deleting a file.
        *   Testing authenticated routes access.

**Testing Strategy Phased Approach (MVP):**

*   **Phase 1 (Core Functionality):** Prioritize unit tests for critical components (`UploadForm`, `FileItem`, parts of `TranscriptEditor`), core hooks (`useAuth`), state logic. Add integration tests for key data flows (Auth, File Listing).
*   **Phase 2 (User Flows):** Introduce E2E tests for the most critical user journeys (Upload -> View -> Edit/Save).
*   **Phase 3 (Edge Cases & Refinement):** Add more comprehensive unit/integration tests for error states, edge cases, and less critical components. Expand E2E coverage.

**Continuous Integration (CI):** Integrate tests into a CI pipeline to run on every code commit, ensuring that new changes don't break existing functionality.

## 7. Code Examples

Here are sample implementations for key frontend components/concepts using React hooks and a hypothetical `api` service.

**7.1. Basic Authentication Context (`src/contexts/AuthContext.js`)**

(See example in Section 3: State Management)

**7.2. Upload Form Component (`src/components/UploadForm.js`)**

```javascript
// src/components/UploadForm.js
import React, { useState } from 'react';
import api from '../services/api'; // Your configured axios instance
import { useFileList } from '../contexts/FileListContext'; // Assuming you have this context

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Assuming FileListContext has an action to add a new file (e.g., after successful upload)
  const { addFileToList } = useFileList();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Basic validation
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        setUploadError('Please select an audio or video file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null); // Clear previous error
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const response = await api.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      console.log('File uploaded successfully:', response.data);

      // Assuming backend returns the new file object on success
      addFileToList(response.data.file); // Add the newly uploaded file to the list context state

      setSelectedFile(null); // Clear selected file
      setUploadProgress(0); // Reset progress

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h3>Upload Audio/Video for Transcription</h3>
      <input type="file" accept="audio/*,video/*" onChange={handleFileChange} disabled={isUploading} />

      {selectedFile && (
        <p>Selected file: {selectedFile.name}</p>
      )}

      <button onClick={handleUpload} disabled={!selectedFile || isUploading}>
        {isUploading ? `Uploading (${uploadProgress}%)` : 'Start Upload'}
      </button>

      {isUploading && (
        <div>Progress: {uploadProgress}%</div>
      )}

      {uploadError && (
        <p style={{ color: 'red' }}>{uploadError}</p>
      )}

      {/* Consider adding a drag-and-drop area */}
    </div>
  );
}

export default UploadForm;
```

**7.3. File List Component (`src/components/FileList.js`)**

```javascript
// src/components/FileList.js
import React, { useEffect } from 'react';
import { useFileList } from '../contexts/FileListContext'; // Assuming you have this context
import FileItem from './FileItem'; // Component for a single file item
import api from '../services/api';

function FileList() {
  const { files, filesLoading, filesError, setFiles } = useFileList(); // Assuming context provides these

  useEffect(() => {
    const fetchFiles = async () => {
      // setFilesLoading(true); // Assuming context has loading state setter
      // setFilesError(null); // Assuming context has error state setter
      try {
        const response = await api.get('/files');
        setFiles(response.data.files); // Assuming backend returns { files: [...] }
      } catch (err) {
        console.error('Error fetching files:', err);
        // setFilesError('Failed to load files.');
        setFiles([]); // Clear list on error
      } finally {
        // setFilesLoading(false);
      }
    };

    fetchFiles();
  }, [setFiles]); // Dependency array: refetch if setFiles changes (unlikely for context setter)

  if (filesLoading) {
    return <p>Loading files...</p>; // Use a proper LoadingSpinner component
  }

  if (filesError) {
    return <p style={{ color: 'red' }}>{filesError}</p>; // Use a proper ErrorMessage component
  }

  if (!files || files.length === 0) {
    return <p>No files uploaded yet. Upload one to get started!</p>;
  }

  return (
    <div>
      <h3>Your Transcriptions</h3>
      <ul>
        {files.map(file => (
          <FileItem key={file.id} file={file} />
          // FileItem component will handle navigation to editor, delete button etc.
        ))}
      </ul>
    </div>
  );
}

export default FileList;
```

**7.4. Basic Transcript Editor Component (`src/components/TranscriptEditor.js`)**

This is a highly simplified example focusing only on text editing and saving. A real editor would need to handle timestamps, speaker labels, selection, and potentially playback synchronization.

```javascript
// src/components/TranscriptEditor.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useParams } from 'react-router-dom'; // Assuming React Router for file ID

function TranscriptEditor() {
  const { fileId } = useParams(); // Get file ID from URL
  const [transcriptText, setTranscriptText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isModified, setIsModified] = useState(false); // Track unsaved changes

  // Fetch transcript data on component mount or fileId change
  useEffect(() => {
    const fetchTranscript = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/files/${fileId}`);
        // Assuming backend returns { file: { id, name, transcript: { text, ... } } }
        setTranscriptText(response.data.file.transcript?.text || '');
        setIsModified(false); // Reset modified state after fetching
      } catch (err) {
        console.error('Failed to fetch transcript:', err);
        setError('Could not load transcript.');
        setTranscriptText(''); // Clear text on error
      } finally {
        setIsLoading(false);
      }
    };

    if (fileId) {
      fetchTranscript();
    }

  }, [fileId]); // Refetch if fileId changes

  const handleTextChange = (event) => {
    setTranscriptText(event.target.value);
    setIsModified(true); // Mark as modified
  };

  const handleSave = async () => {
    if (!isModified || isSaving) return; // Don't save if not modified or already saving

    setIsSaving(true);
    setSaveError(null);
    try {
      // Assuming backend expects PUT to /transcripts/:fileId with { text: "..." }
      await api.put(`/transcripts/${fileId}`, { text: transcriptText });
      setIsModified(false); // Mark as saved
      console.log('Transcript saved successfully.');
      // Could show a success toast notification
    } catch (err) {
      console.error('Failed to save transcript:', err);
      setSaveError('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Basic Playback Controls (Placeholder) ---
  // Integrate with HTML5 audio/video element or a library
  // const handlePlayPause = () => { /* ... playback logic ... */ };
  // const handleSeek = (time) => { /* ... playback logic ... */ };
  // --- End Playback Placeholder ---

  if (isLoading) {
    return <p>Loading transcript...</p>; // Use LoadingSpinner
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>; // Use ErrorMessage
  }

  return (
    <div>
      <h2>Transcript for File: {fileId}</h2> {/* Display file name */}

      {/* Playback Controls Placeholder */}
      {/* <PlaybackControls fileId={fileId} onSeek={handleSeek} ... /> */}
      <p>[Playback Controls Area]</p>

      <div>
        <textarea
          value={transcriptText}
          onChange={handleTextChange}
          rows="20" // Adjust size as needed
          cols="80" // Adjust size as needed
          style={{ width: '100%', minHeight: '300px' }}
          placeholder="Loading transcript..."
          disabled={isLoading || isSaving}
        />
      </div>

      <button onClick={handleSave} disabled={!isModified || isSaving}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
      {isModified && <span style={{ marginLeft: '10px', color: 'orange' }}>Unsaved changes</span>}
      {saveError && <p style={{ color: 'red' }}>{saveError}</p>}

      {/* Export Button */}
      <button onClick={() => console.log('Open Export Modal')}>Export</button> {/* Trigger ExportModal */}
    </div>
  );
}

export default TranscriptEditor;
```

These examples provide a starting point for implementing the core features, demonstrating state management, API integration, and basic component structure. Further development will involve adding more sophisticated UI elements, error handling, validation, and integrating with the backend API contract details.
```

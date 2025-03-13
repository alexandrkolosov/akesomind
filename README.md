# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Recent Updates

### Sessions Page Implementation (July 2023)

- Added a new Sessions page that displays upcoming and past therapy sessions for clients
- Integrated Sessions navigation in the sidebar menu
- Added a "View Sessions" button on client profiles
- Sessions include date, time, status, and an "Enter Session" button that appears 5 minutes before a session starts
- Responsive design that works on various screen sizes
- Support for dark and light mode themes

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## API Endpoints

The application interacts with the following API endpoints:

### Authentication Endpoints

| Endpoint                 | Method | Description                                                |
| ------------------------ | ------ | ---------------------------------------------------------- |
| `/api/public/user/token` | POST   | User login - exchange credentials for authentication token |
| `/api/user`              | GET    | Verify authentication and get current user profile         |
| `/api/public/user`       | POST   | Create a new user account (sign up)                        |

### User Profile Endpoints

| Endpoint    | Method | Description                             |
| ----------- | ------ | --------------------------------------- |
| `/api/user` | GET    | Get current user profile information    |
| `/api/user` | PUT    | Update current user profile information |

### Client Management Endpoints

| Endpoint                           | Method | Description                                      |
| ---------------------------------- | ------ | ------------------------------------------------ |
| `/api/therapist/clients`           | GET    | Get list of clients for the logged-in therapist  |
| `/api/therapist/clients/:clientId` | GET    | Get detailed information about a specific client |

### Material Management Endpoints

| Endpoint                                                        | Method | Description                                     |
| --------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `/api/material`                                                 | GET    | Get list of materials (for client or therapist) |
| `/api/material`                                                 | POST   | Create a new material                           |
| `/api/material/:materialId`                                     | DELETE | Delete a specific material                      |
| `/api/material/file`                                            | POST   | Upload a file and get a file ID                 |
| `/api/material/assigment/client/:clientId/material/:materialId` | POST   | Assign a material to a client                   |

### Session Management Endpoints

| Endpoint                  | Method | Description                                                    |
| ------------------------- | ------ | -------------------------------------------------------------- |
| `/api/session`            | GET    | Get list of sessions for the logged-in user                    |
| `/api/session/:sessionId` | GET    | Get details about a specific session with Daily.co integration |

When retrieving a specific session, the API returns a detailed response including:

- Session date, time, and duration
- Client and therapist information
- Daily.co room information and tokens for video conferencing
- Session status and other metadata

Example for joining a session using the Daily.co integration:

```javascript
// Fetch session details
const sessionId = 1; // or dynamically determined
const response = await fetch(
  `https://api.akesomind.com/api/session/${sessionId}`,
  {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }
);
const sessionData = await response.json();

// Extract Daily.co information
const { dailyCoUrl, dailyCoClientToken, dailyCoTherapistToken } = sessionData;

// Join the session (for client or therapist)
const token =
  userType === 'client' ? dailyCoClientToken : dailyCoTherapistToken;
window.location.href = `${dailyCoUrl}?t=${token}`;
```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

# Msg - A Secure Messaging Application

## Overview

Msg is a secure messaging application that allows users to communicate with friends through text and image messages. The application features end-to-end encryption to ensure privacy and security in communications.

## Features

-   User authentication (Login/Registration)

-   Secure messaging with end-to-end encryption

-   Image sharing

-   Reply to messages

-   Voice and video calling

-   User-friendly interface

-   Responsive design for mobile and desktop

-   Play youtube videos in ur messages

## Technologies Used

-   **Frontend**: React, CSS

-   **Backend**: Node.js, Express

-   **Database**: MongoDB

-   **Containerization**: Docker

-   **Encryption**: Forge, elliptic curve cryptography

-   **WebSocket**: Socket.io for real-time messaging

# Usage

## Using Docker Compose

To simplify the setup and management of your application, you can use Docker and Docker Compose. Docker Compose allows you to define and run multi-container Docker applications.

### Prerequisites

-   Ensure you have [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

- It is easier to manage containers if you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed, as it provides a user-friendly interface for managing your Docker containers and images.


### Docker Compose Configuration

The application is configured using a `docker-compose.yml` file, which defines the services, networks, and volumes needed to run the application.

### Environment Variables

Make sure to update the `.env` file in the root directory of your project (if you haven't already) and define the necessary environment variables for your application. The values u update should include:

```
# Change DB user and password
MONGODB_USER=dbUser
MONGODB_PASSWORD=dbPassword

# Change session secret
SESSION_SECRET="session secret"

# Fill in your own FCM values, or leave the default and use the application without FCM for android
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----FCM_PRIVATE_KEY"
FCM_PRIVATE_KEY_ID="FCM_PRIVATE_KEY_ID"
FCM_PROJECT_ID="FCM_PROJECT_ID"
FCM_CLIENT_EMAIL="FCM_CLIENT_EMAIL"
FCM_CLIENT_ID="FCM_CLIENT_ID"
FCM_CLIENT_X509_CERT_URL="FCM_CLIENT_X509_CERT_URL"
```

Make sure to replace the placeholder values with actual values relevant to your setup.

### Running the Application

1.  **Clone the Repository** (if you haven't already):

    ```bash
    git clone https://github.com/gijs-d/Msg-A-Secure-Messaging-Application.git
    cd Msg-A-Secure-Messaging-Application
    ```

2.  **Build and Run the Containers**:

    In the root directory of your project, run:

    ```bash
    docker-compose up
    ```

    This command will build the Docker images and start the containers defined in the `docker-compose.yml` file. The application will be accessible at `https://localhost`.

3.  **Stopping the Application**:

        To stop the running containers, you can use:
    ```
        ctrl + c
    ```

    To delete the containers, you can use:

    ```bash
        docker-compose down
    ```

4.  **After changing the DB User or Password**:

    After changing the DB user or password, you might need to delete the database volumes to connect with the new credentials:

    ```bash
    docker-compose down --volumes
    ```

## Without using Docker Compose

### Prerequisites

-   Node.js
-   npm or yarn
-   MongoDB

### Clone the Repository

```bash
git clone https://github.com/gijs-d/Msg-A-Secure-Messaging-Application.git
cd Msg-A-Secure-Messaging-Application
```

### Install Dependencies

For the frontend:

```bash
    cd frontend/react
    npm install
```

```bash
    cd frontend/server
    npm install
```

For the backend:

```bash
    cd backend
    npm install
```

### Environment Variables

Edit the `backend/.env` file in and edit the necessary environment variables:

```
MONGODB_USER=dbUser
MONGODB_PASSWORD=dbPassword
MONGODB_DATABASE=msg
MONGODB_PORT=7017
MONGODB_HOST=localhost

# If you set the CONNECTION_STRING, the other mongodb values will be ignored.
MONGODB_CONNECTION_STRING=""

# Change session secret
SESSION_SECRET="session secret"

# Fill in your own FCM values, or leave the default and use the application without FCM for android
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----FCM_PRIVATE_KEY"
FCM_PRIVATE_KEY_ID="FCM_PRIVATE_KEY_ID"
FCM_PROJECT_ID="FCM_PROJECT_ID"
FCM_CLIENT_EMAIL="FCM_CLIENT_EMAIL"
FCM_CLIENT_ID="FCM_CLIENT_ID"
FCM_CLIENT_X509_CERT_URL="FCM_CLIENT_X509_CERT_URL"
```

### Run the Application

Start the backend server:

```bash
    cd backend
    npm start
```

Build the react dist:

```bash
    cd frontend/react
    npm run build
```

Start the frontend server:

```bash
    cd frontend/server
    npm start
```

The application will be accessible at `https://localhost`.

## Screenshots

![lightDark](screenshots/lightDark.gif)
![chat](screenshots/chat.gif)
![newKeys](screenshots/newKeys.gif)
![sendImg](screenshots/sendImg.gif)
![friend](screenshots/friend.gif)
![home](screenshots/home.gif)
![moveSidebar](screenshots/moveSidebar.gif)
![responsive](screenshots/responsive.gif)
![search](screenshots/search.gif)

![notifications](screenshots/notifications.png)
![notification](screenshots/notification.png)
![otherSettings](screenshots/otherSettings.png)
![playYtMsg](screenshots/playYtMsg.png)

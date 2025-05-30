# When App API

## Firebase Cloud Function

This Firebase Cloud Function provides a backend service for [Departures iOS app](https://github.com/bez4pieci/When-App-iOS) that displays public transport departures from BVG (Berlin public transport) stations. It supports iOS Live Activities, which are updated with updated departure information via push notifications every 30 seconds.

## Features

- Scheduled function runs every minute
- Checks active Live Activities from Firestore
- Fetches real-time departure data from BVG
- Sends push notifications to update iOS Live Activities
- Automatically expires activities after 60 minutes

## Setup

### Prerequisites

1. Firebase project with Firestore and Cloud Functions enabled
2. Apple Push Notification service (APNs) credentials
3. Node.js 22

### Configuration

Create a `.env` file in the `functions` directory with the following environment variables:

```bash
APNS_KEY=YOUR_APNS_AUTH_KEY_CONTENT
APNS_KEY_ID=YOUR_APNS_KEY_ID

APPLE_DEVELOPER_TEAM_ID=YOUR_APPLE_TEAM_ID
APP_BUNDLE_ID=YOUR_APP_BUNDLE_ID
```

- [Instructions on how to create APNS key](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns#Obtain-an-encryption-key-and-key-ID-from-Apple)
- You'll find your developer team id in your [Membership Card](https://developer.apple.com/account#MembershipDetailsCard) in your Apple Developer Account

### Installation

```bash
cd functions
npm install
```

### Deployment

```bash
npm run deploy
```

## Development

1. Install [firebase CLI](https://firebase.google.com/docs/functions/local-emulator#install_the_firebase_cli)

   ```bash
   npm install -g firebase-tools
   ```

1. Get Google Firestore service account key ([instructions](https://firebase.google.com/docs/functions/local-emulator#set_up_admin_credentials_optional)) and run in your terminal:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
   ```

   Note that simply prepending it as an environment variable to a command like shown below will not work. You have to export it into the shell environment.

   ```bash
   # Will not work
   GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json" firebase emulators:start --only functions
   ```

   Also, note that the key expires. For local development you'll need to recreate it every day.

1. Start the local emulator for Cloud Functions

   ```bash
   npm run serve
   ```

1. Make a call to the function

   ```bash
   npm run call:local
   ```

1. Continuously compile TypeScript to update the function while editing:

   ```bash
   npm run build:watch
   ```

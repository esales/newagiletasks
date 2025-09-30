# Agile Tasks

A simple and elegant task management mobile application built with React Native and Expo.

## Features

- ✅ Create, edit, and delete tasks
- 📅 Date-based task organization
- 🎯 Today's task completion tracking
- 💜 Clean, minimalist purple-themed UI
- 📱 Cross-platform (iOS and Android)
- 💾 Local data persistence with AsyncStorage

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app on your mobile device

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## App Structure

- **App.js** - Main application component with task management logic
- **package.json** - Dependencies and scripts
- **app.json** - Expo configuration

## Key Features Implementation

### Task Management
- Add new tasks with description and optional date
- Mark tasks as complete/incomplete
- Edit task descriptions
- Delete tasks with confirmation

### UI Components
- Clean header with app logo and title
- Today's completion summary
- Task list with individual task items
- Floating Action Button for adding tasks
- Modal for task creation

### Data Persistence
- Uses AsyncStorage for local data storage
- Tasks persist between app sessions
- Automatic save on task modifications

## Styling

The app uses a consistent purple theme (#8B5CF6) with:
- Clean white backgrounds
- Subtle shadows and rounded corners
- Intuitive touch targets
- Responsive design for different screen sizes

## Future Enhancements

- Task categories and filtering
- Push notifications for reminders
- Data synchronization across devices
- Task priority levels
- Dark mode support


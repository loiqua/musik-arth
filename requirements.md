# Requirements Document: Local Music Player Application

## 1. Introduction

### 1.1 Project Overview

The goal of this project is to develop a **local music player** that allows users to browse, play, and manage their local audio files. The application should have an intuitive interface, smooth user experience, and leverage native device capabilities such as **background playback and interactive notifications**.

### 1.2 Target Audience

The application is intended for users who prefer playing music stored on their devices rather than using streaming services.

### 1.3 Platform

- The application will be developed using **React Native with Expo** for cross-platform compatibility (Android & iOS).

## 2. Functional Requirements

### 2.1 Core Features

#### 2.1.1 Audio File Management

- Scan the device storage for audio files (MP3 required, additional formats optional).
- Display a list of detected files with metadata (Title, Artist, Album, Duration, Cover Art).

#### 2.1.2 Audio Playback

- Play, Pause, Stop, Next, Previous controls.
- Seek functionality (allowing users to skip to a specific part of a song).
- Shuffle and Repeat modes.

#### 2.1.3 Background Playback

- The music should continue playing when the app is minimized or the screen is locked.
- Audio controls should be accessible via a **notification bar widget** and **lock screen controls**.

#### 2.1.4 Playlists Management

- Users should be able to create, rename, and delete playlists.
- Add/remove songs from playlists.

### 2.2 UI/UX Requirements

#### 2.2.1 Interface Design

- Modern and **intuitive** UI with smooth navigation.
- Dark and Light mode support (optional but a plus).
- Animations for **smooth transitions**.
- Custom **Splash Screen** with branding.
- A **custom app icon** that fits the theme.

### 2.3 Advanced Features (Bonus for Extra Points)

- **Equalizer Support**: Allow users to adjust bass, treble, and presets.
- **Lyrics Display**: Fetch and show synchronized lyrics.
- **Favorites Section**: Users can mark songs as favorites for quick access.

## 3. Non-Functional Requirements

### 3.1 Performance

- The application should be **lightweight** and consume minimal battery.
- Fast loading time when scanning audio files.

### 3.2 Security

- Ensure **permissions** (READ\_EXTERNAL\_STORAGE) are handled correctly.
- Protect user-created playlists from unintended deletion.

### 3.3 Maintainability

- The codebase should follow **clean coding principles** (SOLID, DRY, KISS).
- Use a **modular architecture** for better scalability.

## 4. Technology Stack

### 4.1 Programming Language

- **React Native (JavaScript/TypeScript) with Expo** for cross-platform development.

### 4.2 Libraries & APIs

- **expo-av** for audio playback.
- **expo-media-library** for accessing local audio files.
- **expo-notifications** for interactive notifications.
- **react-navigation** for smooth navigation.
- **AsyncStorage or SQLite** for playlist storage.
- **react-native-fast-image** for efficient cover art loading.

## 5. Evaluation Criteria Mapping

| Criteria            | Implementation Approach                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| **Functionality**   | Full feature coverage (file listing, playback, playlists, notifications) |
| **Native Features** | Background playback, interactive notifications                           |
| **Interface & UX**  | Smooth animations, intuitive layout, attractive splash screen & icon     |
| **Code Quality**    | Modular architecture, clean & maintainable code                          |

## 6. Project Timeline (1 Week Plan)

| Day   | Task                                               |
| ----- | -------------------------------------------------- |
| Day 1 | Project setup, UI wireframing, basic file scanning |
| Day 2 | Implement audio playback & controls                |
| Day 3 | Add background playback & notifications            |
| Day 4 | Implement playlist management                      |
| Day 5 | Refine UI, add splash screen & icons               |
| Day 6 | Test for bugs & optimize performance               |
| Day 7 | Final testing, polish, and submission              |

By adhering to these requirements, the application will be fully functional, user-friendly, and well-optimized. This structured approach ensures that all key aspects are covered, increasing the chances of securing a **20/20** grade.


# Phone Call Detection Strategy: Fraud Prevention Feature

## Goal
Implement a "Scam Alert" feature that detects if the user is on an active phone call while using the app. If a call is detected, display a prominent warning: *"We are not calling you. If the person on the line claims to be us, it is a scam."*

## Recommended Solution: CallKit (`CXCallObserver`)
After analyzing the requirements, **CallKit** is the superior choice over Audio Session monitoring.
*   **Why**: We need to distinguish *phone calls* (Carrier, FaceTime, VoIP) from general audio (Music, Podcasts). `CXCallObserver` specifically tracks telephony state.
*   **Accuracy**: It provides distinct states: `dialing`, `incoming`, `connected`, `ended`.
*   **Privacy**: It does not reveal *who* is calling, only *that* a call is active. This "metadata-only" access is generally privacy-safe for this specific security use case.

## Implementation Plan

### 1. Technical Implementation
We will create a `CallDetectionManager` class using Swift.

#### Core Components:
*   **`CXCallObserver`**: The system object that monitors call updates.
*   **`CXCallObserverDelegate`**: The interface we implement to receive real-time updates.

#### Logic Flow:
1.  **App Launch / Foreground**: Immediately check `callObserver.calls`.
2.  **State Evaluation**:
    *   If `calls` array is not empty AND at least one call has `hasConnected == true` OR `hasEnded == false`: **Trigger Alert**.
3.  **Real-time Monitoring**:
    *   If a call starts *while* the user is in the app, the delegate `callObserver(_:callChanged:)` is fired.
    *   Update UI immediately.

### 2. User Interface (UI)
*   **Non-Intrusive Banner**: A persistent banner at the top of the screen (e.g., Red/Orange warning) when a call is active.
*   **Modal Alert**: A one-time popup when the app opens if a call is already active.

### 3. Privacy & App Store Compliance
*   **Justification**: In the App Store Connect privacy details, we must declare usage of CallKit.
*   **Review Note**: We should add a note to the App Reviewer explaining: *"This app uses CallKit purely to detect active call status for a user-safety anti-fraud feature. We do not access call logs or audio."*

## Next Steps: Prototyping
I will build a minimal "Hello World" iOS app to demonstrate this capability.

### Prototype Scope
1.  **`CallDetector.swift`**: A reusable Swift class wrapping `CXCallObserver`.
2.  **`ContentView.swift`**: A simple SwiftUI view that changes color/text when a call is detected.
3.  **Verification**: You can run this on a simulator (simulating calls) or a real device to verify the alert triggers.

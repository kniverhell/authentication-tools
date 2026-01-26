# Phone Call Fraud Alert Integration Guide

This guide explains how to integrate the Phone Call Detection feature into your iOS Financial App.

## 1. Add Source Files
Add the following files to your Xcode project:
*   `CallDetectionManager.swift`
*   `ContentView.swift` (or integrate the logic into your existing root view)

## 2. Link CallKit Framework
You must link the **CallKit** framework to your target.
1.  Select your Project in the Project Navigator.
2.  Select your App Target.
3.  Go to the **General** tab.
4.  Scroll down to **Frameworks, Libraries, and Embedded Content**.
5.  Click **+** and search for `CallKit`.
6.  Add it.

## 3. Privacy & App Store Submission
When submitting your app to the App Store, you may be asked about your usage of CallKit.
*   **Privacy Usage Description**: You do *not* strictly need a `Info.plist` privacy key for `CXCallObserver` (unlike Camera or Microphone), but you must disclose the usage in App Store Connect.
*   **Reviewer Notes**: It is highly recommended to add a note to the App Reviewer:
    > "This app uses CallKit (CXCallObserver) solely to detect if the user is on an active phone call while using the app. This is a security feature to warn users about potential social engineering scams where fraudsters claim to be calling from our bank. We do not access call logs, phone numbers, or audio."

## 4. Testing
*   **Simulator**: You can simulate calls in the iOS Simulator.
    *   Go to **Features** -> **Status Bar** (this doesn't trigger it).
    *   Better: Use the **Hardware** -> **Toggle In-Call Status Bar** (YMMV on recent simulators).
    *   **Best**: Run on a real device. Call your phone from another number while the app is open.
*   **Real Device**:
    1.  Open the app.
    2.  Make a call (or receive one).
    3.  Verify the Red Alert banner appears.
    4.  Hang up.
    5.  Verify the banner disappears.

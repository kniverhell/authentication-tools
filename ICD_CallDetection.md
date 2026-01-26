# Interface Control Document (ICD)
## Phone Call Detection & Fraud Alert System

**Document Version:** 1.0  
**Date:** 2026-01-26  
**Project:** iOS Phone Call Fraud Detection Feature  
**System:** Mobile Banking Application

---

## 1. Document Purpose

This ICD defines the interfaces, data structures, and integration specifications for the Phone Call Detection feature that alerts users to potential fraud attempts when they are on a phone call while using the banking application.

---

## 2. System Overview

### 2.1 Architecture
```
┌─────────────────────────────────────────┐
│         iOS Banking App (Client)        │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │      ContentView (SwiftUI)        │  │
│  │  - Observes call state            │  │
│  │  - Displays fraud alert banner    │  │
│  └───────────────┬───────────────────┘  │
│                  │ @ObservedObject       │
│  ┌───────────────▼───────────────────┐  │
│  │    CallDetectionManager           │  │
│  │  - Implements CXCallObserverDelegate│
│  │  - Publishes isOnCall boolean     │  │
│  └───────────────┬───────────────────┘  │
│                  │ Delegates             │
│  ┌───────────────▼───────────────────┐  │
│  │   Apple CallKit Framework         │  │
│  │  - CXCallObserver                 │  │
│  │  - System call state monitoring   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 Components
| Component | Technology | Responsibility |
|-----------|------------|----------------|
| `CallDetectionManager` | Swift Class | Monitors phone call state via CallKit |
| `ContentView` | SwiftUI View | Renders fraud alert UI when call detected |
| `CXCallObserver` | Apple CallKit | Provides system call state updates |

---

## 3. Interface Specifications

### 3.1 CallDetectionManager Interface

#### 3.1.1 Class Declaration
```swift
class CallDetectionManager: NSObject, ObservableObject, CXCallObserverDelegate
```

#### 3.1.2 Published Properties
| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `isOnCall` | `Bool` | `@Published` | Indicates if user is currently on an active call |

#### 3.1.3 Public Methods
| Method | Signature | Return | Description |
|--------|-----------|--------|-------------|
| `init()` | `override init()` | `CallDetectionManager` | Initializes observer and checks initial call state |

#### 3.1.4 Delegate Methods (CXCallObserverDelegate)
| Method | Signature | Parameters | Description |
|--------|-----------|------------|-------------|
| `callObserver(_:callChanged:)` | `func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall)` | `callObserver`: The observer instance<br>`call`: The call that changed | Called when any call state changes |

#### 3.1.5 Private Methods
| Method | Signature | Description |
|--------|-----------|-------------|
| `checkCallStatus()` | `private func checkCallStatus()` | Performs initial call state check on initialization |
| `updateCallStatus(calls:)` | `private func updateCallStatus(calls: [CXCall])` | Evaluates call array and updates `isOnCall` property |

---

## 4. Data Structures

### 4.1 CXCall (Apple CallKit)
System-provided class representing a phone call.

| Property | Type | Description |
|----------|------|-------------|
| `uuid` | `UUID` | Unique identifier for the call |
| `outgoing` | `Bool` | `true` if outgoing call, `false` if incoming |
| `hasEnded` | `Bool` | `true` if call has ended |
| `hasConnected` | `Bool` | `true` if call has connected |
| `onHold` | `Bool` | `true` if call is on hold |

### 4.2 Call State Logic
```swift
// A call is considered "active" if:
!call.hasEnded

// Covers states:
// - Dialing (outgoing, not connected)
// - Ringing (incoming, not connected)
// - Connected (active conversation)
// - On Hold (connected but paused)
```

---

## 5. State Machine

### 5.1 Call Detection States
```
┌─────────────┐
│   NO CALL   │ ◄─────────────────────────┐
└──────┬──────┘                           │
       │                                  │
       │ Call Started                     │ Call Ended
       │ (Dialing/Ringing/Connected)      │
       │                                  │
       ▼                                  │
┌─────────────┐                           │
│  ON CALL    │ ──────────────────────────┘
└─────────────┘
```

### 5.2 State Transitions
| From State | Event | To State | UI Action |
|------------|-------|----------|-----------|
| NO CALL | `!call.hasEnded` | ON CALL | Show fraud alert banner |
| ON CALL | `call.hasEnded` | NO CALL | Hide fraud alert banner |
| ON CALL | Hold activated | ON CALL | Banner remains visible |
| NO CALL | Multiple calls started | ON CALL | Show banner (any active) |

---

## 6. Integration Requirements

### 6.1 Framework Dependencies
```swift
import Foundation
import CallKit
import SwiftUI (for ContentView)
```

### 6.2 Xcode Project Configuration
| Setting | Value | Location |
|---------|-------|----------|
| Framework | `CallKit.framework` | Target → General → Frameworks, Libraries, and Embedded Content |
| Minimum iOS Version | iOS 10.0+ | Build Settings → Deployment Target |

### 6.3 Info.plist Requirements
No explicit `Info.plist` entries required for `CXCallObserver` (read-only monitoring).

### 6.4 App Store Connect Privacy Declaration
| Category | Declaration |
|----------|-------------|
| Data Type | "Phone Call State" (Metadata Only) |
| Purpose | "Fraud Prevention - App Functionality" |
| Linked to User | No |

---

## 7. API Reference

### 7.1 CallDetectionManager API

#### 7.1.1 Initialization
```swift
let callManager = CallDetectionManager()
```

**Behavior:**
1. Initializes `CXCallObserver` instance
2. Sets delegate to `self` with `nil` queue (uses default background queue)
3. Performs initial call state check via `checkCallStatus()`
4. `isOnCall` is updated asynchronously on main thread

**Thread Safety:** All `@Published` updates dispatched to `DispatchQueue.main`

#### 7.1.2 Observing Call State (SwiftUI)
```swift
@StateObject private var callManager = CallDetectionManager()

var body: some View {
    if callManager.isOnCall {
        // Show fraud alert
    }
}
```

**Behavior:**
- SwiftUI automatically subscribes to `@Published isOnCall`
- View updates when `isOnCall` changes

---

## 8. Error Handling

### 8.1 Potential Issues & Mitigation

| Issue | Cause | Mitigation |
|-------|-------|------------|
| Permission Denied | (N/A for CXCallObserver - no permission required) | No action needed |
| Background Termination | App suspended by iOS | Observer resumes on foreground; UI updates when app active |
| Multiple Calls | Conference calls, call waiting | Logic iterates all calls; alert shown if ANY call is active |
| VoIP Call Not Detected | Third-party app doesn't use CallKit | Only CallKit-integrated calls are detected (Apple design limitation) |

### 8.2 Edge Cases
```swift
// Edge Case 1: App launches during active call
// ✅ Handled: checkCallStatus() runs in init()

// Edge Case 2: Call ends while app backgrounded
// ✅ Handled: Delegate fires on background queue, 
//            UI updates when app returns to foreground

// Edge Case 3: Multiple simultaneous calls
// ✅ Handled: calls.contains { !$0.hasEnded } logic
```

---

## 9. Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Memory Overhead | < 100 KB | Single observer instance |
| CPU Usage | Negligible | Event-driven callbacks only |
| Battery Impact | Minimal | No polling; system callbacks only |
| Latency | < 100ms | Time from call state change to UI update |

---

## 10. Testing Interface

### 10.1 Manual Testing
```bash
# On Physical Device:
1. Install app on iPhone
2. Launch app
3. Call the device from another phone
4. Verify: Red banner appears
5. End call
6. Verify: Banner disappears
```

### 10.2 Simulated Testing
```swift
// Note: CXCallObserver cannot be easily mocked
// Recommended: Use physical device testing

// For UI testing only:
class MockCallDetectionManager: ObservableObject {
    @Published var isOnCall: Bool = false
    
    func simulateCall() {
        isOnCall = true
    }
    
    func simulateCallEnd() {
        isOnCall = false
    }
}
```

---

## 11. Security & Privacy

### 11.1 Data Access
| Data Element | Accessed | Stored | Transmitted |
|--------------|----------|--------|-------------|
| Call exists (boolean) | ✅ Yes | ❌ No | ❌ No |
| Phone number | ❌ No | ❌ No | ❌ No |
| Contact name | ❌ No | ❌ No | ❌ No |
| Call duration | ❌ No | ❌ No | ❌ No |
| Call audio | ❌ No | ❌ No | ❌ No |

### 11.2 Compliance
- **GDPR**: No personal data collected
- **CCPA**: No data processing or sharing
- **Apple Privacy Policy**: Metadata-only access (permitted for fraud prevention)

---

## 12. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | System Architect | Initial ICD creation |

---

## 13. Appendices

### 13.1 Code Sample: Full Integration
```swift
import SwiftUI
import CallKit

// Manager
class CallDetectionManager: NSObject, ObservableObject, CXCallObserverDelegate {
    @Published var isOnCall: Bool = false
    private let callObserver = CXCallObserver()
    
    override init() {
        super.init()
        callObserver.setDelegate(self, queue: nil)
        checkCallStatus()
    }
    
    private func checkCallStatus() {
        updateCallStatus(calls: callObserver.calls)
    }
    
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        updateCallStatus(calls: callObserver.calls)
    }
    
    private func updateCallStatus(calls: [CXCall]) {
        let activeCallExists = calls.contains { !$0.hasEnded }
        DispatchQueue.main.async {
            self.isOnCall = activeCallExists
        }
    }
}

// View
struct BankingAppView: View {
    @StateObject private var callManager = CallDetectionManager()
    
    var body: some View {
        ZStack(alignment: .top) {
            // Main content
            Text("Banking App Content")
            
            // Fraud Alert
            if callManager.isOnCall {
                FraudAlertBanner()
            }
        }
    }
}
```

### 13.2 References
- [Apple CallKit Documentation](https://developer.apple.com/documentation/callkit)
- [CXCallObserver Reference](https://developer.apple.com/documentation/callkit/cxcallobserver)
- [App Store Review Guidelines - Privacy](https://developer.apple.com/app-store/review/guidelines/#privacy)

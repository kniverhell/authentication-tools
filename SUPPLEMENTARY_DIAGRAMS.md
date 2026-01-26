# Supplementary Diagrams
## Phone Call Detection System

**Document Version:** 1.0  
**Date:** 2026-01-26  
**Project:** iOS Phone Call Fraud Detection Feature

---

## 1. Class Diagram

```mermaid
classDiagram
    class CallDetectionManager {
        -CXCallObserver callObserver
        +Bool isOnCall
        +init()
        -checkCallStatus()
        -updateCallStatus(calls: [CXCall])
        +callObserver(_:callChanged:)
    }
    
    class CXCallObserver {
        +[CXCall] calls
        +setDelegate(_:queue:)
    }
    
    class CXCallObserverDelegate {
        <<interface>>
        +callObserver(_:callChanged:)
    }
    
    class CXCall {
        +UUID uuid
        +Bool outgoing
        +Bool onHold
        +Bool hasConnected
        +Bool hasEnded
    }
    
    class ObservableObject {
        <<protocol>>
        +objectWillChange
    }
    
    class ContentView {
        -CallDetectionManager callManager
        +body: View
    }
    
    class FraudAlertBanner {
        +body: View
    }
    
    CallDetectionManager ..|> CXCallObserverDelegate : implements
    CallDetectionManager ..|> ObservableObject : implements
    CallDetectionManager --> CXCallObserver : owns
    CXCallObserver --> CXCall : contains
    ContentView --> CallDetectionManager : observes
    ContentView --> FraudAlertBanner : renders conditionally
    
    note for CallDetectionManager "Main business logic\nPublishes isOnCall state"
    note for CXCallObserver "Apple system framework\nMonitors telephony state"
    note for ContentView "SwiftUI View\nDisplays fraud alert"
```

---

## 2. Deployment Diagram

```mermaid
graph TB
    subgraph "iPhone Device"
        subgraph "iOS System Layer"
            A[Telephony System]
            B[CallKit Framework]
            C[Phone.app]
            D[FaceTime.app]
            E[Third-party VoIP Apps]
        end
        
        subgraph "Banking App Process"
            F[App Delegate]
            G[CallDetectionManager]
            H[SwiftUI Views]
            I[Main Thread]
            J[Background Queue]
        end
    end
    
    A -->|Call Events| B
    C -->|Registers Calls| B
    D -->|Registers Calls| B
    E -->|Registers Calls| B
    
    B -.->|CXCallObserver API| G
    G -->|Delegate Callbacks| J
    J -.->|DispatchQueue.main| I
    I -->|Update @Published| G
    G -->|ObservableObject| H
    H -->|Render| I
    F -->|Lifecycle| H
    
    style A fill:#ff9999
    style B fill:#99ccff
    style G fill:#99ff99
    style H fill:#cc99ff
    style I fill:#ffcc99
    style J fill:#ffcc99
```

---

## 3. Component Diagram

```mermaid
graph TD
    subgraph "Presentation Layer"
        A[ContentView.swift]
        B[FraudAlertBanner]
    end
    
    subgraph "Business Logic Layer"
        C[CallDetectionManager.swift]
    end
    
    subgraph "Framework Layer"
        D[CallKit Framework]
        E[SwiftUI Framework]
        F[Combine Framework]
    end
    
    subgraph "System Layer"
        G[iOS Telephony]
    end
    
    A --> C
    A --> B
    B --> E
    C --> D
    C --> F
    D --> G
    A --> E
    
    style A fill:#cc99ff
    style B fill:#cc99ff
    style C fill:#99ff99
    style D fill:#99ccff
    style E fill:#99ccff
    style F fill:#99ccff
    style G fill:#ff9999
```

---

## 4. Data Flow Diagram

```mermaid
flowchart LR
    A[Telephony Event] -->|1. Call State Change| B[CallKit]
    B -->|2. Notify Observer| C[CXCallObserver]
    C -->|3. Delegate Callback| D[CallDetectionManager]
    D -->|4. Fetch Call Array| C
    C -->|5. Return [CXCall]| D
    D -->|6. Evaluate State| E{Any !hasEnded?}
    E -->|Yes| F[Set isOnCall = true]
    E -->|No| G[Set isOnCall = false]
    F -->|7. Publish Change| H[Combine Framework]
    G -->|7. Publish Change| H
    H -->|8. Notify Subscribers| I[SwiftUI View]
    I -->|9. Re-render| J[Display/Hide Banner]
    
    style A fill:#ff9999
    style B fill:#99ccff
    style C fill:#99ccff
    style D fill:#99ff99
    style E fill:#ffffcc
    style H fill:#99ccff
    style I fill:#cc99ff
    style J fill:#cc99ff
```

---

## 5. State Diagram (Call Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> NoCall: App Launch
    
    NoCall --> Dialing: Outgoing Call Started
    NoCall --> Ringing: Incoming Call Detected
    
    Dialing --> Connected: Call Answered
    Dialing --> NoCall: Call Cancelled/Failed
    
    Ringing --> Connected: User Answers
    Ringing --> NoCall: Call Rejected/Missed
    
    Connected --> OnHold: User Places on Hold
    OnHold --> Connected: User Resumes
    
    Connected --> NoCall: Call Ended
    OnHold --> NoCall: Call Ended
    
    state "No Active Call" as NoCall {
        [*] --> Idle
        Idle --> Idle: isOnCall = false
    }
    
    state "Active Call States" as ActiveStates {
        [*] --> Dialing
        Dialing --> Ringing
        Ringing --> Connected
        Connected --> OnHold
        state "isOnCall = true" as Active
    }
    
    note right of NoCall
        UI: Normal view
        Alert: Hidden
    end note
    
    note right of ActiveStates
        UI: Fraud alert visible
        Alert: "We are NOT calling you"
    end note
```

---

## 6. Activity Diagram (Manager Initialization)

```mermaid
flowchart TD
    Start([App Launches]) --> Init[CallDetectionManager.init]
    Init --> CreateObserver[Create CXCallObserver instance]
    CreateObserver --> SetDelegate[Set self as delegate]
    SetDelegate --> CheckStatus[Call checkCallStatus]
    CheckStatus --> FetchCalls[Access callObserver.calls]
    FetchCalls --> EvaluateCalls{Evaluate call array}
    
    EvaluateCalls -->|Empty array| SetFalse[isOnCall = false]
    EvaluateCalls -->|Contains active calls| SetTrue[isOnCall = true]
    
    SetFalse --> Ready[Manager Ready]
    SetTrue --> Ready
    
    Ready --> ListenForEvents[Listen for call events]
    ListenForEvents --> End([Initialized])
    
    style Start fill:#90EE90
    style Init fill:#87CEEB
    style EvaluateCalls fill:#FFD700
    style Ready fill:#98FB98
    style End fill:#90EE90
```

---

## 7. Timing Diagram (Call Event Processing)

```mermaid
sequenceDiagram
    participant T as Time (ms)
    participant S as Telephony System
    participant O as CXCallObserver
    participant M as Manager (BG Thread)
    participant Main as Manager (Main Thread)
    participant UI as SwiftUI View
    
    Note over T: t=0ms
    S->>O: Call state changed
    
    Note over T: t=10ms
    O->>M: callObserver(_:callChanged:)
    
    Note over T: t=15ms
    M->>O: Fetch calls array
    
    Note over T: t=20ms
    O-->>M: Return [CXCall]
    
    Note over T: t=25ms
    M->>M: Evaluate contains(!hasEnded)
    
    Note over T: t=30ms
    M->>Main: DispatchQueue.main.async
    
    Note over T: t=35ms
    Main->>Main: Set isOnCall = true
    
    Note over T: t=40ms
    Main->>UI: objectWillChange.send()
    
    Note over T: t=50ms
    UI->>UI: Re-render body
    
    Note over T: t=80ms
    UI->>UI: Display fraud alert
    
    Note over T: Total latency: ~80ms
```

---

## 8. Use Case Diagram

```mermaid
graph LR
    subgraph "Actors"
        U[Bank Customer]
        S[Scammer]
        T[iOS System]
    end
    
    subgraph "Use Cases"
        UC1[Open Banking App]
        UC2[Receive Phone Call]
        UC3[View Fraud Alert]
        UC4[Ignore Scam Call]
        UC5[Continue Banking]
    end
    
    U -->|Primary Actor| UC1
    S -->|Initiates| UC2
    T -->|Triggers| UC2
    UC1 --> UC2
    UC2 --> UC3
    UC3 --> UC4
    UC4 --> UC5
    
    style U fill:#99ccff
    style S fill:#ff9999
    style T fill:#ffcc99
    style UC3 fill:#99ff99
```

---

## 9. Package Diagram (Module Structure)

```mermaid
graph TB
    subgraph "Banking App Package"
        subgraph "UI Package"
            A[ContentView]
            B[FraudAlertBanner]
            C[AccountView]
        end
        
        subgraph "Managers Package"
            D[CallDetectionManager]
            E[AuthManager]
            F[TransactionManager]
        end
        
        subgraph "Models Package"
            G[User]
            H[Account]
            I[Transaction]
        end
    end
    
    subgraph "Apple Frameworks"
        J[CallKit]
        K[SwiftUI]
        L[Combine]
    end
    
    A --> D
    A --> K
    B --> K
    D --> J
    D --> L
    
    style D fill:#99ff99
    style J fill:#99ccff
```

---

## 10. Network Diagram (System Context)

```mermaid
graph TB
    subgraph "User's iPhone"
        A[Banking App]
        B[CallKit]
        C[Phone.app]
    end
    
    subgraph "External Systems"
        D[Cellular Network]
        E[VoIP Provider]
        F[Scammer's Phone]
    end
    
    subgraph "Bank Infrastructure"
        G[Bank API Server]
        H[Fraud Detection Service]
    end
    
    F -->|Scam Call| D
    D -->|Call Signal| C
    C -->|Register Call| B
    B -.->|Notify| A
    A -.->|Log Event| G
    G -.->|Analytics| H
    
    style A fill:#99ff99
    style B fill:#99ccff
    style F fill:#ff9999
    style H fill:#ffcc99
    
    note1[Not Implemented in v1.0\nFuture Enhancement]
    G -.-> note1
```

---

## 11. Memory Layout Diagram

```mermaid
graph TB
    subgraph "Heap Memory"
        A[CallDetectionManager Instance]
        B[CXCallObserver Instance]
        C[Delegate Queue]
        D[CXCall Array]
    end
    
    subgraph "Stack Memory"
        E[callObserver Function Frame]
        F[updateCallStatus Function Frame]
    end
    
    subgraph "Main Thread Queue"
        G[UI Update Closures]
    end
    
    A -->|Strong Reference| B
    B -->|Weak Reference| A
    B -->|Owns| D
    B -->|Uses| C
    E -->|Temporary| F
    F -->|Dispatches| G
    
    style A fill:#99ff99
    style B fill:#99ccff
    style G fill:#ffcc99
```

---

## 12. Thread Interaction Diagram

```mermaid
flowchart TD
    subgraph "Main Thread"
        A[App Launch]
        F[Update isOnCall]
        G[SwiftUI Render]
    end
    
    subgraph "CallKit Background Queue"
        B[CXCallObserver]
        C[Delegate Callback]
        D[Fetch Calls]
        E[Evaluate State]
    end
    
    A -.->|Create| B
    B -->|Event| C
    C --> D
    D --> E
    E -.->|DispatchQueue.main.async| F
    F --> G
    
    style A fill:#90EE90
    style F fill:#ffcc99
    style G fill:#cc99ff
    style C fill:#99ccff
```

---

## 13. Ecosystem Diagram

```mermaid
graph TB
    subgraph "Development Environment"
        A[Xcode]
        B[Swift Compiler]
        C[Interface Builder]
    end
    
    subgraph "Runtime Environment"
        D[iOS 17.x]
        E[Swift Runtime]
        F[Foundation]
        G[CallKit]
        H[SwiftUI]
    end
    
    subgraph "App Components"
        I[CallDetectionManager.swift]
        J[ContentView.swift]
        K[Assets.xcassets]
    end
    
    A -->|Compiles| I
    A -->|Compiles| J
    B -->|Produces| M[Binary]
    I -->|Uses| G
    J -->|Uses| H
    M -->|Runs on| D
    D -->|Provides| G
    D -->|Provides| H
    
    style I fill:#99ff99
    style J fill:#cc99ff
    style G fill:#99ccff
```

---

## 14. Decision Tree (Implementation Choices)

```mermaid
graph TD
    Start{Need to detect\nphone calls?}
    Start -->|Yes| Q1{Need call details\ne.g., phone number?}
    Start -->|No| End1[No implementation needed]
    
    Q1 -->|Yes| Warn1[⚠️ Not possible with CallKit\nPrivacy restricted]
    Q1 -->|No| Q2{Need background\ndetection?}
    
    Q2 -->|Yes| Sol1[Use CXCallObserver\n+ Background modes]
    Q2 -->|No| Q3{Foreground only?}
    
    Q3 -->|Yes| Sol2[✅ Use CXCallObserver\nRecommended approach]
    Q3 -->|No| Q4{Alternative approach?}
    
    Q4 -->|Audio Session| Sol3[AVAudioSession\nFalse positives likely]
    Q4 -->|CoreTelephony| Warn2[❌ Deprecated\nNot recommended]
    
    style Sol2 fill:#99ff99
    style Warn1 fill:#ff9999
    style Warn2 fill:#ff9999
    style Sol3 fill:#ffcc99
```

---

## 15. Error Handling Flow

```mermaid
flowchart TD
    A[Call Event Received] --> B{Observer Valid?}
    B -->|No| C[Log Error]
    B -->|Yes| D{Calls Array Accessible?}
    D -->|No| E[Fallback: Assume No Call]
    D -->|Yes| F{Array Processing}
    F --> G{Any Exceptions?}
    G -->|Yes| H[Catch & Log]
    G -->|No| I[Update State]
    H --> J[Set isOnCall = false\nSafe default]
    C --> J
    E --> J
    I --> K[UI Update]
    J --> K
    
    style A fill:#90EE90
    style I fill:#99ff99
    style J fill:#ffcc99
    style K fill:#cc99ff
```

---

## 16. Architecture Layers Diagram

```mermaid
graph TB
    subgraph "Layer 1: Presentation"
        A[SwiftUI Views]
        B[View Models]
    end
    
    subgraph "Layer 2: Business Logic"
        C[CallDetectionManager]
        D[Other Managers]
    end
    
    subgraph "Layer 3: Framework Abstractions"
        E[CallKit Wrapper]
        F[Networking Layer]
    end
    
    subgraph "Layer 4: System Frameworks"
        G[CallKit]
        H[Foundation]
        I[Combine]
    end
    
    A --> C
    B --> C
    C --> E
    E --> G
    C --> I
    
    style C fill:#99ff99
    style A fill:#cc99ff
    style G fill:#99ccff
    
    note1[Dependency Rule:\nInner layers don't\nknow about outer layers]
    C -.-> note1
```

---

## Legend

### Color Coding
- 🟩 **Green** (#99ff99): Application code (our implementation)
- 🟦 **Blue** (#99ccff): Apple frameworks & system components
- 🟪 **Purple** (#cc99ff): UI/View layer
- 🟧 **Orange** (#ffcc99): Threading/Async components
- 🟥 **Red** (#ff9999): External/Untrusted components
- 🟨 **Yellow** (#ffcc99): Decision points/Warnings

### Diagram Types
- **Sequence Diagrams**: Show time-ordered interactions
- **Class Diagrams**: Show static structure
- **Flowcharts**: Show logic/process flow
- **State Diagrams**: Show state transitions
- **Deployment**: Show physical architecture

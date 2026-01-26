import Foundation
import CallKit

class CallDetectionManager: NSObject, ObservableObject, CXCallObserverDelegate {
    // Published property to update the UI automatically
    @Published var isOnCall: Bool = false
    
    private let callObserver = CXCallObserver()
    
    override init() {
        super.init()
        // Set the delegate to self to receive updates on a background queue
        callObserver.setDelegate(self, queue: nil)
        
        // Initial check when the app launches
        checkCallStatus()
    }
    
    private func checkCallStatus() {
        // Check if there are any active calls right now
        let currentCalls = callObserver.calls
        updateCallStatus(calls: currentCalls)
    }
    
    // MARK: - CXCallObserverDelegate
    
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        // This method is called whenever a call's state changes (dialing, connected, ended, etc.)
        // We re-evaluate the list of all calls to determine if *any* are active.
        updateCallStatus(calls: callObserver.calls)
    }
    
    private func updateCallStatus(calls: [CXCall]) {
        // We consider the user "on a call" if there is at least one call that has not ended.
        // Note: 'hasEnded' is the most reliable flag.
        // 'hasConnected' might be false if it's still dialing or ringing, but for a fraud alert,
        // we probably want to warn them even if it's just ringing/dialing, or strictly only when connected.
        // For safety, let's warn if a call is active (not ended).
        
        let activeCallExists = calls.contains { call in
            return !call.hasEnded
        }
        
        // Update the published property on the main thread
        DispatchQueue.main.async {
            self.isOnCall = activeCallExists
        }
    }
}

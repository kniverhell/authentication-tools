import SwiftUI

struct ContentView: View {
    // Inject the call detection manager
    @StateObject private var callManager = CallDetectionManager()
    
    var body: some View {
        ZStack(alignment: .top) {
            // Main App Content
            VStack {
                Spacer()
                Image(systemName: "banknote")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                Text("My Financial App")
                    .font(.title)
                    .bold()
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            // Fraud Alert Overlay
            if callManager.isOnCall {
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.white)
                        Text("Active Call Detected")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    
                    Text("We are NOT calling you. If the person on the line claims to be from our bank, hang up immediately. It is a scam.")
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding()
                .background(Color.red)
                .cornerRadius(10)
                .shadow(radius: 5)
                .padding()
                .transition(.move(edge: .top))
                .animation(.easeInOut, value: callManager.isOnCall)
            }
        }
    }
}

#!/usr/bin/env python3
"""
Startup script for the Restaurant Recommendation System
This script will start the Flask backend and open the frontend in the browser
"""

import subprocess
import webbrowser
import time
import os
import sys
import threading

def install_dependencies():
    """Install required Python packages"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install dependencies: {e}")
        return False

def start_flask_server():
    """Start the Flask server in a separate thread"""
    def run_server():
        try:
            subprocess.run([sys.executable, "app.py"])
        except Exception as e:
            print(f"Flask server error: {e}")
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    return server_thread

def wait_for_server(url="http://localhost:5000", timeout=30):
    """Wait for the Flask server to be ready"""
    import urllib.request
    import urllib.error
    
    print("Waiting for Flask server to start...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            urllib.request.urlopen(url, timeout=1)
            print("✓ Flask server is ready")
            return True
        except (urllib.error.URLError, OSError):
            time.sleep(1)
    
    print("✗ Flask server failed to start within timeout")
    return False

def open_browser():
    """Open the website in the default browser"""
    try:
        # Try to open the local file first
        current_dir = os.path.dirname(os.path.abspath(__file__))
        index_path = os.path.join(current_dir, "index.html")
        
        if os.path.exists(index_path):
            file_url = f"file:///{index_path.replace(os.sep, '/')}"
            webbrowser.open(file_url)
            print(f"✓ Opened website: {file_url}")
            return True
        else:
            print("✗ index.html not found")
            return False
            
    except Exception as e:
        print(f"✗ Failed to open browser: {e}")
        return False

def main():
    """Main startup function"""
    print("=" * 60)
    print("🍽️  Restaurant Recommendation System Startup")
    print("=" * 60)
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Step 1: Install dependencies
    if not install_dependencies():
        print("\n❌ Failed to install dependencies. Please install manually:")
        print("   pip install -r requirements.txt")
        return 1
    
    print()
    
    # Step 2: Start Flask server
    print("Starting Flask backend server...")
    server_thread = start_flask_server()
    
    # Step 3: Wait for server to be ready
    if not wait_for_server():
        print("\n❌ Flask server failed to start. Please check for errors and try:")
        print("   python app.py")
        return 1
    
    print()
    
    # Step 4: Open browser
    print("Opening website in browser...")
    if not open_browser():
        print("\n⚠️  Please manually open index.html in your browser")
    
    print()
    print("=" * 60)
    print("🎉 System started successfully!")
    print("=" * 60)
    print()
    print("📋 What's running:")
    print("   • Flask API server: http://localhost:5000")
    print("   • Website: index.html (opened in browser)")
    print()
    print("🔗 Quick links:")
    print("   • Home: index.html")
    print("   • Restaurants: restaurants.html") 
    print("   • Users: users.html")
    print("   • Recommendations: recommendations.html")
    print()
    print("💡 To use the recommendation system:")
    print("   1. Go to the 'Gợi Ý' (Recommendations) page")
    print("   2. Select a user ID from the dropdown")
    print("   3. Click 'Lấy Gợi Ý' to get recommendations")
    print()
    print("Press Ctrl+C to stop the server")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down...")
        return 0

if __name__ == "__main__":
    sys.exit(main())

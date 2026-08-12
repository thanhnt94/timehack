"""TimeHack entry point — All-In-One Productivity Platform."""

import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    print("Starting TimeHack All-In-One Productivity Server...")
    print("Dashboard will be available at: http://localhost:5050")
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=5050, 
        reload=True,
        log_level="info"
    )

if __name__ == '__main__':
    main()

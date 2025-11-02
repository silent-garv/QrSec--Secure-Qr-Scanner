
# QR Scan Shield

QR Scan Shield is a secure QR code scanning application that helps protect users from malicious URLs and potential cyber threats. The application provides real-time security analysis of scanned QR codes and maintains a history of scans for registered users.


## Features

- **Secure QR Code Scanning**: Scan QR codes using your device's camera
- **Real-time Security Analysis**: Immediate URL analysis using VirusTotal and Google Safe Browsing APIs
- **User Authentication**: Secure login and signup functionality using Firebase
- **Scan History**: View and manage your past QR code scans
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Dark Mode Support**: Comfortable viewing in any lighting condition

This project is built with modern web technologies:

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Authentication & Database**: Firebase
- **Security APIs**: VirusTotal, Google Safe Browsing
- **QR Scanning**: Html5Qrcode
- **State Management**: React Hooks and Context

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Firebase account
- VirusTotal API key
- Google Safe Browsing API key

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/qr-scan-shield.git
cd qr-scan-shield
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your API keys:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key
VITE_SAFE_BROWSING_API_KEY=your_safe_browsing_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open `http://localhost:5173` in your browser
## Firebase Configuration

Make sure to set up your Firebase security rules properly. Here's a basic configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /scans/{scanId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/silent-garv/SECURE_QR](https://github.com/silent-garv/Frontend_QrSec/tree/main)

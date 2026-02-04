# Voice LMS - AI-Powered Voice Learning Platform

A modern Learning Management System that leverages voice interaction and AI to create personalized tutoring experiences. Learn through natural conversation with AI companions across various subjects.

![screenshot](./public/voice-lms.png)  

## 🚀 Features

- **Voice-Based Learning**: Learn through natural conversation using speech recognition and synthesis
- **AI Tutoring**: Personalized AI companions powered by Google Gemini Flash 1.5
- **Multiple Subjects**: Mathematics, Science, Language, History, Coding, Economics, and more
- **Real-time Interaction**: Live speech recognition with instant AI responses
- **Session Management**: Track your learning progress and session history

### 🎨 User Experience
- **Companion Builder**: Create custom AI tutors with personalized names, subjects, and teaching styles
- **Voice Customization**: Choose between male/female voices and formal/casual teaching styles
- **Interactive Sessions**: Visual feedback with animated speech indicators and real-time transcripts
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS and Radix UI

### 📊 Learning Management
- **Progress Tracking**: Monitor your learning journey and session history
- **Bookmarking**: Save favorite companions for quick access
- **Subject Filtering**: Browse companions by subject categories
- **Search Functionality**: Find specific topics and companions
- **Session Duration**: Flexible learning sessions from 15-60 minutes
- **Companion Management**: Create, edit, and delete your AI tutors
- **User Dashboard**: Centralized view of your learning activity

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lottie React** - Animations for visual feedback
- **React Hook Form** - Form management with Zod validation

### Backend & Database
- **NeonDB** - Serverless PostgreSQL database
- **Drizzle ORM** - TypeScript ORM for type-safe database access
- **Server Actions** - Next.js server-side data handling
- **Database Tables**:
  - `companions` - AI tutor configurations
  - `session_history` - Learning session tracking
  - `users` - User profiles and preferences

### Authentication
- **Clerk** - Complete authentication solution
- **Protected Routes** - Secure user areas
- **User Management** - Profile management and session handling

### AI & Voice Technology
- **Google Gemini Flash 1.5** - Advanced AI conversation model
- **Browser Speech Recognition** - Native speech-to-text
- **Browser Speech Synthesis** - Native text-to-speech
- **Custom Voice AI Service** - Orchestrates voice interactions

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **Vercel** - Deployment and hosting
- **Git** - Version control
- **GitHub Actions** - Automated database keep-alive

## 📋 Prerequisites

- **Node.js** 18+ and pnpm
- **Modern Browser** (Chrome, Edge, Safari recommended)
- **Microphone** access for voice features
- **Google AI API Key**
- **NeonDB Account**
- **Clerk Account**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Sarcastic-Soul/Voice-LMS.git
cd Voice-LMS
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Google AI Services
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# NeonDB Configuration
DATABASE_URL=your_neondb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. Database Setup (NeonDB + Drizzle)

Push the database schema to your NeonDB instance:

```bash
pnpm db:push
```

### 5. Authentication Setup (Clerk)

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Configure sign-in/sign-up components
3. Add your Clerk keys to the environment file
4. Enable Google OAuth (optional)

### 5. AI Service Setup (Google Gemini)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to `NEXT_PUBLIC_GEMINI_API_KEY`

### 6. Run Development Server
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🏗️ Project Structure

```
Voice-LMS/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── companions/        # Companion management pages
│   ├── dashboard/         # Main dashboard
│   ├── my-journey/        # User progress tracking
│   └── sign-in|sign-up/   # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI components
│   ├── CompanionCard.tsx # Companion display card
│   ├── CompanionForm.tsx # Companion creation form
│   └── CompanionComponent.tsx # Main voice interaction
├── lib/                   # Utility libraries
│   ├── actions/          # Server actions
│   ├── db/               # Database configuration and schema
│   ├── hooks/            # Custom React hooks
│   ├── services/         # AI and voice services
│   └── utils.ts          # Helper functions
├── types/                # TypeScript definitions
├── constants/            # App constants and data
└── public/               # Static assets
```

## 🎮 Usage Guide

### Creating Your First Companion

1. **Sign In**: Create an account or sign in
2. **Navigate**: Go to "Companions" → "New Companion"
3. **Configure**: Fill out the companion form:
   - **Name**: Give your AI tutor a name
   - **Subject**: Choose from available subjects
   - **Topic**: Describe what you want to learn
   - **Voice**: Select male/female voice
   - **Style**: Choose formal/casual teaching approach
   - **Duration**: Set expected session length

### Managing Your Companions

1. **View All**: Go to "Manage" to see all your created companions
2. **Delete**: Click the trash icon to remove unwanted companions
3. **Confirm**: Confirm deletion in the modal dialog
4. **Note**: Deleting a companion also removes its session history

### Starting a Learning Session

1. **Select**: Choose a companion from your library
2. **Launch**: Click "Launch Lesson"
3. **Begin**: Click "Start Session" to begin voice interaction
4. **Interact**: Speak naturally - the AI will respond with voice
5. **Control**: Use microphone button to mute/unmute
6. **End**: Click "End Session" when finished

### Managing Your Learning

- **Dashboard**: View popular companions and recent sessions
- **My Journey**: Track your progress and session history
- **Bookmarks**: Save favorite companions for quick access
- **Search & Filter**: Find specific topics or subjects
- **Manage Companions**: View, edit, and delete your created companions

## 🔧 Browser Compatibility

### Fully Supported
- ✅ **Chrome/Chromium** (Recommended)
- ✅ **Microsoft Edge**
- ✅ **Safari** (macOS/iOS)

### Limited Support
- ⚠️ **Firefox** (Speech recognition may not work)

### Required Permissions
- **Microphone Access**: For speech recognition
- **Audio Playback**: For text-to-speech responses

## 🐛 Troubleshooting

### Speech Recognition Issues
- Ensure you're using a supported browser
- Check microphone permissions in browser settings
- Verify microphone is working in other applications
- Try refreshing the page

### Voice Synthesis Problems
- Confirm browser supports Speech Synthesis API
- Check system audio settings
- Try different voice options
- Clear browser cache

### AI Response Issues
- Verify Gemini API key is valid and active
- Check API quota limits
- Ensure stable internet connection
- Review browser console for error messages

### Authentication Problems
- Verify Clerk configuration
- Check environment variables
- Clear browser cookies and cache
- Ensure correct redirect URLs

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Manual Deployment
```bash
pnpm build
pnpm start
```



## �🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint configuration
- Write descriptive commit messages
- Test voice features across browsers
- Ensure mobile responsiveness

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **NeonDB** for reliable serverless database
- **Clerk** for seamless authentication
- **Vercel** for excellent deployment platform
- **Radix UI** for accessible component library

---

**Built with ❤️ for the future of education**

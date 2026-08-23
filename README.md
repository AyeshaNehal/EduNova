# EduNova (AI Co-Teacher) 🚀

EduNova is an AI-powered EdTech application designed to support educators in under-resourced, multigrade classrooms. By acting as an AI Co-Teacher, it helps educators instantly digitize live lessons and automatically generates differentiated practice worksheets tailored to multiple grade levels and languages.

## 🎯 The Problem
In many low-fee private and rural schools, a single teacher often teaches multiple grade levels (e.g., Grades 2, 4, and 5) in the exact same room, at the same time. To cope, teachers handwrite multiple versions of every worksheet every single day, often spending hours manually translating concepts into local languages.

## ✨ The Solution
EduNova eliminates the repetitive, invisible work of translating, copying, and repeating. 
With EduNova, a teacher can capture a lesson via **voice, textbook photo, or a picture of a messy blackboard**. The app's AI instantly parses the concept and generates **three distinct worksheets simultaneously**:
- **Grades 1-2:** Simple practice (matching, fill-in-the-blanks)
- **Grades 3-4:** Direct understanding and short-answer questions
- **Grade 5:** Advanced application and reasoning

## 🛠️ Features
- **Multimodal Input:** Upload photos of blackboards, take live pictures of textbooks, or record a spoken lesson.
- **Multilingual Support:** Instantly generates and translates worksheets into English, Urdu, Sindhi, Pashto, or Arabic (with full Right-To-Left formatting).
- **Edit Before Export:** AI isn't perfect. Teachers have full inline editing capabilities to tweak the AI's output before exporting.
- **Offline Caching:** Built with local SQLite caching to support schools with patchy internet connections.
- **Admin Analytics Dashboard:** A real-time 'Principal's Desk' synced via Supabase, tracking global lesson generation and top subjects taught across the school network.

## 💻 Tech Stack
- **Frontend:** React Native (Expo) & React Native Web
- **Backend:** Node.js / Express
- **AI Engine:** Google Gemini API (gemini-3.6-flash)
- **Database / Backend-as-a-Service:** Supabase (PostgreSQL)
- **Local Storage:** SQLite
- **UI/Design:** Custom Glassmorphism UI, `@expo-google-fonts/poppins`

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo CLI
- Google Gemini API Key
- Supabase Project (URL & Anon Key)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/EduNova.git
   cd EduNova
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```
   Start the backend server:
   ```bash
   npm start
   ```

3. **Setup the Frontend:**
   Open a new terminal tab.
   ```bash
   cd frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   Start the Expo server:
   ```bash
   npm run web
   ```

## 📱 Screenshots
*(Add your screenshots of the Teacher Dashboard, Generated Worksheets, and Principal Analytics here)*

## 🤝 Contribution
This project was built as a student portfolio project inspired by real-world classroom observations during a University CCE project.

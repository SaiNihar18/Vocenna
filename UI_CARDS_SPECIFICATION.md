# Vocenna Frontend UI Card Specification

Based on the completed backend architecture, endpoints, and real-time WebSocket protocol, here is the complete breakdown of **UI Cards & Components** needed to build the Vocenna frontend (compatible with Google Stitch & Lovable).

---

## 🌐 1. Dashboard & Room Hub View

### 💳 1. User Profile & Quick Status Card (`UserProfileCard`)
- **Displays:** User Avatar, Full Name, Email, Preferred Language badge (e.g. `English (en)`, `Spanish (es)`).
- **Actions:** Edit Profile, Language selector dropdown, Logout.
- **Backend Endpoint:** `GET /api/v1/auth/me`

### 💳 2. Room Creation Card (`CreateRoomCard`)
- **Displays:** Modal/Card form with inputs for Title, Description, Public/Private toggle switch, Passcode input (if private), and Max Participants slider (2-500).
- **Actions:** "Create Voice Room" primary button (generates room code e.g. `room-abc-1234`).
- **Backend Endpoint:** `POST /api/v1/rooms`

### 💳 3. Join by Room Code Card (`JoinRoomCodeCard`)
- **Displays:** Clean input field for pasting a `room_code` or room URL, plus optional passcode field.
- **Actions:** "Join Room" button.
- **Backend Endpoint:** `POST /api/v1/rooms/{room_id}/join`

### 💳 4. Active Rooms Grid Card (`ActiveRoomsGridCard`)
- **Displays:** Cards displaying active rooms: Title, Host Name badge, Participant Count (e.g. `5/20 connected`), Public/Private Lock Icon, Created timestamp.
- **Actions:** "Join Room" button on each card.
- **Backend Endpoint:** `GET /api/v1/rooms`

---

## 🎙️ 2. Live Voice Room & Meeting View

### 💳 5. Active Participants Grid Card (`ActiveParticipantsCard`)
- **Displays:** Avatar grid for all connected participants.
  - Role Badge: `Host`, `Speaker`, or `Listener`
  - Audio Status: Pulsing green audio wave border when speaking, red Mute icon when muted
  - Interaction: Raised Hand indicator icon ✋
- **Actions:** Host controls (Mute Participant, Change Role).
- **Backend WebSocket:** Listens to `room_state`, `user_joined`, `participant_control_updated`, `user_left`.

### 💳 6. Live Subtitles & Real-time Transcript Card (`LiveTranscriptCard`)
- **Displays:** Auto-scrolling transcript feed showing:
  - Speaker Name & Avatar
  - Original spoken text + real-time translated text in user's preferred language
  - Emotion/Sentiment Tag (e.g. `😊 Positive`, `❓ Confused`, `⚡ Energetic`)
- **Backend WebSocket:** Listens to `transcript_segment` events.

### 💳 7. Text Chat Sidebar Card (`TextChatSidebarCard`)
- **Displays:** Real-time text chat message stream with sender name, timestamp, original message, and automated translation.
- **Actions:** Text input field with language selector and send button.
- **Backend WebSocket:** Sends & receives `chat_message` events.

### 💳 8. Voice & Room Controls Dock (`VoiceControlToolbarCard`)
- **Displays:** Bottom sticky toolbar:
  - Microphone Toggle (Mute/Unmute)
  - Raise / Lower Hand Toggle ✋
  - Copy Room Link / Code Button
  - Leave Room Button
  - End Meeting Button (Host only)
- **Backend Endpoint & WS:** `PUT /api/v1/rooms/{room_id}/controls` & WS `room_control` frames.

---

## 🧠 3. AI Intelligence & Post-Meeting View

### 💳 9. AI Executive Summary Card (`AISummaryCard`)
- **Displays:** Clean card with AI-generated meeting summary paragraph, key takeaways, and discussion topics.
- **Actions:** Regenerate Summary button, Copy to Clipboard.
- **Backend Endpoint:** `POST /api/v1/rooms/{room_id}/summary`

### 💳 10. Key Decisions Card (`KeyDecisionsCard`)
- **Displays:** Bulleted list of formal decisions reached during the voice room call.
- **Backend Endpoint:** `POST /api/v1/rooms/{room_id}/summary` (`key_decisions` array)

### 💳 11. Action Items & Task Assignment Card (`ActionItemsTaskListCard`)
- **Displays:** Interactive task checklist extracted by AI:
  - Task description
  - Assignee tag (e.g. `@Priya`)
  - Checkbox toggle for completed tasks
- **Backend Endpoint:** `POST /api/v1/rooms/{room_id}/summary` (`action_items` array)

### 💳 12. Room Emotion & Mood Analytics Card (`EmotionMoodCard`)
- **Displays:** Visual sentiment distribution progress bar (e.g. 70% Positive, 20% Energetic, 10% Confused).
- **Backend Endpoint:** `POST /api/v1/rooms/{room_id}/sentiment`

### 💳 13. Download & Export Transcripts Card (`TranscriptExportCard`)
- **Displays:** Export action card with options to download clean meeting records.
- **Actions:** "Download .TXT" button & "Download .JSON" button.
- **Backend Endpoint:** `GET /api/v1/rooms/{room_id}/transcripts/export?format=txt|json`

---

## 🔍 4. Conversation Memory (RAG) View

### 💳 14. Past Meetings RAG Search Card (`AskPastMeetingsCard`)
- **Displays:** AI Assistant search widget with natural language prompt input (*"What was decided about the budget last week?"*).
- **Outputs:** 
  - AI Answer response box synthesized from vector memory
  - Citation cards showing original speaker quotes, timestamps, and confidence score.
- **Backend Endpoint:** `POST /api/v1/rooms/{room_id}/memory/query`

### 💳 15. Voice Command Notification Banner Card (`VoiceCommandBannerCard`)
- **Displays:** Floating toast / notification banner when a voice command is spoken during a call (e.g., `⚡ Voice Command Detected: "Create task for Priya"`).
- **Backend WebSocket:** Listens to `voice_command_executed` events.

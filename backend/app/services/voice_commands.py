import re
from typing import Dict, Any, Optional


class VoiceCommandParser:
    @staticmethod
    def parse_command(text: str) -> Dict[str, Any]:
        """Parse spoken text for intent voice commands."""
        text_clean = text.strip().lower()

        # 1. Summarize command
        if any(phrase in text_clean for phrase in ["summarize the discussion", "summarize meeting", "create summary", "give me a summary"]):
            return {
                "is_command": True,
                "command_type": "SUMMARIZE",
                "action": "summarize_meeting",
                "parameters": {},
                "response_message": "Generating live meeting summary..."
            }

        # 2. Task creation command
        task_match = re.search(r"(?:create a task|action item|task) for (\w+)(?: to (.+))?", text_clean, re.IGNORECASE)
        if task_match:
            assignee = task_match.group(1).capitalize()
            task_desc = task_match.group(2) or "Follow up on discussion"
            return {
                "is_command": True,
                "command_type": "CREATE_TASK",
                "action": "create_task",
                "parameters": {
                    "assignee": assignee,
                    "task": task_desc.strip()
                },
                "response_message": f"Created task for {assignee}: {task_desc.strip()}"
            }

        # 3. Room controls (mute/unmute/raise hand)
        if "raise hand" in text_clean:
            return {
                "is_command": True,
                "command_type": "ROOM_CONTROL",
                "action": "raise_hand",
                "parameters": {"hand_raised": True},
                "response_message": "Hand raised"
            }
        elif "lower hand" in text_clean:
            return {
                "is_command": True,
                "command_type": "ROOM_CONTROL",
                "action": "lower_hand",
                "parameters": {"hand_raised": False},
                "response_message": "Hand lowered"
            }
        elif "mute me" in text_clean or "mute my mic" in text_clean:
            return {
                "is_command": True,
                "command_type": "ROOM_CONTROL",
                "action": "mute",
                "parameters": {"is_muted": True},
                "response_message": "Microphone muted"
            }
        elif "unmute me" in text_clean or "unmute my mic" in text_clean:
            return {
                "is_command": True,
                "command_type": "ROOM_CONTROL",
                "action": "unmute",
                "parameters": {"is_muted": False},
                "response_message": "Microphone unmuted"
            }

        return {
            "is_command": False,
            "command_type": None,
            "action": None,
            "parameters": {},
            "response_message": None
        }

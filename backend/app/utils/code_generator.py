import secrets
import string


def generate_room_code(length: int = 8) -> str:
    """Generate a readable room code e.g. room-abc-1234."""
    chars = string.ascii_lowercase + string.digits
    part1 = "".join(secrets.choice(chars) for _ in range(3))
    part2 = "".join(secrets.choice(chars) for _ in range(4))
    return f"room-{part1}-{part2}"

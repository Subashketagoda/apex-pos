with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 3914-4108 (0-based index 3913-4107) — the duplicate function block
# Line 3913 is the closing } of downloadCSV (first copy)
# Lines 3914-4108 are blank lines + duplicate function definitions
before = lines[:3913]    # up to and including line 3913 (closing } of first downloadCSV)
after = lines[4107:]     # from line 4108 onwards (// PWA & ChromeOS section)

new_lines = before + ['\n'] + after

with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed {4107 - 3913} duplicate lines. New total: {len(new_lines)}")

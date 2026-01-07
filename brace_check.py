
import re

def check_braces(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    depth = 0
    for i, line in enumerate(lines):
        line_num = i + 1
        for char in line:
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    print(f"Depth reached 0 at line {line_num}: {line.strip()}")
                if depth < 0:
                    print(f"Depth went negative at line {line_num}: {line.strip()}")
                    return

check_braces('App.tsx')

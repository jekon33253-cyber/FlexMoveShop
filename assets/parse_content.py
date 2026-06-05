import re

file_path = "/Users/yevheniisemenov/.gemini/antigravity-ide/brain/460de74e-e968-43f0-9e77-6c27af6e1675/.system_generated/steps/407/content.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

print("=== SEARCHING FOR /CDN/SHOP/ OCCURRENCES ===")
matches = [m.start() for m in re.finditer(r'/cdn/shop/', content)]
print(f"Found {len(matches)} occurrences.")

for idx, pos in enumerate(matches[:30]):
    start = max(0, pos - 50)
    end = min(len(content), pos + 100)
    snippet = content[start:end].replace('\n', ' ')
    print(f"{idx+1}: ... {snippet} ...")

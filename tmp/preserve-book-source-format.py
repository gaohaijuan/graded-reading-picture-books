import json,re,subprocess
from pathlib import Path
repo=Path(__file__).resolve().parents[1]/'little-protagonist'
p=repo/'content/level1-stories-11-20.json';text=p.read_text(encoding='utf8')
pattern=r'\[\n\s+"(?:\\.|[^"\\])*"(?:,\n\s+"(?:\\.|[^"\\])*")*\n\s+\]'
text=re.sub(pattern,lambda m:json.dumps(json.loads(m.group()),ensure_ascii=False),text)
p.write_text(text,encoding='utf8')
changed=set(subprocess.check_output(['git','diff','--name-only'],cwd=repo).decode('utf8').splitlines())
for line in subprocess.check_output(['git','ls-files','--eol'],cwd=repo).decode('utf8').splitlines():
    info,name=line.split('\t',1)
    if name not in changed or not info.startswith('i/crlf'):continue
    f=repo/name;raw=f.read_bytes();f.write_bytes(raw.replace(b'\r\n',b'\n').replace(b'\n',b'\r\n'))
print('Preserved manuscript compact arrays and existing tracked CRLF line endings.')

"""Prepare a current project snapshot for a new private GitHub repository."""
from __future__ import annotations
import collections, datetime, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SOURCE = Path(__file__).resolve().parents[1]
DEST = SOURCE / ".github-upload"
if DEST.parent.resolve() != SOURCE.resolve():
    raise RuntimeError("Archive destination is outside the workspace")
DEST.mkdir(exist_ok=True)
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", ".cache",
             ".pytest_cache", ".local", ".github-upload", "docx-render-runtime"}
LFS_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf", ".docx", ".xlsx",
            ".pptx", ".zip", ".7z", ".psd", ".ai", ".ttf", ".otf", ".woff",
            ".woff2", ".mp3", ".mp4", ".wav", ".glb", ".wasm"}
EXCLUDE_EXTS = {".log", ".pyc", ".pyo", ".sqlite", ".sqlite-shm", ".sqlite-wal",
               ".db", ".pem", ".key", ".p12", ".pfx"}
manifest, excluded, unique = [], [], {}
by_group = collections.defaultdict(lambda: {"files": 0, "bytes": 0})
linked = copied = 0

def exclude(relative, reason):
    excluded.append({"path": relative, "reason": reason})

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(4 * 1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

for base, dirs, files in os.walk(SOURCE):
    parent, kept = Path(base), []
    for name in sorted(dirs):
        folder = parent / name
        rel = folder.relative_to(SOURCE).as_posix()
        if name in SKIP_DIRS:
            exclude(rel + "/", "Local Git metadata, dependencies, runtime or cache")
        elif name.startswith("fifteen-e2e-"):
            exclude(rel + "/", "Ephemeral test service data and generated downloads")
        elif rel in {"little-protagonist/server/data", "little-protagonist/preview/test-results"}:
            exclude(rel + "/", "Service runtime data or transient test state")
        elif folder.is_symlink() or folder.is_junction():
            exclude(rel + "/", "External link or junction is not followed")
        else:
            kept.append(name)
    dirs[:] = kept
    for name in sorted(files):
        src = parent / name
        rel, suffix = src.relative_to(SOURCE).as_posix(), src.suffix.lower()
        if src.is_symlink():
            exclude(rel, "Symbolic link is not followed")
            continue
        if name.startswith(".env") and name != ".env.example":
            exclude(rel, "Local environment credentials")
            continue
        if name in {"project.private.config.json", ".DS_Store", "Thumbs.db", "credentials.json", "cookies.json", "storage-state.json"}:
            exclude(rel, "Local settings, authentication or machine state")
            continue
        if suffix in EXCLUDE_EXTS:
            exclude(rel, "Runtime log, database, credential material or bytecode")
            continue
        dst = DEST / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        before, digest = src.stat(), sha256(src)
        after = src.stat()
        if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
            raise RuntimeError(f"Source changed while reading: {rel}")
        if dst.exists():
            if sha256(dst) != digest:
                raise RuntimeError(f"Existing archive file differs: {rel}")
        elif suffix in LFS_EXTS or before.st_size >= 1024 * 1024:
            try:
                os.link(src, dst)
                linked += 1
            except OSError:
                shutil.copy2(src, dst)
                copied += 1
        else:
            shutil.copy2(src, dst)
            copied += 1
        is_lfs = suffix in LFS_EXTS
        manifest.append({"path": rel, "bytes": before.st_size, "sha256": digest, "git_lfs": is_lfs})
        unique.setdefault(digest, {"bytes": before.st_size, "git_lfs": is_lfs})
        group = rel.split("/")[0]
        by_group[group]["files"] += 1
        by_group[group]["bytes"] += before.st_size
        if len(manifest) % 400 == 0:
            print(json.dumps({"processed": len(manifest), "current_group": group}), flush=True)

def write_json(name, value):
    (DEST / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

summary = {
    "included_files": len(manifest),
    "logical_bytes": sum(x["bytes"] for x in manifest),
    "unique_content_bytes": sum(x["bytes"] for x in unique.values()),
    "git_lfs_files": sum(x["git_lfs"] for x in manifest),
    "unique_lfs_bytes": sum(x["bytes"] for x in unique.values() if x["git_lfs"]),
    "groups": dict(sorted(by_group.items())),
    "hardlinked_files": linked, "copied_files": copied,
}
write_json("FILE-MANIFEST.json", {
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "scope": "Current project source, original art, rendered books, manuscript versions, development documents and QA resources",
    "hash_algorithm": "sha256", "summary": summary, "files": manifest,
})
write_json("UPLOAD-EXCLUSIONS.json", {
    "policy": "Exclude local credentials, operational databases, dependencies and transient runtimes; retain project code, art, book content and documents.",
    "entries": excluded,
})
history = {}
for key, args in {"branch": ["branch", "--show-current"], "head": ["rev-parse", "HEAD"], "tracked_files": ["ls-files"]}.items():
    result = subprocess.run(["git", "-C", str(SOURCE / "little-protagonist"), *args],
                            capture_output=True, text=True, encoding="utf-8", errors="replace")
    history[key] = len(result.stdout.splitlines()) if key == "tracked_files" else result.stdout.strip()
write_json("SOURCE-STATE.json", {
    "source_workspace": str(SOURCE),
    "snapshot_type": "Current working files, including uncommitted project assets and manuscripts",
    "original_code_repository": history, "original_git_repository_is_unchanged": True,
    "historical_git_objects_are_not_part_of_this_new_repository": True,
    "repository_name": "graded-reading-picture-books", "repository_visibility_required": "private",
})
attributes = ["# Preserve original file bytes, including original line endings.", "* -text"]
attributes += [f"*{ext} filter=lfs diff=lfs merge=lfs -text" for ext in sorted(LFS_EXTS)]
(DEST / ".gitattributes").write_text("\n".join(attributes) + "\n", encoding="utf-8")
(DEST / ".gitignore").write_text(
    "node_modules/\n__pycache__/\n.venv/\n.local/\n.env\n.env.*\n!.env.example\n"
    "project.private.config.json\n*.log\n*.sqlite\n*.sqlite-shm\n*.sqlite-wal\n"
    "*.db\n*.pem\n*.key\n*.p12\n*.pfx\nlittle-protagonist/server/data/\n", encoding="utf-8")
(DEST / "README.md").write_text(
    "# 分级阅读绘本项目\n\n"
    "本仓库汇总分级阅读绘本的项目代码、插画和人物素材、绘本文稿、校样、开发文档及审核资料。\n"
    "这是当前工作文件的独立私有快照；各版本的审阅和完成状态以对应目录说明为准。\n\n"
    "## 目录\n\n"
    "- little-protagonist/：小程序、浏览器预览、后台、构建脚本、测试、原始美术资源与开发文档。\n"
    "- output/：各级绘本文稿、插画、PDF/Word 校样、历史修订与字表核查。\n"
    "- output/level3-full-review-v4-20261031/：第三级 15 篇完整复审修订稿及逐字核查。\n"
    "- browser-test/：浏览器验收图与检查结果。\n"
    "- tmp/：保留有价值的制作脚本和 PDF 校样；不包含下载的渲染运行库和临时服务数据。\n"
    "- FILE-MANIFEST.json：逐文件 SHA-256、大小、LFS 标记及汇总。\n"
    "- UPLOAD-EXCLUSIONS.json：未上传的依赖、缓存、凭据和运行数据记录。\n"
    "- SOURCE-STATE.json：原项目版本与本次快照范围。\n\n"
    "## 获取资源\n\n"
    "插画、PDF、Office 文件、字体等由 Git LFS 保存。克隆前安装 Git LFS，克隆后执行：\n\n"
    "    git lfs install\n    git lfs pull\n\n"
    "## 开发入口\n\n"
    "先阅读 little-protagonist/AGENTS.md、little-protagonist/README.md 和 "
    "little-protagonist/migration/STARTUP.md，再进入应用目录：\n\n"
    "    cd little-protagonist\n    npm test\n    npm run preview\n\n"
    "实际平台凭据和部署环境须在本机配置，参考 .env.example；运行数据库和认证状态不在仓库中。\n"
    "本次仅归档当前文件，没有改写原应用仓库的分支、远程地址或提交历史。\n", encoding="utf-8")
print(json.dumps({"destination": str(DEST), "summary": summary, "excluded_entries": len(excluded)},
                 ensure_ascii=False, indent=2), flush=True)


import base64
import json
import os
import posixpath
import re
import uuid
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

import boto3


s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

S3_BUCKET = os.environ["S3_BUCKET"]
DDB_TABLE = os.environ["DDB_TABLE"]

MAX_ANALYZED_FILES = 120
MAX_FILE_SIZE = 100_000
MAX_TOTAL_SOURCE_SIZE = 2_500_000

SUPPORTED_EXTENSIONS = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".py": "python",
    ".java": "java",
    ".go": "go",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".hpp": "cpp",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".md": "markdown",
    ".txt": "text",
}

SKIP_PARTS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    "vendor",
    "__pycache__",
}

SKIP_NAMES = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
}


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.environ.get(
                "ALLOWED_ORIGIN", "*"
            ),
            "Access-Control-Allow-Headers": "content-type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def parse_body(event):
    body = event.get("body")

    if not body:
        return {}

    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")

    if isinstance(body, dict):
        return body

    return json.loads(body)


def parse_github_url(repo_url):
    parsed = urlparse(repo_url)

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Repository URL must use http or https.")

    if parsed.netloc.lower() != "github.com":
        raise ValueError("Only public GitHub repository URLs are supported.")

    parts = [p for p in parsed.path.split("/") if p]

    if len(parts) < 2:
        raise ValueError(
            "GitHub URL must look like https://github.com/user/repository"
        )

    owner = parts[0]
    repo = parts[1]

    if repo.endswith(".git"):
        repo = repo[:-4]

    return owner, repo


def github_get(url):
    request = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "CodebaseNavigator/1.0",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))

    except HTTPError as exc:
        if exc.code == 404:
            raise ValueError("Repository was not found or is not public.")

        if exc.code == 403:
            raise ValueError("GitHub rate limit reached. Please try again later.")

        raise ValueError(f"GitHub returned HTTP {exc.code}.")

    except URLError:
        raise ValueError("Could not connect to GitHub.")


def raw_get(url):
    request = Request(
        url,
        headers={
            "User-Agent": "CodebaseNavigator/1.0",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=15) as response:
            data = response.read(MAX_FILE_SIZE + 1)

            if len(data) > MAX_FILE_SIZE:
                return None

            return data

    except HTTPError:
        return None

    except URLError:
        return None


def should_include(path):
    path_parts = set(path.split("/"))
    name = path.split("/")[-1]

    if path_parts.intersection(SKIP_PARTS):
        return False

    if name in SKIP_NAMES:
        return False

    lowered = name.lower()

    if lowered.endswith((".pem", ".key", ".crt")):
        return False

    extension = os.path.splitext(name)[1].lower()

    return extension in SUPPORTED_EXTENSIONS


def language_for(path):
    extension = os.path.splitext(path)[1].lower()
    return SUPPORTED_EXTENSIONS.get(extension, "text")


def extract_imports(content, language):
    imports = []

    if language in {"javascript", "typescript"}:
        patterns = [
            r'import\s+(?:[\s\S]*?\s+from\s+)?["\']([^"\']+)["\']',
            r'import\s*\(\s*["\']([^"\']+)["\']\s*\)',
            r'require\s*\(\s*["\']([^"\']+)["\']\s*\)',
            r'export\s+[\s\S]*?\s+from\s+["\']([^"\']+)["\']',
        ]

        for pattern in patterns:
            imports.extend(re.findall(pattern, content))

    elif language == "python":
        imports.extend(
            re.findall(
                r'^\s*from\s+([a-zA-Z0-9_\.]+)\s+import',
                content,
                re.MULTILINE,
            )
        )

        imports.extend(
            re.findall(
                r'^\s*import\s+([a-zA-Z0-9_\.]+)',
                content,
                re.MULTILINE,
            )
        )

    elif language == "java":
        imports.extend(
            re.findall(
                r'^\s*import\s+([a-zA-Z0-9_\.]+)',
                content,
                re.MULTILINE,
            )
        )

    elif language == "go":
        imports.extend(re.findall(r'"([^"]+)"', content))

    return sorted(set(imports))


def extract_symbols(content, language):
    symbols = []

    if language in {"javascript", "typescript"}:
        symbols.extend(
            re.findall(
                r'\b(?:function|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)',
                content,
            )
        )

        symbols.extend(
            re.findall(
                r'\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?\(',
                content,
            )
        )

    elif language == "python":
        symbols.extend(
            re.findall(
                r'^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)',
                content,
                re.MULTILINE,
            )
        )

        symbols.extend(
            re.findall(
                r'^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)',
                content,
                re.MULTILINE,
            )
        )

    elif language == "java":
        symbols.extend(
            re.findall(
                r'\bclass\s+([A-Za-z_][A-Za-z0-9_]*)',
                content,
            )
        )

    return sorted(set(symbols))


def resolve_import(source_path, import_name, file_paths, language):
    file_set = set(file_paths)

    if language in {"javascript", "typescript"}:
        if not import_name.startswith("."):
            return None

        base_dir = posixpath.dirname(source_path)
        target = posixpath.normpath(
            posixpath.join(base_dir, import_name)
        )

        candidates = [
            target,
            target + ".js",
            target + ".jsx",
            target + ".ts",
            target + ".tsx",
            posixpath.join(target, "index.js"),
            posixpath.join(target, "index.jsx"),
            posixpath.join(target, "index.ts"),
            posixpath.join(target, "index.tsx"),
        ]

        for candidate in candidates:
            if candidate in file_set:
                return candidate

    elif language == "python":
        if import_name.startswith("."):
            dots = len(import_name) - len(import_name.lstrip("."))
            module_name = import_name[dots:]
            base_dir = posixpath.dirname(source_path)

            for _ in range(max(dots - 1, 0)):
                base_dir = posixpath.dirname(base_dir)

            target = module_name.replace(".", "/")

            candidates = [
                posixpath.normpath(posixpath.join(base_dir, target + ".py")),
                posixpath.normpath(posixpath.join(base_dir, target, "__init__.py")),
            ]

            for candidate in candidates:
                if candidate in file_set:
                    return candidate

        else:
            target = import_name.replace(".", "/")

            candidates = [
                target + ".py",
                posixpath.join(target, "__init__.py"),
            ]

            for candidate in candidates:
                if candidate in file_set:
                    return candidate

    return None


def choose_files(tree):
    candidates = []

    for item in tree:
        if item.get("type") != "blob":
            continue

        path = item.get("path", "")

        if not should_include(path):
            continue

        candidates.append(item)

    def priority(item):
        path = item["path"].lower()
        name = path.split("/")[-1]

        score = 0

        if name in {"readme.md", "package.json", "pyproject.toml", "requirements.txt"}:
            score += 50

        if path.endswith((
            ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go",
            ".c", ".cpp", ".h", ".hpp"
        )):
            score += 30

        if path.count("/") <= 2:
            score += 10

        return -score, path

    candidates.sort(key=priority)

    return candidates[:MAX_ANALYZED_FILES]


def get_repository_tree(owner, repo, branch):
    encoded_branch = quote(branch, safe="")

    url = (
        f"https://api.github.com/repos/{owner}/{repo}"
        f"/git/trees/{encoded_branch}?recursive=1"
    )

    data = github_get(url)

    if data.get("truncated"):
        raise ValueError(
            "This repository is too large for the current hackathon analyzer. "
            "GitHub returned a truncated repository tree."
        )

    return data.get("tree", [])


def put_json_s3(key, payload):
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )


def lambda_handler(event, context):
    if (
        event.get("requestContext", {})
        .get("http", {})
        .get("method")
        == "OPTIONS"
    ):
        return response(200, {"ok": True})

    try:
        body = parse_body(event)
        repo_url = body.get("repoUrl", "").strip()

        if not repo_url:
            return response(400, {"message": "repoUrl is required."})

        owner, repo = parse_github_url(repo_url)

        repository = github_get(
            f"https://api.github.com/repos/{owner}/{repo}"
        )

        default_branch = repository.get("default_branch", "main")
        tree = get_repository_tree(owner, repo, default_branch)
        selected = choose_files(tree)

        repository_id = f"repo_{uuid.uuid4().hex[:12]}"

        file_paths = [item["path"] for item in selected]
        file_records = []
        graph_nodes = []
        graph_edges = []

        total_source_bytes = 0
        analyzed_count = 0

        for item in selected:
            path = item["path"]

            raw_url = (
                f"https://raw.githubusercontent.com/"
                f"{owner}/{repo}/"
                f"{quote(default_branch, safe='')}/"
                f"{quote(path, safe='/')}"
            )

            data = raw_get(raw_url)

            if data is None:
                continue

            if total_source_bytes + len(data) > MAX_TOTAL_SOURCE_SIZE:
                break

            content = data.decode("utf-8", errors="replace")
            language = language_for(path)
            imports = extract_imports(content, language)
            symbols = extract_symbols(content, language)

            s3_key = (
                f"repositories/{repository_id}/files/{path}"
            )

            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=content.encode("utf-8"),
                ContentType="text/plain; charset=utf-8",
            )

            file_records.append(
                {
                    "path": path,
                    "language": language,
                    "size": len(data),
                    "imports": imports,
                    "symbols": symbols,
                    "s3Key": s3_key,
                }
            )

            graph_nodes.append(
                {
                    "id": path,
                    "label": path.split("/")[-1],
                    "path": path,
                    "type": "file",
                }
            )

            total_source_bytes += len(data)
            analyzed_count += 1

        included_paths = [record["path"] for record in file_records]
        included_path_set = set(included_paths)

        for record in file_records:
            source_path = record["path"]
            language = record["language"]

            for imported in record["imports"]:
                target = resolve_import(
                    source_path,
                    imported,
                    included_paths,
                    language,
                )

                if target and target in included_path_set:
                    graph_edges.append(
                        {
                            "source": source_path,
                            "target": target,
                            "relation": "imports",
                        }
                    )

        index = {
            "repositoryId": repository_id,
            "repositoryUrl": repository["html_url"],
            "name": repository["name"],
            "owner": owner,
            "repo": repo,
            "defaultBranch": default_branch,
            "description": repository.get("description"),
            "fileCountTotal": len(
                [x for x in tree if x.get("type") == "blob"]
            ),
            "filesAnalyzed": analyzed_count,
            "files": file_records,
            "graph": {
                "nodes": graph_nodes,
                "edges": graph_edges,
            },
            "analysisLimits": {
                "maxAnalyzedFiles": MAX_ANALYZED_FILES,
                "maxFileBytes": MAX_FILE_SIZE,
                "maxTotalSourceBytes": MAX_TOTAL_SOURCE_SIZE,
            },
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

        index_key = f"repositories/{repository_id}/index.json"
        put_json_s3(index_key, index)

        now = datetime.now(timezone.utc).isoformat()
        table = dynamodb.Table(DDB_TABLE)

        table.put_item(
            Item={
                "repositoryId": repository_id,
                "repositoryUrl": repository["html_url"],
                "name": repository["name"],
                "owner": owner,
                "repo": repo,
                "defaultBranch": default_branch,
                "status": "completed",
                "fileCount": len(
                    [x for x in tree if x.get("type") == "blob"]
                ),
                "filesAnalyzed": analyzed_count,
                "s3IndexKey": index_key,
                "s3Prefix": f"repositories/{repository_id}/",
                "createdAt": now,
                "updatedAt": now,
            }
        )

        return response(
            200,
            {
                "repositoryId": repository_id,
                "name": repository["name"],
                "url": repository["html_url"],
                "status": "completed",
                "fileCount": len(
                    [x for x in tree if x.get("type") == "blob"]
                ),
                "filesAnalyzed": analyzed_count,
            },
        )

    except ValueError as exc:
        return response(400, {"message": str(exc)})

    except Exception as exc:
        print("Analyze Lambda error:", repr(exc))
        return response(
            500,
            {"message": "Repository analysis failed. Check CloudWatch logs."},
        )
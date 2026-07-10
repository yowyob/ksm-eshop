import json

log_path = "/Users/computer-care/.gemini/antigravity/brain/8da3f8b5-f91f-474e-a4c0-8bb55d84a271/.system_generated/logs/transcript.jsonl"
with open(log_path, 'r') as f:
    for line in f:
        step = json.loads(line)
        if "tool_calls" in step:
            for tc in step["tool_calls"]:
                if tc["name"] in ["default_api:write_to_file", "default_api:replace_file_content"]:
                    args = tc["args"]
                    if args.get("TargetFile", "").endswith("src/app/admin/[tenantId]/page.tsx"):
                        print(f"--- TOOL CALL {tc['name']} ---")
                        if "CodeContent" in args:
                            print(args["CodeContent"][:500] + "...\n")
                        elif "ReplacementContent" in args:
                            print(args["ReplacementContent"][:500] + "...\n")

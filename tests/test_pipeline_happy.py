import asyncio, json, sys, pytest
from mcp.client.stdio import stdio_client
from mcp import ClientSession, StdioServerParameters

QUESTION = "State-of-the-art photonic qubits 2025"

@pytest.mark.asyncio
async def test_pipeline():
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "mcp_server.server"])
    async with stdio_client(params) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            resp = await s.call_tool(
                name="web_research",
                arguments={"args": {"instruction": QUESTION, "num_queries": 2}})
            from mcp.types import TextContent
            data = json.loads(TextContent.model_validate(resp.content[0]).text)
            assert QUESTION.lower().split()[0] in data["answer"].lower()
            assert len(data["queries"]) == 2 
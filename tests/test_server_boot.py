import asyncio, json, sys, pytest
from mcp.client.stdio import stdio_client
from mcp import ClientSession, StdioServerParameters

@pytest.mark.asyncio
async def test_boot_and_list_tools():
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "mcp_server.server"])
    async with stdio_client(params) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            tools = await s.list_tools()
            names = [t.name for t in tools.tools]
            assert "web_research" in names 
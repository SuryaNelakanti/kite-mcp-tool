import json, logging
from mcp.server.fastmcp import FastMCP
from mcp.client.sse import sse_client
from mcp import ClientSession
from pydantic import HttpUrl

from .agents import create_query_agent, create_qa_agent
from .tools import TavilySearchTool, WebpageScraperTool
from .tools.tavily_search import TavilySearchToolInputSchema
from .tools.webpage_scraper import WebpageScraperToolInputSchema
from .agents.query_agent import QueryInput
from .agents.qa_agent import QAInput

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("mcp-server")

# 7.1  Bridge *remote* SSE server (Kite) into this process ­--► stdio
KITE_ENDPOINT = "https://mcp.kite.trade/sse"

async def kite_session():
    "Upstream session helper – returns ready ClientSession instance."
    async with sse_client(url=KITE_ENDPOINT) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            return session

def main() -> None:
    mcp = FastMCP("atomic_research")

    query_agent = create_query_agent()
    qa_agent    = create_qa_agent()
    tavily      = TavilySearchTool()
    scraper     = WebpageScraperTool()

    @mcp.tool(name="web_research",
              description="End-to-end research with remote Kite tools")
    async def research_tool(args: dict) -> str:
        q = args.get("instruction") or args["question"]
        n = int(args.get("num_queries", 3))

        # A) generate search terms
        generated = query_agent.run(QueryInput(instruction=q, num_queries=n))
        search_input = TavilySearchToolInputSchema(queries=generated.queries)

        # B) perform search + scrape
        results = tavily.run(search_input).results[:5]
        pages   = [scraper.run(WebpageScraperToolInputSchema(url=HttpUrl(r.url)))
                   for r in results]

        # C) answer
        answer  = qa_agent.run(QAInput(question=q, context=pages))

        return json.dumps({
            "queries": generated,
            "top_urls": [r.url for r in results],
            "answer": answer,
        }, indent=2)

    mcp.run()

if __name__ == "__main__":
    main() 
import instructor, openai
from pydantic import Field
from atomic_agents.agents.base_agent import (
    AgentMemory, BaseAgent, BaseAgentConfig, BaseIOSchema)
from atomic_agents.lib.components.system_prompt_generator import \
    SystemPromptGenerator
from ..config import ChatConfig
from ..tools.tavily_search import TavilySearchToolInputSchema

class QueryInput(BaseIOSchema):
    instruction: str = Field(..., description="What to research")
    num_queries: int = Field(..., description="How many queries to produce")

def create_query_agent() -> BaseAgent:
    client = openai.OpenAI(
        api_key=ChatConfig.api_key,
        base_url=ChatConfig.base) if ChatConfig.base else openai.OpenAI(
        api_key=ChatConfig.api_key)

    return BaseAgent(BaseAgentConfig(
        client=instructor.from_openai(client),
        model=ChatConfig.model,
        memory=AgentMemory(
            max_messages=100
        ),
        temperature=0.0,
        max_tokens=1000,
        model_api_parameters={
            "temperature": 0.0,
            "max_tokens": 1000
        },
        system_prompt_generator=SystemPromptGenerator(
            background=["Expert at crafting web-search queries"],
            steps=[
                "Parse instruction for key entities", "Craft engine-style query",
                "Vary phrasing to capture breadth"],
            output_instructions=[
                "Return exactly {num_queries} plain strings"]),
        input_schema=QueryInput,
        output_schema=TavilySearchToolInputSchema,
    )) 
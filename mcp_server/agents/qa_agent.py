import instructor, openai
from pydantic import Field
from atomic_agents.agents.base_agent import (
    AgentMemory, BaseAgent, BaseAgentConfig, BaseIOSchema)
from atomic_agents.lib.components.system_prompt_generator import \
    SystemPromptGenerator
from ..config import ChatConfig
from ..tools.webpage_scraper import WebpageScraperToolOutputSchema

class QAInput(BaseIOSchema):
    question: str = Field(..., description="User query")
    context: list[WebpageScraperToolOutputSchema] = Field(
        ..., description="Scraped pages")

class QAOutput(BaseIOSchema):
    answer: str

def create_qa_agent() -> BaseAgent:
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
            background=["Senior research analyst"],
            steps=[
                "Read all context", "Extract corroborated facts",
                "Compose direct answer with citations"],
            output_instructions=["Return markdown answer with numbered refs"]),
        input_schema=QAInput,
        output_schema=QAOutput
    )) 
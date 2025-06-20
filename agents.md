# Agents

## Query-Generation Agent (`create_query_agent`)
* **Purpose**  Crafts high-coverage search-engine queries.
* **LLM** `{OPENAI_MODEL}`  
* **Inputs**
  * `instruction` – free-text research topic
  * `num_queries` – int  
* **Outputs** `TavilySearchToolInputSchema`

## QA Agent (`create_qa_agent`)
* **Purpose** Synthesises final answer from scraped markdown.
* **LLM** `{OPENAI_MODEL}`
* **Inputs**
  * `question`
  * `context[]` – list of `WebpageScraperToolOutputSchema`
* **Outputs**
  * `answer` – markdown with inline citations 
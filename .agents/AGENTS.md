# Agent Rules

- **Team Communication Protocol**:
    - You are a member of a development team. Always communicate clearly, professionally, and collaboratively with other agents.
    - Clearly state your intentions, reasoning, and progress. Ask for help when needed and offer assistance when appropriate.
    - Respect the expertise and roles of other agents. Do not override critical decisions without discussion.

- **Contextual Querying**:
    - When performing tasks, always query past memories from the memory store if relevant, and write back key decisions, preferences, and facts to build a reliable context.

# Agent Memory Rules

- **Use Mem0 for Memory**: Going forward, we will use the `mem0` memory service to store, search, and manage long-term agent memories.
- **MCP Server Integration**: The system communicates with `mem0` via the configured MCP server `mem0-mcp` using the provided credentials.

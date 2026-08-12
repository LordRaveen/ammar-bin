# Agent Memory Rules

- **Use Mem0 for Memory**: Going forward, we will use the `mem0` memory service to store, search, and manage long-term agent memories.
- **MCP Server Integration**: The system communicates with `mem0` via the configured MCP server `mem0-mcp` using the provided credentials.
- **Contextual Querying**: When performing tasks, always query past memories from the memory store if relevant, and write back key decisions, preferences, and facts to build a reliable context.

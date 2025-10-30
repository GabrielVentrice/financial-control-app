# Documentation API Endpoints

This directory contains API endpoints designed to provide machine-readable access to the project's API documentation. These endpoints are optimized for consumption by AI agents, automated tools, and external documentation systems.

## Available Endpoints

### 1. GET /api/docs/architecture

Returns the complete API architecture documentation in Markdown format.

**Purpose:**
- Provide AI agents with comprehensive API context
- Enable automated documentation tooling
- Support integration with external documentation systems
- Serve as LLM context for code generation

**Response:**
- **Content-Type**: `text/markdown; charset=utf-8`
- **Body**: Complete content of `API_ARCHITECTURE.md`

**Example Usage:**

```bash
# Fetch documentation
curl http://localhost:3000/api/docs/architecture

# Save to file
curl http://localhost:3000/api/docs/architecture > docs-output.md

# Pipe to another tool
curl http://localhost:3000/api/docs/architecture | grep "Query Parameters"
```

**Use Cases:**
- AI agents (like Claude, GPT) needing API context
- Documentation generators
- API clients needing current endpoint information
- Integration testing tools

---

### 2. GET /api/docs/generate

Generates API documentation dynamically by scanning the current codebase structure.

**Purpose:**
- Verify if `API_ARCHITECTURE.md` is up to date
- Generate API reference automatically
- Discover all available endpoints programmatically
- Audit codebase structure

**Response:**
- **Content-Type**: `application/json`
- **Body**: Documentation metadata object

**Response Schema:**

```typescript
{
  generatedAt: string,           // ISO 8601 timestamp of generation

  endpoints: Array<{             // Discovered API endpoints
    method: string,              // HTTP method (GET, POST, etc.)
    path: string,                // Endpoint path
    file: string,                // Source file location
    description: string,         // Extracted JSDoc description
    queryParams: string[]        // Detected query parameters
  }>,

  utilities: Array<{             // Server utility modules
    file: string,                // File name
    path: string,                // Full path
    functions: string[]          // Exported function names
  }>,

  types: {                       // Type definitions
    interfaces: Array<{
      name: string,              // Interface name
      fields: string[]           // Field definitions
    }>
  },

  architecture: {                // Architecture layers
    layers: Array<{
      name: string,              // Layer name
      location: string,          // File location
      description: string        // Purpose description
    }>
  },

  markdown: string               // Generated markdown documentation
}
```

**Example Usage:**

```bash
# Fetch generated documentation
curl http://localhost:3000/api/docs/generate

# Pretty print JSON
curl http://localhost:3000/api/docs/generate | jq '.'

# Extract just the markdown
curl http://localhost:3000/api/docs/generate | jq -r '.markdown'

# Get endpoint count
curl http://localhost:3000/api/docs/generate | jq '.endpoints | length'

# List all endpoints
curl http://localhost:3000/api/docs/generate | jq '.endpoints[] | "\(.method) \(.path)"'

# Check generation timestamp
curl http://localhost:3000/api/docs/generate | jq -r '.generatedAt'
```

**Use Cases:**
- Documentation validation scripts
- CI/CD documentation checks
- API discovery tools
- Codebase auditing
- Generating API reference from code

---

## Maintenance Scripts

The project includes npm scripts to help maintain documentation:

### Check Documentation

```bash
npm run docs:check
```

Validates that `API_ARCHITECTURE.md` exists and contains expected sections.

### Generate Documentation Preview

```bash
npm run docs:generate
```

Starts dev server, generates documentation dynamically, and displays a preview in the console.

### Update Documentation

```bash
npm run docs:update
```

Displays instructions for updating `API_ARCHITECTURE.md`. Currently manual, but provides guidance.

---

## Integration Examples

### Using with AI Agents

**Claude Code / GPT:**
```
Fetch documentation from http://localhost:3000/api/docs/architecture
and help me understand the transaction filtering system.
```

### Using with Scripts

**Node.js:**
```javascript
const response = await fetch('http://localhost:3000/api/docs/architecture')
const markdown = await response.text()
console.log(markdown)
```

**Python:**
```python
import requests

response = requests.get('http://localhost:3000/api/docs/architecture')
documentation = response.text
print(documentation)
```

**Shell Script:**
```bash
#!/bin/bash
DOC=$(curl -s http://localhost:3000/api/docs/architecture)
echo "$DOC" | grep -A 10 "Query Parameters"
```

### Using with Documentation Tools

**MkDocs:**
```bash
curl http://localhost:3000/api/docs/architecture > docs/api-reference.md
mkdocs build
```

**Docusaurus:**
```bash
curl http://localhost:3000/api/docs/architecture > docs/api/architecture.md
npm run build
```

---

## Implementation Details

### Architecture Endpoint

**File**: `server/api/docs/architecture.get.ts`

- Reads `API_ARCHITECTURE.md` from project root
- Sets appropriate Content-Type header
- Returns raw markdown content
- Handles errors with proper HTTP status codes

### Generate Endpoint

**File**: `server/api/docs/generate.get.ts`

- Scans `server/api/` directory for endpoint files
- Scans `server/utils/` for utility modules
- Extracts type definitions from `types/transaction.ts`
- Parses JSDoc comments for descriptions
- Generates both JSON metadata and markdown output

**What It Detects:**
- ✅ API endpoints (HTTP method, path, description)
- ✅ Query parameters (from `getQuery(event)` usage)
- ✅ Exported functions in utilities
- ✅ TypeScript interfaces
- ✅ Architecture layers

**Limitations:**
- Basic JSDoc parsing (may miss complex comments)
- Query param detection is pattern-based
- Type extraction uses regex (not full TS parser)
- Manual documentation in `API_ARCHITECTURE.md` is still more comprehensive

---

## Best Practices

### For API Consumers

1. **Cache responses**: Documentation doesn't change frequently
2. **Handle errors**: Check HTTP status codes
3. **Parse markdown carefully**: Structure may evolve
4. **Validate JSON**: Use schema validation for `/generate` endpoint

### For Developers

1. **Use JSDoc comments**: Document endpoints thoroughly
2. **Update API_ARCHITECTURE.md**: Keep manual docs synchronized
3. **Run validation scripts**: Use `npm run docs:check` before commits
4. **Test endpoints**: Verify both endpoints after major changes

---

## Future Enhancements

Potential improvements for these endpoints:

- [ ] **OpenAPI/Swagger generation**: Convert to OpenAPI 3.0 spec
- [ ] **Versioning**: Support multiple API versions
- [ ] **Caching**: Add ETag support for better caching
- [ ] **Format options**: Support JSON, YAML, HTML output
- [ ] **Diff endpoint**: Compare current vs. documented state
- [ ] **Webhook notifications**: Alert when docs are outdated
- [ ] **Auto-update**: Automatically update `API_ARCHITECTURE.md`

---

## Troubleshooting

### Documentation not loading

**Error**: 500 Internal Server Error

**Possible causes:**
- `API_ARCHITECTURE.md` file missing
- File permissions issue
- Path resolution problem

**Solution:**
```bash
# Verify file exists
ls -la API_ARCHITECTURE.md

# Check file permissions
chmod 644 API_ARCHITECTURE.md

# Test endpoint
curl -v http://localhost:3000/api/docs/architecture
```

### Generate endpoint slow

**Issue**: `/api/docs/generate` takes a long time

**Possible causes:**
- Large codebase
- Many files to scan
- Complex type definitions

**Solution:**
- Results are generated on-demand (no caching yet)
- Consider adding caching layer in future
- Use `/api/docs/architecture` for faster access to static docs

### Incomplete generated documentation

**Issue**: Generated docs missing some endpoints

**Possible causes:**
- Endpoint not following naming convention (`.get.ts`, `.post.ts`, etc.)
- JSDoc comments not properly formatted
- File permissions preventing reading

**Solution:**
```bash
# Verify endpoint files
find server/api -name "*.ts"

# Check file naming
ls -la server/api/**/*.ts

# Verify JSDoc format
head -20 server/api/your-endpoint.get.ts
```

---

## Contributing

When adding new endpoints or modifying existing ones:

1. Add comprehensive JSDoc comments
2. Update `API_ARCHITECTURE.md` manually
3. Run `npm run docs:check` to validate
4. Test both documentation endpoints
5. Commit documentation changes with code changes

---

## Related Documentation

- [API_ARCHITECTURE.md](../../../API_ARCHITECTURE.md) - Complete API architecture documentation
- [CLAUDE.md](../../../CLAUDE.md) - Project context and guidelines
- [README.md](../../../README.md) - Project setup and overview

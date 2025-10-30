#!/usr/bin/env python3
"""
Example: AI Documentation Consumer (Python)

This script demonstrates how AI agents or automated tools written in Python
can consume the documentation API to understand the application's architecture.

Requirements:
    pip install requests

Usage:
    # Make sure dev server is running
    npm run dev

    # In another terminal
    python3 examples/ai-documentation-consumer.py
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Any

API_BASE_URL = 'http://localhost:3000'


def fetch_architecture_doc() -> str:
    """Fetches the complete API documentation in Markdown format."""
    print('📚 Fetching API Architecture Documentation...\n')

    try:
        response = requests.get(f'{API_BASE_URL}/api/docs/architecture')
        response.raise_for_status()

        markdown = response.text

        print('✅ Documentation fetched successfully!')
        print(f'📄 Size: {len(markdown) / 1024:.2f} KB')
        print(f'📝 Lines: {len(markdown.splitlines())}\n')

        # Extract sections
        sections = extract_sections(markdown)
        print('📋 Documentation Sections:')
        for section in sections:
            print(f'   - {section}')

        return markdown

    except requests.exceptions.RequestException as e:
        print(f'❌ Error fetching documentation: {e}')
        raise


def fetch_generated_doc() -> Dict[str, Any]:
    """Fetches dynamically generated documentation metadata."""
    print('\n🔧 Fetching Generated Documentation...\n')

    try:
        response = requests.get(f'{API_BASE_URL}/api/docs/generate')
        response.raise_for_status()

        data = response.json()

        print('✅ Generated documentation fetched successfully!')
        print(f'🕒 Generated at: {datetime.fromisoformat(data["generatedAt"].replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M:%S")}')
        print(f'📡 Endpoints: {len(data["endpoints"])}')
        print(f'🔧 Utilities: {len(data["utilities"])}')
        print(f'📦 Type Interfaces: {len(data["types"]["interfaces"])}\n')

        # Display endpoints
        print('📡 Available Endpoints:')
        for endpoint in data['endpoints']:
            print(f'   {endpoint["method"]} {endpoint["path"]}')
            if endpoint.get('queryParams'):
                print(f'      Params: {", ".join(endpoint["queryParams"])}')

        # Display utilities
        print('\n🔧 Server Utilities:')
        for util in data['utilities']:
            print(f'   {util["file"]}')
            print(f'      Functions: {", ".join(util["functions"])}')

        # Display types
        print('\n📦 Type Interfaces:')
        for iface in data['types']['interfaces']:
            print(f'   {iface["name"]}')
            print(f'      Fields: {len(iface["fields"])}')

        return data

    except requests.exceptions.RequestException as e:
        print(f'❌ Error fetching generated documentation: {e}')
        raise


def analyze_api(data: Dict[str, Any]) -> None:
    """AI-style analysis of the API."""
    print('\n🤖 AI Analysis of API Architecture...\n')

    # Analyze endpoint patterns
    methods = {}
    for endpoint in data['endpoints']:
        method = endpoint['method']
        methods[method] = methods.get(method, 0) + 1

    print('📊 API Analysis:')
    print('\n   HTTP Methods:')
    for method, count in methods.items():
        print(f'      {method}: {count} endpoint(s)')

    # Identify key architectural components
    print('\n   Key Components:')
    components = [
        {'name': 'Data Fetching', 'file': 'googleSheets.ts'},
        {'name': 'Person Identification', 'file': 'personIdentifier.ts'},
        {'name': 'Installment Processing', 'file': 'installmentProcessor.ts'},
        {'name': 'Filtering', 'file': 'transactionFilters.ts'}
    ]

    for component in components:
        util = next((u for u in data['utilities'] if u['file'] == component['file']), None)
        if util:
            print(f'      ✓ {component["name"]}: {len(util["functions"])} function(s)')
        else:
            print(f'      ✗ {component["name"]}: Not found')

    # Check Transaction type structure
    print('\n   Transaction Type:')
    transaction_type = next(
        (i for i in data['types']['interfaces'] if i['name'] == 'Transaction'),
        None
    )

    if transaction_type:
        print(f'      Fields: {len(transaction_type["fields"])}')
        for field in transaction_type['fields'][:5]:
            print(f'         - {field.strip()}')
        if len(transaction_type['fields']) > 5:
            print(f'         ... and {len(transaction_type["fields"]) - 5} more')


def search_documentation(query: str, markdown: str) -> None:
    """Search documentation for specific information."""
    print(f'\n🔍 Searching documentation for: "{query}"\n')

    lines = markdown.splitlines()
    results = [
        {'line': line, 'index': i}
        for i, line in enumerate(lines)
        if query.lower() in line.lower()
    ][:10]

    if not results:
        print('   No results found.')
    else:
        print(f'   Found {len(results)} occurrences:\n')
        for result in results:
            print(f'   Line {result["index"] + 1}: {result["line"].strip()}')


def verify_documentation(markdown: str, data: Dict[str, Any]) -> None:
    """Compare documented vs. actual endpoints."""
    print('\n✅ Verifying Documentation Accuracy...\n')
    print('   Checking endpoint coverage:')

    all_documented = True

    for endpoint in data['endpoints']:
        endpoint_str = f'{endpoint["method"]} {endpoint["path"]}'
        is_documented = endpoint_str in markdown
        status = '✓' if is_documented else '✗'
        print(f'      {status} {endpoint_str}')

        if not is_documented:
            all_documented = False

    if all_documented:
        print('\n   ✅ All endpoints are documented!')
    else:
        print('\n   ⚠️  Some endpoints are missing from documentation')


def extract_sections(markdown: str) -> List[str]:
    """Extract section headers from markdown."""
    lines = markdown.splitlines()
    return [
        line.replace('## ', '').strip()
        for line in lines
        if line.startswith('## ')
    ]


def save_to_file(markdown: str, filename: str = 'api-documentation.md') -> None:
    """Save documentation to a file."""
    print(f'\n💾 Saving documentation to {filename}...')
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f'✅ Saved successfully!')


def export_metadata(data: Dict[str, Any], filename: str = 'api-metadata.json') -> None:
    """Export metadata to JSON file."""
    print(f'\n💾 Exporting metadata to {filename}...')
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'✅ Exported successfully!')


def main():
    """Main execution."""
    print('🤖 AI Documentation Consumer Example (Python)\n')
    print('This script demonstrates how to consume the documentation API\n')
    print('=' * 70)

    try:
        # Example 1: Fetch and display architecture documentation
        markdown = fetch_architecture_doc()

        # Example 2: Fetch and analyze generated documentation
        generated = fetch_generated_doc()

        # Example 3: AI-style analysis
        analyze_api(generated)

        # Example 4: Search for specific information
        search_documentation('query parameters', markdown)

        # Example 5: Verify documentation accuracy
        verify_documentation(markdown, generated)

        # Optional: Save to files
        # save_to_file(markdown)
        # export_metadata(generated)

        print('\n' + '=' * 70)
        print('✅ Documentation consumer example completed successfully!')
        print('\n💡 Use this pattern to integrate with AI agents, CI/CD, or other tools.')

    except Exception as e:
        print(f'\n❌ Example failed: {e}')
        print('\n💡 Make sure the dev server is running: npm run dev')
        exit(1)


if __name__ == '__main__':
    main()

"""
Azure AI Search Integration Module
Provides intelligent search capabilities for news, portfolio, and learning content
"""

import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchField,
    SearchFieldDataType
)
from typing import List, Dict, Optional
from datetime import datetime

# Load environment variables
load_dotenv()

# Azure AI Search credentials
SEARCH_ENDPOINT = os.getenv('AI_SEARCH_ENDPOINT')
SEARCH_KEY = os.getenv('AI_SEARCH_KEY')

# Index names
NEWS_INDEX_NAME = "news-index"
PORTFOLIO_INDEX_NAME = "portfolio-index"


def get_search_client(index_name: str) -> Optional[SearchClient]:
    """Initialize and return Azure Search client for a specific index"""
    if not SEARCH_ENDPOINT or not SEARCH_KEY:
        print("WARNING: Azure AI Search credentials not configured")
        return None
    
    try:
        credential = AzureKeyCredential(SEARCH_KEY)
        client = SearchClient(
            endpoint=SEARCH_ENDPOINT,
            index_name=index_name,
            credential=credential
        )
        return client
    except Exception as e:
        print(f"ERROR: Failed to initialize Azure Search client: {str(e)}")
        return None


def get_index_client() -> Optional[SearchIndexClient]:
    """Initialize and return Azure Search Index client for managing indexes"""
    if not SEARCH_ENDPOINT or not SEARCH_KEY:
        print("WARNING: Azure AI Search credentials not configured")
        return None
    
    try:
        credential = AzureKeyCredential(SEARCH_KEY)
        client = SearchIndexClient(
            endpoint=SEARCH_ENDPOINT,
            credential=credential
        )
        return client
    except Exception as e:
        print(f"ERROR: Failed to initialize Azure Search Index client: {str(e)}")
        return None


def create_news_index():
    """Create the news search index if it doesn't exist"""
    index_client = get_index_client()
    if not index_client:
        return False
    
    try:
        # Define the index schema
        fields = [
            SimpleField(name="id", type=SearchFieldDataType.String, key=True),
            SearchableField(name="title", type=SearchFieldDataType.String, searchable=True),
            SearchableField(name="description", type=SearchFieldDataType.String, searchable=True),
            SimpleField(name="source", type=SearchFieldDataType.String, filterable=True, facetable=True),
            SimpleField(name="pubDate", type=SearchFieldDataType.DateTimeOffset, filterable=True, sortable=True),
            SimpleField(name="url", type=SearchFieldDataType.String),
            # Use SearchField for Collection types with explicit configuration
            SearchField(name="tickers", type=SearchFieldDataType.Collection(SearchFieldDataType.String), 
                       searchable=True, filterable=True, facetable=True),
            SimpleField(name="sentiment", type=SearchFieldDataType.String, filterable=True, facetable=True),
            SimpleField(name="sentimentScore", type=SearchFieldDataType.Double, filterable=True, sortable=True),
            SimpleField(name="positiveScore", type=SearchFieldDataType.Double, sortable=True),
            SimpleField(name="neutralScore", type=SearchFieldDataType.Double, sortable=True),
            SimpleField(name="negativeScore", type=SearchFieldDataType.Double, sortable=True),
        ]
        
        # Create the index
        index = SearchIndex(name=NEWS_INDEX_NAME, fields=fields)
        result = index_client.create_index(index)
        print(f"✓ News index '{NEWS_INDEX_NAME}' created successfully")
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to create news index: {str(e)}")
        return False


def delete_news_index():
    """Delete the news search index"""
    index_client = get_index_client()
    if not index_client:
        return False
    
    try:
        index_client.delete_index(NEWS_INDEX_NAME)
        print(f"✓ News index '{NEWS_INDEX_NAME}' deleted successfully")
        return True
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
            print(f"[AZURE SEARCH] Index '{NEWS_INDEX_NAME}' does not exist (already deleted)")
            return True
        print(f"ERROR: Failed to delete news index: {error_msg}")
        return False


def recreate_news_index():
    """Delete and recreate the news search index with correct schema"""
    print("[AZURE SEARCH] Recreating news index...")
    
    # First, try to delete
    delete_result = delete_news_index()
    
    # Wait longer for Azure to process the deletion (Azure operations can be async)
    print("[AZURE SEARCH] Waiting 5 seconds for deletion to complete...")
    import time
    time.sleep(5)
    
    # Then create with new schema
    create_result = create_news_index()
    
    if create_result:
        print("[AZURE SEARCH] Index successfully recreated with correct schema")
    
    return create_result


def get_index_schema():
    """Get the current index schema for debugging"""
    index_client = get_index_client()
    if not index_client:
        return None
    
    try:
        index = index_client.get_index(NEWS_INDEX_NAME)
        schema = {}
        for field in index.fields:
            schema[field.name] = {
                'type': str(field.type),
                'searchable': getattr(field, 'searchable', False),
                'filterable': getattr(field, 'filterable', False),
                'sortable': getattr(field, 'sortable', False),
                'facetable': getattr(field, 'facetable', False),
                'key': getattr(field, 'key', False)
            }
        return schema
    except Exception as e:
        print(f"ERROR: Failed to get index schema: {str(e)}")
        return None



def index_news_documents(news_items: List[Dict]) -> bool:
    """
    Index news documents into Azure AI Search
    
    Args:
        news_items: List of news items with sentiment data
        
    Returns:
        True if successful, False otherwise
    """
    print(f"[AZURE SEARCH] index_news_documents called with {len(news_items) if news_items else 0} items")
    
    client = get_search_client(NEWS_INDEX_NAME)
    if not client:
        print("[AZURE SEARCH] WARNING: Skipping indexing - search client not available")
        return False
    
    try:
        # Prepare documents for indexing
        documents = []
        for idx, item in enumerate(news_items):
            print(f"[AZURE SEARCH] Processing item {idx + 1}/{len(news_items)}: {item.get('title', 'NO TITLE')[:60]}...")
            
            # Generate unique ID
            doc_id = f"{item.get('title', 'unknown')[:50].replace(' ', '_')}_{idx}"
            doc_id = ''.join(c for c in doc_id if c.isalnum() or c == '_')[:100]
            
            # Extract sentiment data
            sentiment_data = item.get('sentiment', {})
            print(f"[AZURE SEARCH]   Sentiment data type: {type(sentiment_data)}, value: {sentiment_data}")
            
            sentiment_label = sentiment_data.get('label', 'neutral') if isinstance(sentiment_data, dict) else 'neutral'
            sentiment_score = sentiment_data.get('score', 0) if isinstance(sentiment_data, dict) else 0
            confidence = sentiment_data.get('confidence', {}) if isinstance(sentiment_data, dict) else {}
            
            # Parse pubDate
            pub_date = item.get('pubDate')
            if isinstance(pub_date, str):
                try:
                    pub_date = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                except:
                    pub_date = datetime.now()
            elif not isinstance(pub_date, datetime):
                pub_date = datetime.now()
            
            document = {
                'id': doc_id,
                'title': item.get('title', ''),
                'description': item.get('description', ''),
                'source': item.get('source', 'Unknown'),
                'pubDate': pub_date.isoformat(),
                'url': item.get('url', item.get('link', '')),
                'tickers': item.get('tickers', []) if isinstance(item.get('tickers'), list) else [],
                'sentiment': sentiment_label,
                'sentimentScore': float(sentiment_score),
                'positiveScore': float(confidence.get('positive', 0)),
                'neutralScore': float(confidence.get('neutral', 0)),
                'negativeScore': float(confidence.get('negative', 0)),
            }
            print(f"[AZURE SEARCH]   Document prepared: sentiment={sentiment_label}, score={sentiment_score}")
            documents.append(document)
        
        # Upload documents in batches
        if documents:
            print(f"[AZURE SEARCH] Uploading {len(documents)} documents to Azure AI Search...")
            result = client.upload_documents(documents=documents)
            success_count = sum(1 for r in result if r.succeeded)
            failed_count = len(documents) - success_count
            
            if failed_count > 0:
                print(f"[AZURE SEARCH] WARNING: {failed_count} documents failed to index")
                for r in result:
                    if not r.succeeded:
                        print(f"[AZURE SEARCH] ERROR indexing doc {r.key}: {r.error_message}")
            
            print(f"[AZURE SEARCH] ✓ Successfully indexed {success_count}/{len(documents)} news documents")
            return success_count > 0
        
        print("[AZURE SEARCH] WARNING: No documents to index")
        return False
        
    except Exception as e:
        import traceback
        print(f"[AZURE SEARCH] ERROR: Failed to index news documents: {str(e)}")
        print(f"[AZURE SEARCH] Traceback: {traceback.format_exc()}")
        return False


def search_news(
    query: str = "*",
    sentiment_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    tickers: Optional[List[str]] = None,
    top: int = 20
) -> List[Dict]:
    """
    Search news with filters using Azure AI Search
    
    Args:
        query: Search query text
        sentiment_filter: Filter by sentiment (positive, neutral, negative)
        date_from: Filter news from this date (ISO format)
        date_to: Filter news until this date (ISO format)
        tickers: Filter by stock tickers
        top: Number of results to return
        
    Returns:
        List of matching news items
    """
    client = get_search_client(NEWS_INDEX_NAME)
    if not client:
        print("WARNING: Search client not available, returning empty results")
        return []
    
    try:
        # Build filter expression
        filters = []
        if sentiment_filter:
            filters.append(f"sentiment eq '{sentiment_filter}'")
        if date_from:
            filters.append(f"pubDate ge {date_from}")
        if date_to:
            filters.append(f"pubDate le {date_to}")
        if tickers:
            ticker_filters = " or ".join([f"tickers/any(t: t eq '{ticker}')" for ticker in tickers])
            filters.append(f"({ticker_filters})")
        
        filter_expression = " and ".join(filters) if filters else None
        
        # Execute search
        results = client.search(
            search_text=query if query and query != "*" else None,
            filter=filter_expression,
            select=['id', 'title', 'description', 'source', 'pubDate', 'url', 
                   'sentiment', 'sentimentScore', 'positiveScore', 'neutralScore', 'negativeScore', 'tickers'],
            top=top,
            order_by=['pubDate desc', 'sentimentScore desc']
        )
        
        # Convert results to list
        documents = []
        for result in results:
            doc = dict(result)
            # Reconstruct sentiment object for frontend compatibility
            doc['sentiment'] = {
                'label': doc.get('sentiment', 'neutral'),
                'score': doc.get('sentimentScore', 0),
                'confidence': {
                    'positive': doc.get('positiveScore', 0),
                    'neutral': doc.get('neutralScore', 0),
                    'negative': doc.get('negativeScore', 0)
                }
            }
            documents.append(doc)
        
        return documents
        
    except Exception as e:
        print(f"ERROR: Search failed: {str(e)}")
        return []


def get_search_suggestions(query: str, top: int = 5) -> List[str]:
    """
    Get autocomplete suggestions for search query
    
    Args:
        query: Partial search query
        top: Number of suggestions to return
        
    Returns:
        List of suggested search terms
    """
    client = get_search_client(NEWS_INDEX_NAME)
    if not client or not query:
        return []
    
    try:
        # Search for matching titles
        results = client.search(
            search_text=query,
            select=['title'],
            top=top,
            search_mode='any'
        )
        
        suggestions = [result['title'] for result in results if result.get('title')]
        return suggestions[:top]
        
    except Exception as e:
        print(f"ERROR: Autocomplete failed: {str(e)}")
        return []
    

def get_search_facets() -> Dict:
    """
    Get facets (aggregations) for filtering
    
    Returns:
        Dictionary with facet counts
    """
    client = get_search_client(NEWS_INDEX_NAME)
    if not client:
        return {}
    
    try:
        results = client.search(
            search_text="*",
            facets=['sentiment', 'source', 'tickers'],
            top=0  # We only want facets, not documents
        )
        
        facets = {}
        for facet_result in results.get_facets():
            facets[facet_result] = results.get_facets()[facet_result]
        
        return facets
        
    except Exception as e:
        print(f"ERROR: Failed to get facets: {str(e)}")
        return {}

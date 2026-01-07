"""
Azure AI Language Service - Sentiment Analysis Module
Provides news sentiment analysis using Azure AI Language
"""

import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.textanalytics import TextAnalyticsClient
from typing import List, Dict, Optional

# Load environment variables
load_dotenv()

# Azure AI Language credentials
AI_LANGUAGE_KEY = os.getenv('AI_LANGUAGE')
AI_ENDPOINT = os.getenv('AI_ENDPOINT')


def get_language_client() -> Optional[TextAnalyticsClient]:
    """Initialize and return Azure AI Language client"""
    if not AI_LANGUAGE_KEY or not AI_ENDPOINT:
        print("WARNING: Azure AI Language credentials not configured")
        return None
    
    try:
        credential = AzureKeyCredential(AI_LANGUAGE_KEY)
        client = TextAnalyticsClient(endpoint=AI_ENDPOINT, credential=credential)
        return client
    except Exception as e:
        print(f"ERROR: Failed to initialize Azure AI Language client: {str(e)}")
        return None


def analyze_news_sentiment(news_items: List[Dict]) -> List[Dict]:
    """
    Analyze sentiment for a list of news items using Azure AI Language.
    
    Args:
        news_items: List of news dictionaries with 'title' and 'description' keys
        
    Returns:
        List of news items with added sentiment analysis fields
    """
    client = get_language_client()
    
    if not client:
        # Return news items without sentiment if client not available
        for item in news_items:
            item['sentiment'] = {
                'label': 'unavailable',
                'score': 0,
                'confidence': {'positive': 0, 'neutral': 0, 'negative': 0}
            }
        return news_items
    
    try:
        # Prepare documents for analysis (combine title + description)
        documents = []
        for idx, item in enumerate(news_items):
            title = item.get('title', '')
            description = item.get('description', '')
            # Combine title and description for better context
            text = f"{title}. {description}".strip()
            
            # Azure AI Language has a 5120 character limit per document
            if len(text) > 5000:
                text = text[:5000]
            
            documents.append({
                'id': str(idx),
                'language': 'en',
                'text': text
            })
        
        # Process in batches (Azure allows up to 10 documents per request)
        batch_size = 10
        enriched_items = []
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            # Analyze sentiment
            response = client.analyze_sentiment(documents=batch, show_opinion_mining=False)
            
            for doc_idx, doc in enumerate(response):
                original_idx = i + doc_idx
                item = news_items[original_idx].copy()
                
                if not doc.is_error:
                    # Add sentiment data in the format expected by frontend
                    item['sentiment'] = {
                        'label': doc.sentiment,
                        'score': round(max(
                            doc.confidence_scores.positive,
                            doc.confidence_scores.neutral,
                            doc.confidence_scores.negative
                        ), 3),
                        'confidence': {
                            'positive': round(doc.confidence_scores.positive, 3),
                            'neutral': round(doc.confidence_scores.neutral, 3),
                            'negative': round(doc.confidence_scores.negative, 3)
                        }
                    }
                else:
                    # Handle errors
                    item['sentiment'] = {
                        'label': 'error',
                        'score': 0,
                        'confidence': {'positive': 0, 'neutral': 0, 'negative': 0},
                        'error': doc.error.message
                    }
                
                enriched_items.append(item)
        
        return enriched_items
        
    except Exception as e:
        print(f"ERROR: Sentiment analysis failed: {str(e)}")
        # Return original items with error status
        for item in news_items:
            item['sentiment'] = {
                'label': 'error',
                'score': 0,
                'confidence': {'positive': 0, 'neutral': 0, 'negative': 0},
                'error': str(e)
            }
        return news_items


def analyze_single_text(text: str) -> Dict:
    """
    Analyze sentiment for a single text string.
    
    Args:
        text: Text to analyze
        
    Returns:
        Dictionary with sentiment analysis results
    """
    client = get_language_client()
    
    if not client:
        return {
            'sentiment': 'unavailable',
            'scores': {'positive': 0, 'neutral': 0, 'negative': 0},
            'error': 'Azure AI Language service not configured'
        }
    
    try:
        # Truncate if too long
        if len(text) > 5000:
            text = text[:5000]
        
        documents = [{'id': '1', 'language': 'en', 'text': text}]
        response = client.analyze_sentiment(documents=documents, show_opinion_mining=False)
        
        result = response[0]
        if not result.is_error:
            return {
                'sentiment': result.sentiment,
                'scores': {
                    'positive': round(result.confidence_scores.positive, 3),
                    'neutral': round(result.confidence_scores.neutral, 3),
                    'negative': round(result.confidence_scores.negative, 3)
                },
                'confidence': round(max(
                    result.confidence_scores.positive,
                    result.confidence_scores.neutral,
                    result.confidence_scores.negative
                ), 3)
            }
        else:
            return {
                'sentiment': 'error',
                'scores': {'positive': 0, 'neutral': 0, 'negative': 0},
                'error': result.error.message
            }
            
    except Exception as e:
        return {
            'sentiment': 'error',
            'scores': {'positive': 0, 'neutral': 0, 'negative': 0},
            'error': str(e)
        }


def get_sentiment_summary(news_items: List[Dict]) -> Dict:
    """
    Generate summary statistics for sentiment analysis results.
    
    Args:
        news_items: List of news items with sentiment data
        
    Returns:
        Dictionary with sentiment summary statistics
    """
    if not news_items:
        return {
            'total': 0,
            'positive': 0,
            'neutral': 0,
            'negative': 0,
            'averageScores': {'positive': 0, 'neutral': 0, 'negative': 0},
            'overallSentiment': 'neutral'
        }
    
    positive_count = sum(1 for item in news_items if item.get('sentiment', {}).get('label') == 'positive')
    neutral_count = sum(1 for item in news_items if item.get('sentiment', {}).get('label') == 'neutral')
    negative_count = sum(1 for item in news_items if item.get('sentiment', {}).get('label') == 'negative')
    
    # Calculate average scores
    valid_items = [item for item in news_items if item.get('sentiment', {}).get('confidence')]
    
    if valid_items:
        avg_positive = sum(item['sentiment']['confidence']['positive'] for item in valid_items) / len(valid_items)
        avg_neutral = sum(item['sentiment']['confidence']['neutral'] for item in valid_items) / len(valid_items)
        avg_negative = sum(item['sentiment']['confidence']['negative'] for item in valid_items) / len(valid_items)
    else:
        avg_positive = avg_neutral = avg_negative = 0
    
    # Determine overall sentiment
    if avg_positive > avg_negative and avg_positive > avg_neutral:
        overall = 'positive'
    elif avg_negative > avg_positive and avg_negative > avg_neutral:
        overall = 'negative'
    else:
        overall = 'neutral'
    
    return {
        'total': len(news_items),
        'positive': positive_count,
        'neutral': neutral_count,
        'negative': negative_count,
        'positivePercent': round((positive_count / len(news_items)) * 100, 1) if news_items else 0,
        'neutralPercent': round((neutral_count / len(news_items)) * 100, 1) if news_items else 0,
        'negativePercent': round((negative_count / len(news_items)) * 100, 1) if news_items else 0,
        'averageScores': {
            'positive': round(avg_positive, 3),
            'neutral': round(avg_neutral, 3),
            'negative': round(avg_negative, 3)
        },
        'overallSentiment': overall
    }

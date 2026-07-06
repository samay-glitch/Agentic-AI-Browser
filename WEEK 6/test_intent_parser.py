import pytest
from intent_parser import parse_intent

def test_navigate_intent():
    """Test that a navigation command is correctly parsed."""
    command = "Please navigate to google.com"
    intent = parse_intent(command)
    assert intent.action == "navigate"
    assert "url" in intent.parameters
    assert intent.parameters["url"] == "https://google.com"

def test_fill_form_intent():
    """Test that a form filling command is correctly parsed."""
    command = "Fill out the login form with my details"
    intent = parse_intent(command)
    assert intent.action == "fill_form"
    assert "selector" in intent.parameters
    assert "data" in intent.parameters

def test_email_intent():
    """Test that an email sending command is correctly parsed."""
    command = "Send an email to the HR department"
    intent = parse_intent(command)
    assert intent.action == "email"
    assert "recipient" in intent.parameters
    assert "subject" in intent.parameters

def test_summarize_intent():
    """Test that a summarization command is correctly parsed."""
    command = "Can you summarize this long article for me?"
    intent = parse_intent(command)
    assert intent.action == "summarize"
    assert "source" in intent.parameters

def test_click_intent():
    """Test that a clicking command is correctly parsed."""
    command = "Click the big blue submit button"
    intent = parse_intent(command)
    assert intent.action == "click"
    assert "selector" in intent.parameters

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from pocketbase import PocketBase
import os
from google.adk.tools import ToolContext

pocketbase = PocketBase(os.getenv('POCKETBASE_URL'))

class ChatRequest(BaseModel):
    query: str
    organization_id: str
    reset: Optional[bool] = False
    session_id: Optional[str] = None

def create_ticket(
        tool_context: ToolContext, 
        title: str = "",
        description: str = "",
        tags: Optional[List[str]] = None,
        priority: Optional[str] = None,
        customer_email: str = None,
        customer_name: Optional[str] = None,
        customer_phone: Optional[str] = None,
        ) -> Dict[str, Any]:
    """
    Create a new ticket in the database. 
    Make sure to collect all the information from the user for the description.

    Args:
        title: str - The title of the ticket
        description: str - The description of the ticket
        tags: Optional[List[str]] - Any appropriate tags of the ticket, limit to 1-3
        priority: Optional[str] - The priority of the ticket, one of "low", "medium", "high", "urgent"
        customer_email: str - The email of the customer, make sure to ask for it if not provided (ensure it is a valid email)
        customer_name: Optional[str] - The name of the customer, make sure to ask for it if not provided
        customer_phone: Optional[str] - The phone number of the customer (optional)
    
    Returns:
        dict: A dictionary containing the created task or error information.
    """
    organization_id = tool_context.state.get("organization_id")
    if organization_id is None:
        return {"error": "Organization ID is required. Please ask the user to contact human support"}
    if title == "" or description == "":
        return {"error": "Title and description are required"}
    if tags is None:
        tags = []
    if priority is None or priority not in ["low", "medium", "high", "urgent"]:
        priority = "medium"
    if not customer_email:
        return {"error": "Customer email is required"}
    if not customer_name:
        return {"error": "Customer name is required"}
    
    try:
        record = pocketbase.collection('tickets').create({
            "title": title,
            "description": description,
            "tags": tags,
            "priority": priority,
            "customerEmail": customer_email,
            "customerInfo": {
                "name": customer_name,
                "phone": customer_phone,
                "email": customer_email,
            },
            "organizationId": organization_id,
        })
    except Exception as e:
        return {"error": f"Failed to create ticket: {e}"}
    if record is None:
        return {"error": "Failed to create ticket"}
    return {"success": "Ticket created successfully", "ticket_id": record.id}


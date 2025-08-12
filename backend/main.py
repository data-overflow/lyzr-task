from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from google.adk.agents import Agent
from google.adk.sessions import DatabaseSessionService
from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import Runner
from google.genai import types
from pocketbase import PocketBase
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(override=True)

from utils import ChatRequest, create_ticket, before_agent_modifier

APPLICATION_NAME = 'chatbased'

app = FastAPI(title=APPLICATION_NAME)
session_service = DatabaseSessionService(os.environ.get('DATABASE_URL'))
artifact_service = InMemoryArtifactService()
pocketbase = PocketBase(os.environ.get('POCKETBASE_URL'))

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def root():
    return {'message': 'ChatBased is running', 'version': '1.0.0'}

@app.post('/chat')
async def chat(request: ChatRequest):
    if request.session_id is not None:
        session = await session_service.get_session(
            app_name=APPLICATION_NAME,
            user_id=request.organization_id,
            session_id=request.session_id
        )
        if not session:
            print(f"Session {request.session_id} not found. Creating new session.")
            request.session_id = None
            request.reset = True
        else:
            print(f"Session {request.session_id} found. Using existing session.")

    if request.reset or request.session_id is None:
        session_state = {
            "organization_id": request.organization_id,
            "customer_id": None,
            "customer_name": None,
            "customer_email": None,
            "customer_phone": None,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%I:%M:%S %p"),
            "day": datetime.now().strftime("%A"),
        }
        session = await session_service.create_session(
            app_name=APPLICATION_NAME,
            user_id=request.organization_id,
            state=session_state
        )
        pocketbase.collection('chat_sessions').create({
            "sessionId": session.id,
            "organizationId": request.organization_id,
        })
    
    session_id = session.id or request.session_id
    organization = pocketbase.collection('organizations').get_one(request.organization_id)
    if organization is None:
        return {"error": "Organization not found"}
    
    system_instruction = f"""
    You are a support agent for {organization.name}. Your role is to help the customer with their issues
    and answer any questions they have regarding the organization. Don't explicitly ask for the ticket details
    that they might want to provide. Assume the appropriate ticket details such as the title, description, etc.
    and don't mention these backend details to the customer. Get their details such as name, email & phone only
    if they want to raise a ticket or address some issue and provided details for the same.

    {organization.system_instruction}
    {organization.additional_instruction}

    """ + "Current date is {date} in yyyy-mm-dd format and time is {time}. Today is {day}"

    agent = Agent(
        name=APPLICATION_NAME,
        model=os.environ.get('MODEL'),
        description="Support Agent",
        instruction=system_instruction,
        before_agent_callback=before_agent_modifier,
        tools=[create_ticket]
    )

    runner = Runner(
        app_name=APPLICATION_NAME,
        agent=agent,
        session_service=session_service,
        artifact_service=artifact_service,
    )

    # TODO: Steaming responses
    events = runner.run(
        user_id=request.organization_id,
        session_id=session_id,
        new_message=types.Content(role="user", parts=[types.Part(text=request.query)])
    )

    final_response = ""
    thought_process = []

    for event in events:
        if event.is_final_response():
            if event.content and event.content.parts and event.content.parts[0].text:
                final_response = event.content.parts[0].text
        elif event.content and event.content.parts and event.content.parts[0].text:
            thought_process.append(event.content.parts[0].text)
        if event.get_function_calls():
            for fc in event.get_function_calls():
                print(f"Agent function call: {fc.name}, args: {fc.args}")
    
    return {
        "final_response": final_response,
        "thought_process": thought_process,
        "session_id": session_id,
        "organization_id": request.organization_id,
    }

@app.get("/session/{organization_id}")
async def get_session(organization_id: str):
    session_state = {
        "organization_id": organization_id,
        "customer_id": None,
        "customer_name": None,
        "customer_email": None,
        "customer_phone": None,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%I:%M:%S %p"),
        "day": datetime.now().strftime("%A"),
    }
    session = await session_service.create_session(
        app_name=APPLICATION_NAME,
        user_id=organization_id,
        state=session_state
    )
    pocketbase_session = pocketbase.collection('chat_sessions').create({
        "sessionId": session.id,
        "organizationId": organization_id,
    })
    return {"session_id": session.id, "pocketbase_session_id": pocketbase_session.id}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
import os
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()


class SmokeResponse(BaseModel):
    message: str
    status: str


model = os.getenv("LLM_MODEL_FAST", "gpt-4o-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

completion = client.beta.chat.completions.parse(
    model=model,
    messages=[{"role": "user", "content": "Respond with a smoke test confirmation."}],
    response_format=SmokeResponse,
)

parsed = completion.choices[0].message.parsed
usage = completion.usage

print(f"Model: {model}")
print(f"Parsed Result: {parsed.model_dump()}")
print(
    f"Token Counts: prompt={usage.prompt_tokens}, completion={usage.completion_tokens}, total={usage.total_tokens}"
)

"""Ollama service for local AI chat and text processing."""
import logging
import httpx
from typing import Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with Ollama for text-based AI tasks."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2"):
        """
        Initialize Ollama service.

        Args:
            base_url: Ollama server URL
            model: Model name to use (default: llama3.2 for text)
        """
        self.base_url = base_url
        self.model = model
        self.client = None

    async def is_available(self) -> bool:
        """
        Check if Ollama is available and responsive.

        Returns:
            True if Ollama is running and has the required model
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    models = [m["name"] for m in data.get("models", [])]
                    # Check if our preferred model is available
                    has_model = any(self.model in m for m in models)
                    if not has_model:
                        logger.warning(f"Ollama is running but {self.model} not found. Available: {models}")
                    return has_model
                return False
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False

    def _get_client(self) -> ChatOllama:
        """Get or create ChatOllama client."""
        if self.client is None:
            self.client = ChatOllama(
                base_url=self.base_url,
                model=self.model,
                temperature=0.7,
            )
        return self.client

    async def enhance_refinement_prompt(
        self,
        original_prompt: str,
        refinement_instruction: str,
        asset_context: Optional[dict] = None
    ) -> str:
        """
        Use Ollama to enhance a refinement instruction into a better prompt.

        This takes a user's natural language refinement like "make it darker"
        and combines it with the original prompt to create an enhanced prompt
        for image generation.

        Args:
            original_prompt: The original prompt used to generate the asset
            refinement_instruction: User's natural language refinement request
            asset_context: Optional context about the asset (tags, project, etc.)

        Returns:
            Enhanced prompt for image generation

        Example:
            original = "fantasy potion bottle"
            refinement = "make it glow with purple liquid"
            result = "fantasy potion bottle with glowing purple liquid, luminescent effect"
        """
        try:
            client = self._get_client()

            # Build context string
            context_str = ""
            if asset_context:
                if asset_context.get("style_tags"):
                    context_str += f"\\nStyle tags: {', '.join(asset_context['style_tags'])}"
                if asset_context.get("project_name"):
                    context_str += f"\\nProject: {asset_context['project_name']}"

            # System message to guide the AI
            system_msg = SystemMessage(content="""You are an AI assistant helping game developers refine their asset generation prompts.

Your task: Take an original prompt and a refinement instruction, then create an enhanced prompt that incorporates the refinement.

Rules:
1. Keep the original concept intact
2. Add the refinement naturally
3. Be specific and descriptive
4. Keep it concise (under 200 characters)
5. Focus on visual details
6. Don't add conversational language - just the prompt

Examples:
Original: "pixel art sword"
Refinement: "make it blue"
Output: "pixel art sword with blue blade and hilt"

Original: "forest background"
Refinement: "add more trees and make it darker"
Output: "dense dark forest background with many trees, nighttime atmosphere"

Original: "potion bottle"
Refinement: "make it glow purple"
Output: "potion bottle with glowing purple liquid, luminescent effect"
""")

            # User message with the actual task
            user_msg = HumanMessage(content=f"""Original prompt: "{original_prompt}"
Refinement: "{refinement_instruction}"{context_str}

Enhanced prompt:""")

            # Get response from Ollama
            response = client.invoke([system_msg, user_msg])
            enhanced_prompt = response.content.strip()

            # Remove quotes if Ollama added them
            enhanced_prompt = enhanced_prompt.strip('"').strip("'")

            logger.info(f"Enhanced prompt: '{original_prompt}' + '{refinement_instruction}' → '{enhanced_prompt}'")
            return enhanced_prompt

        except Exception as e:
            logger.error(f"Failed to enhance prompt with Ollama: {e}")
            # Fallback: simple concatenation
            fallback = f"{original_prompt}, {refinement_instruction}"
            logger.info(f"Using fallback prompt: {fallback}")
            return fallback

    async def parse_quick_action(self, action: str, original_prompt: str) -> str:
        """
        Convert a quick-action button press into a refinement instruction.

        Args:
            action: One of "darker", "lighter", "more_detail", "less_detail", "remove_bg"
            original_prompt: The original asset prompt

        Returns:
            Natural language instruction for the action
        """
        action_map = {
            "darker": "make the colors darker and increase contrast",
            "lighter": "make the colors lighter and brighter",
            "more_detail": "add more intricate details and texture",
            "less_detail": "simplify and reduce details for a cleaner look",
            "remove_bg": "remove the background, make it transparent",
        }

        instruction = action_map.get(action.lower(), action)
        return await self.enhance_refinement_prompt(original_prompt, instruction)

    async def chat_response(self, message: str, context: Optional[str] = None) -> str:
        """
        General chat response for helping users with asset creation.

        This is for future chat interface features beyond just refinement.

        Args:
            message: User's message
            context: Optional context string

        Returns:
            AI's response
        """
        try:
            client = self._get_client()

            system_msg = SystemMessage(content="""You are a helpful assistant for game developers creating 2D game assets.

You help with:
- Suggesting improvements to asset prompts
- Answering questions about game asset creation
- Providing creative ideas for game art

Keep responses concise and focused on practical advice.""")

            messages = [system_msg]
            if context:
                messages.append(SystemMessage(content=f"Context: {context}"))
            messages.append(HumanMessage(content=message))

            response = client.invoke(messages)
            return response.content

        except Exception as e:
            logger.error(f"Chat response failed: {e}")
            return "I'm having trouble connecting right now. Please try again."


# Global instance
ollama_service = OllamaService()

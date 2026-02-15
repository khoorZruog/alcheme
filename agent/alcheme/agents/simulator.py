"""Simulator agent stub for forward compatibility.

The preview image generation in Phase 2 runs as server-side post-processing
(not an ADK sub-agent). This stub is prepared for Phase 3+ where the Simulator
may become a full LlmAgent with style control and regeneration capabilities.
"""

# from google.adk.agents import LlmAgent
#
# def create_simulator_agent() -> LlmAgent:
#     """Create the Simulator agent (Phase 3+)."""
#     return LlmAgent(
#         name="simulator_agent",
#         model="gemini-2.5-flash",
#         instruction="...",
#         tools=[...],
#     )
